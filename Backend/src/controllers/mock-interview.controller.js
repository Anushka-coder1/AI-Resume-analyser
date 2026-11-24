const mongoose = require('mongoose')
const interviewReportModel = require('../models/interview.model')
const mockInterviewModel = require('../models/mock-interview.model')
const { evaluateMockAnswer, summarizeMockInterview } = require('../services/ai.service')
const {
  MAX_ANSWER_LENGTH,
  pickQuestions,
  computeOverallScore,
  toPublicSession,
  normaliseMode,
  normaliseCount,
  normaliseTimeLimit,
  normaliseTimeTaken,
} = require('../services/mock-interview.service')

function currentTurn(session) {
  const last = session.turns[session.turns.length - 1]
  return last && (last.userAnswer === null || last.userAnswer === undefined) ? last : null
}

async function findOwnedSession(req, res) {
  const { sessionId } = req.params
  if (!mongoose.isValidObjectId(sessionId)) {
    res.status(400).json({ message: 'Invalid mock interview id' })
    return null
  }
  const session = await mockInterviewModel.findOne({ _id: sessionId, user: req.user.id })
  if (!session) {
    res.status(404).json({ message: 'Mock interview not found' })
    return null
  }
  return session
}

async function completeSession(session) {
  // Drop an unanswered question left open when the user ends early.
  const open = currentTurn(session)
  if (open) session.turns.pop()
  session.pendingQuestions = []

  const report = await interviewReportModel.findById(session.report).select('title skillGaps')
  session.overallScore = computeOverallScore(session.turns)
  session.summary = await summarizeMockInterview({
    title: report?.title || session.title,
    turns: session.turns,
    skillGaps: report?.skillGaps || [],
  })
  session.status = 'completed'
  session.completedAt = new Date()
}

/**
 * @description Start a mock interview using questions from an interview report
 */
async function startMockInterviewController(req, res) {
  const { reportId } = req.params
  if (!mongoose.isValidObjectId(reportId)) {
    return res.status(400).json({ message: 'Invalid report id' })
  }

  const report = await interviewReportModel
    .findOne({ _id: reportId, user: req.user.id })
    .select('title technicalQuestions behavioralQuestions')
  if (!report) {
    return res.status(404).json({ message: 'Interview report not found' })
  }

  const mode = normaliseMode(req.body?.mode)
  const questions = pickQuestions(report, { mode, count: normaliseCount(req.body?.count) })
  if (!questions.length) {
    return res.status(400).json({ message: `This report has no ${mode === 'mixed' ? '' : `${mode} `}questions to practise.` })
  }

  const [first, ...rest] = questions
  const session = await mockInterviewModel.create({
    user: req.user.id,
    report: report._id,
    title: report.title,
    mode,
    timeLimitSeconds: normaliseTimeLimit(req.body?.timeLimitSeconds),
    pendingQuestions: rest,
    turns: [{ ...first, askedAt: new Date() }],
  })

  res.status(201).json({
    message: 'Mock interview started',
    mockInterview: toPublicSession(session),
  })
}

/**
 * @description Submit (or skip) the answer to the current question; returns feedback and the next question
 */
