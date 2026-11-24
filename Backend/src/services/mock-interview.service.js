/**
 * Pure helpers for mock interview sessions: question selection, offline
 * (rule-based) answer grading, scoring and summaries. No DB or AI calls here.
 */

const MODES = ['technical', 'behavioral', 'mixed']
const ALLOWED_COUNTS = [3, 5, 8, 10]
const ALLOWED_TIME_LIMITS = [0, 60, 120, 180]
const MAX_ANSWER_LENGTH = 4000

function normaliseTimeLimit(value) {
  const seconds = Number.parseInt(value, 10)
  return ALLOWED_TIME_LIMITS.includes(seconds) ? seconds : 0
}

function normaliseTimeTaken(value) {
  const seconds = Number(value)
  return Number.isFinite(seconds) && seconds >= 0 ? Math.min(Math.round(seconds), 3600) : null
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'your', 'you', 'are', 'was', 'were', 'have', 'has',
  'had', 'will', 'would', 'should', 'could', 'can', 'about', 'into', 'how', 'what', 'when', 'where', 'which',
  'why', 'who', 'their', 'them', 'they', 'then', 'than', 'also', 'such', 'each', 'other', 'some', 'any',
  'all', 'not', 'but', 'its', 'our', 'out', 'use', 'used', 'using', 'like', 'more', 'most', 'very', 'just',
  'answer', 'question', 'candidate', 'interviewer', 'explain', 'mention', 'cover', 'points', 'example',
])

function normaliseMode(mode) {
  return MODES.includes(mode) ? mode : 'mixed'
}

function normaliseCount(count) {
  const value = Number.parseInt(count, 10)
  return ALLOWED_COUNTS.includes(value) ? value : 5
}

function toQuestion(item, type) {
  return {
    question: String(item.question || '').trim(),
    type,
    intention: String(item.intention || '').trim(),
    modelAnswer: String(item.answer || '').trim(),
  }
}

/**
 * Pick questions from a report. Mixed mode alternates technical and behavioral
 * questions, starting with technical, and fills from whichever list is left.
 */
function pickQuestions(report, { mode = 'mixed', count = 5 } = {}) {
  const technical = (report.technicalQuestions || []).map((q) => toQuestion(q, 'technical')).filter((q) => q.question)
  const behavioral = (report.behavioralQuestions || []).map((q) => toQuestion(q, 'behavioral')).filter((q) => q.question)
  const safeMode = normaliseMode(mode)
  const safeCount = normaliseCount(count)

  if (safeMode === 'technical') return technical.slice(0, safeCount)
  if (safeMode === 'behavioral') return behavioral.slice(0, safeCount)

  const picked = []
  let t = 0
  let b = 0
  while (picked.length < safeCount && (t < technical.length || b < behavioral.length)) {
    const wantTechnical = picked.length % 2 === 0
    if ((wantTechnical && t < technical.length) || b >= behavioral.length) picked.push(technical[t++])
    else picked.push(behavioral[b++])
  }
  return picked
}