async function answerMockInterviewController(req, res) {
  const session = await findOwnedSession(req, res)
  if (!session) return

  if (session.status === 'completed') {
    return res.status(409).json({ message: 'This mock interview is already completed' })
  }

  const turn = currentTurn(session)
  if (!turn) {
    return res.status(409).json({ message: 'There is no open question to answer' })
  }

  const skip = req.body?.skip === true
  const answer = String(req.body?.answer || '').trim()
  const inputMode = req.body?.inputMode === 'voice' ? 'voice' : 'text'
  const timeTakenSeconds = normaliseTimeTaken(req.body?.timeTakenSeconds)
  if (!skip && !answer) {
    return res.status(400).json({ message: 'Type or speak an answer, or skip the question' })
  }
  if (answer.length > MAX_ANSWER_LENGTH) {
    return res.status(400).json({ message: `Answers can be at most ${MAX_ANSWER_LENGTH} characters` })
  }

  let evaluation
  if (skip) {
    evaluation = {
      score: 0,
      criteria: { relevance: 0, depth: 0, structure: 0, communication: 0 },
      feedback: 'Skipped. Review the model answer below before your real interview.',
      improvedAnswer: turn.modelAnswer,
      needsFollowUp: false,
      followUpQuestion: '',
      evaluatedBy: 'none',
    }
  } else {
    evaluation = await evaluateMockAnswer({
      question: turn.question,
      type: turn.type,
      intention: turn.intention,
      modelAnswer: turn.modelAnswer,
      userAnswer: answer,
      isFollowUp: turn.isFollowUp,
      inputMode,
    })
  }

  Object.assign(turn, {
    userAnswer: skip ? '' : answer,
    skipped: skip,
    score: evaluation.score,
    criteria: evaluation.criteria,
    feedback: evaluation.feedback,
    improvedAnswer: evaluation.improvedAnswer,
    evaluatedBy: evaluation.evaluatedBy,
    inputMode: skip ? 'text' : inputMode,
    timeTakenSeconds,
    answeredAt: new Date(),
  })

  const canFollowUp = evaluation.needsFollowUp && !turn.isFollowUp && session.followUpsUsed < session.maxFollowUps
  if (canFollowUp) {
    session.followUpsUsed += 1
    session.turns.push({
      question: evaluation.followUpQuestion,
      type: turn.type,
      intention: turn.intention,
      modelAnswer: turn.modelAnswer,
      isFollowUp: true,
      askedAt: new Date(),
    })
  } else if (session.pendingQuestions.length) {
    const next = session.pendingQuestions.shift()
    session.turns.push({ ...next.toObject(), askedAt: new Date() })
  } else {
    await completeSession(session)
  }

  await session.save()

  res.status(200).json({
    message: session.status === 'completed' ? 'Mock interview completed' : 'Answer evaluated',
    mockInterview: toPublicSession(session),
  })
}

/**
 * @description End a mock interview early and generate the scorecard
 */
async function finishMockInterviewController(req, res) {
  const session = await findOwnedSession(req, res)
  if (!session) return

  if (session.status !== 'completed') {
    await completeSession(session)
    await session.save()
  }

  res.status(200).json({
    message: 'Mock interview completed',
    mockInterview: toPublicSession(session),
  })
}

/**
 * @description Get one mock interview session
 */
async function getMockInterviewController(req, res) {
  const session = await findOwnedSession(req, res)
  if (!session) return
  res.status(200).json({ mockInterview: toPublicSession(session) })
}

/**
 * @description List past mock interviews for a report (newest first)
 */
async function listMockInterviewsForReportController(req, res) {
  const { reportId } = req.params
  if (!mongoose.isValidObjectId(reportId)) {
    return res.status(400).json({ message: 'Invalid report id' })
  }
  const sessions = await mockInterviewModel
    .find({ user: req.user.id, report: reportId })
    .sort({ createdAt: -1 })
    .limit(20)
    .select('mode status overallScore createdAt completedAt turns.isFollowUp turns.score')

  const mockInterviews = sessions.map((session) => ({
    _id: session._id,
    mode: session.mode,
    status: session.status,
    overallScore: session.overallScore,
    questionsAnswered: session.turns.filter((turn) => !turn.isFollowUp && turn.score !== null).length,
    createdAt: session.createdAt,
    completedAt: session.completedAt,
  }))

  res.status(200).json({ mockInterviews })
}

async function deleteMockInterviewController(req, res) {
  const session = await findOwnedSession(req, res)
  if (!session) return
  await session.deleteOne()
  res.status(204).send()
}

module.exports = {
  startMockInterviewController,
  answerMockInterviewController,
  finishMockInterviewController,
  getMockInterviewController,
  listMockInterviewsForReportController,
  deleteMockInterviewController,
}