function keywords(text) {
  return new Set(
    String(text || '')
      .toLowerCase()
      .replace(/[^a-z0-9+#.\s-]/g, ' ')
      .split(/\s+/)
      .map((word) => word.replace(/^[.-]+|[.-]+$/g, ''))
      .filter((word) => word.length > 2 && !STOP_WORDS.has(word))
  )
}

const clamp = (value, min = 0, max = 10) => Math.min(max, Math.max(min, Math.round(Number(value) || 0)))

const STAR_PATTERNS = {
  situation: /\b(situation|when i was|at my (previous|last)|during|in my (role|internship|project)|once)\b/i,
  task: /\b(task|goal|responsib|needed to|had to|objective|challenge)\b/i,
  action: /\b(i (built|created|implemented|led|designed|decided|wrote|organized|organised|took|worked|fixed|talked|proposed|added))\b/i,
  result: /\b(result|outcome|as a result|improv|reduc|increas|achiev|learn|deliver|saved|%|percent)\b/i,
}

/**
 * Rule-based grading used when Gemini is unavailable. It compares the answer's
 * keywords with the model answer and intention, and looks at length and
 * (for behavioral questions) STAR structure.
 */
function fallbackEvaluate({ type, intention, modelAnswer, userAnswer, inputMode = 'text' }) {
  const answer = String(userAnswer || '').trim()
  const words = answer ? answer.split(/\s+/).length : 0

  if (words < 5) {
    return {
      score: words === 0 ? 0 : 1,
      criteria: { relevance: words ? 1 : 0, depth: 0, structure: 0, communication: words ? 1 : 0 },
      feedback: 'The answer is too short to evaluate. Aim for at least 3–5 sentences that explain your reasoning with an example.',
      improvedAnswer: modelAnswer,
      needsFollowUp: false,
      followUpQuestion: '',
      evaluatedBy: 'fallback',
    }
  }

  const expected = keywords(`${modelAnswer} ${intention}`)
  const given = keywords(answer)
  const overlap = [...expected].filter((word) => given.has(word))
  const coverage = expected.size ? overlap.length / Math.min(expected.size, 25) : 0.5

  const relevance = clamp(2 + coverage * 10)
  const depth = clamp(Math.min(words / 12, 6) + coverage * 5)
  const punctuated = answer.split(/[.!?]+/).filter((s) => s.trim().split(/\s+/).length >= 3).length
  // Speech transcripts have little punctuation; estimate sentences from length instead.
  const sentences = inputMode === 'voice' ? Math.max(punctuated, Math.round(words / 15)) : punctuated

  let structure
  let starMissing = []
  if (type === 'behavioral') {
    const parts = Object.entries(STAR_PATTERNS).filter(([, pattern]) => pattern.test(answer))
    starMissing = Object.keys(STAR_PATTERNS).filter((key) => !parts.some(([name]) => name === key))
    structure = clamp(2 + parts.length * 2)
  } else {
    structure = clamp(3 + Math.min(sentences, 5))
  }
  const communication = clamp(words > 250 ? 6 : 4 + Math.min(sentences, 4))

  const score = clamp(relevance * 0.35 + depth * 0.3 + structure * 0.2 + communication * 0.15)

  const tips = []
  if (coverage < 0.3) tips.push('Cover more of the key points the interviewer is looking for.')
  if (words < 40) tips.push('Add more detail and a concrete example.')
  if (type === 'behavioral' && starMissing.length) tips.push(`Use the STAR format — your answer is missing: ${starMissing.join(', ')}.`)
  if (words > 250) tips.push('Be more concise; keep answers to about 1–2 minutes.')
  if (!tips.length) tips.push('Good coverage of the key points. Keep it concrete and measurable.')

  const lowerQuality = score < 5 && words >= 5
  return {
    score,
    criteria: { relevance, depth, structure, communication },
    feedback: tips.join(' '),
    improvedAnswer: modelAnswer,
    needsFollowUp: lowerQuality,
    followUpQuestion: lowerQuality
      ? (type === 'behavioral'
        ? 'Can you walk me through a specific example — what exactly did you do, and what was the result?'
        : 'Can you go a bit deeper — how would you apply this in a real project, and what trade-offs would you consider?')
      : '',
    evaluatedBy: 'fallback',
  }
}

/** Overall score 0–100 from answered turns. Follow-ups count half. */
function computeOverallScore(turns) {
  let total = 0
  let weight = 0
  for (const turn of turns) {
    if (turn.score === null || turn.score === undefined) continue
    const w = turn.isFollowUp ? 0.5 : 1
    total += turn.score * w
    weight += w
  }
  return weight ? Math.round((total / weight) * 10) : 0
}

const CRITERIA_LABELS = {
  relevance: 'answering the actual question',
  depth: 'technical depth and detail',
  structure: 'structuring answers (e.g. STAR)',
  communication: 'clear, concise communication',
}

function buildFallbackSummary({ turns, skillGaps = [] }) {
  const graded = turns.filter((turn) => turn.criteria && !turn.skipped)
  const averages = {}
  for (const key of Object.keys(CRITERIA_LABELS)) {
    averages[key] = graded.length ? graded.reduce((sum, turn) => sum + (turn.criteria[key] || 0), 0) / graded.length : 0
  }

  const strengths = Object.entries(averages).filter(([, v]) => v >= 7).map(([k]) => `Strong at ${CRITERIA_LABELS[k]}.`)
  const improvements = Object.entries(averages).filter(([, v]) => v < 6).map(([k]) => `Work on ${CRITERIA_LABELS[k]}.`)
  const skipped = turns.filter((turn) => turn.skipped).length
  if (skipped) improvements.push(`You skipped ${skipped} question${skipped > 1 ? 's' : ''} — practise those topics.`)
  if (!strengths.length && graded.length) strengths.push('You attempted the questions — keep practising to build confidence.')

  const weakText = turns.filter((turn) => turn.skipped || (turn.score ?? 10) < 5).map((turn) => turn.question.toLowerCase()).join(' ')
  const gapNames = skillGaps.map((gap) => gap.skill).filter(Boolean)
  let weakSkills = gapNames.filter((skill) => weakText.includes(skill.toLowerCase()))
  if (!weakSkills.length) {
    weakSkills = skillGaps.filter((gap) => gap.severity === 'high' || gap.severity === 'medium').map((gap) => gap.skill)
  }

  const score = computeOverallScore(turns)
  const verdict = score >= 80 ? 'Interview ready — strong performance.'
    : score >= 60 ? 'Good foundation — polish a few areas before the real interview.'
      : score >= 40 ? 'Needs more practice — focus on the improvement areas below.'
        : 'Early stage — review the model answers and try again.'

  return { verdict, strengths, improvements, weakSkills: weakSkills.slice(0, 5) }
}

/**
 * Shape a session for the client. The model answer for the question that is
 * currently being asked is hidden so the user cannot peek at it.
 */
function toPublicSession(session) {
  const doc = typeof session.toObject === 'function' ? session.toObject() : session
  const turns = (doc.turns || []).map((turn) => {
    const answered = turn.userAnswer !== null && turn.userAnswer !== undefined
    const { modelAnswer, intention, ...rest } = turn
    return answered ? turn : rest
  })
  return {
    _id: doc._id,
    report: doc.report,
    title: doc.title,
    mode: doc.mode,
    status: doc.status,
    timeLimitSeconds: doc.timeLimitSeconds || 0,
    turns,
    totalQuestions: (doc.turns || []).filter((t) => !t.isFollowUp).length + (doc.pendingQuestions || []).length,
    remainingQuestions: (doc.pendingQuestions || []).length,
    overallScore: doc.overallScore,
    summary: doc.summary,
    createdAt: doc.createdAt,
    completedAt: doc.completedAt,
  }
}

module.exports = {
  MODES,
  ALLOWED_COUNTS,
  ALLOWED_TIME_LIMITS,
  MAX_ANSWER_LENGTH,
  normaliseTimeLimit,
  normaliseTimeTaken,
  pickQuestions,
  fallbackEvaluate,
  computeOverallScore,
  buildFallbackSummary,
  toPublicSession,
  normaliseMode,
  normaliseCount,
}
