const mongoose = require('mongoose')
const { PDFParse } = require('pdf-parse')
const {generateInterviewReport , generateResumePdf} = require('../services/ai.service')
const interviewReportModel = require('../models/interview.model')
const { analyseSkillMatch } = require('../services/skill-matching.service')
const { Analysis, Roadmap, RoadmapProgress, SkillGap } = require('../models/roadmap.model')

function parseCursor(cursor) {
  if (!cursor) return null
  try {
    const value = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'))
    if (!value.createdAt || !value.id) throw new Error('Invalid cursor')
    return { createdAt: new Date(value.createdAt), id: value.id }
  } catch {
    return null
  }
}

function toCursor(document) {
  return Buffer.from(JSON.stringify({
    createdAt: document.createdAt.toISOString(),
    id: document._id.toString(),
  })).toString('base64url')
}

/**
 * @description Controller to generate interview report based on user self description , resume and job description
 */

async function generateInterviewReportController(req, res) {
  let { selfDescription = '', jobDescription = '' } = req.body
  const { previousReportId } = req.body
  const resumeFile = req.files?.resume?.[0]
  let jobDescriptionFile = req.files?.jobDescriptionFile?.[0]

  // Re-upload: a new resume version analysed against the previous report's job description.
  let previousReport = null
  if (previousReportId) {
    if (!mongoose.isValidObjectId(previousReportId)) {
      return res.status(400).json({ message: 'Invalid previous report id' })
    }
    previousReport = await interviewReportModel.findOne({ _id: previousReportId, user: req.user.id })
    if (!previousReport) {
      return res.status(404).json({ message: 'Previous report not found' })
    }
    if (!resumeFile) {
      return res.status(400).json({ message: 'Upload the new resume version as a PDF' })
    }
    jobDescription = previousReport.jobDescription
    jobDescriptionFile = undefined
    if (!selfDescription.trim()) selfDescription = previousReport.selfDescription || ''
  }

  if (!jobDescription.trim() && !jobDescriptionFile) {
    return res.status(400).json({
      message: 'Paste a job description or upload a job description PDF',
    })
  }

  if (!resumeFile && !selfDescription.trim()) {
    return res.status(400).json({
      message: 'Upload a resume or provide a self description',
    })
  }

  const extractPdfText = async (file) => {
    const parser = new PDFParse({ data: Uint8Array.from(file.buffer) })
    try {
      const parsed = await parser.getText()
      return parsed.text.trim()
    } finally {
      await parser.destroy()
    }
  }

  const resumeText = resumeFile ? await extractPdfText(resumeFile) : ''
  const uploadedJobDescription = jobDescriptionFile ? await extractPdfText(jobDescriptionFile) : ''
  const fullJobDescription = [jobDescription.trim(), uploadedJobDescription].filter(Boolean).join('\n\n')

  const matching = analyseSkillMatch({
    resume: resumeText,
    selfDescription: selfDescription.trim(),
    jobDescription: fullJobDescription,
  })

  const interviewReportByAi = await generateInterviewReport({
    resume: resumeText,
    selfDescription: selfDescription.trim(),
    jobDescription: fullJobDescription,
    matching: {
      matchScore: matching.matchScore,
      scoringMethod: matching.scoringMethod,
      skillGaps: matching.skillGaps,
      requirementEvidence: matching.requirements,
    },
  })

  const reportId = new mongoose.Types.ObjectId()
  let resumeGroup = reportId
  let version = 1

  if (previousReport) {
    resumeGroup = previousReport.resumeGroup || previousReport._id
    // Reports created before versioning existed have no group yet: make them v1.
    if (!previousReport.resumeGroup) {
      await interviewReportModel.updateOne(
        { _id: previousReport._id },
        { $set: { resumeGroup, version: previousReport.version || 1 } }
      )
    }
    const latest = await interviewReportModel
      .findOne({ user: req.user.id, resumeGroup })
      .sort({ version: -1 })
      .select('version')
    version = (latest?.version || previousReport.version || 1) + 1
  }

  const interviewReport = await interviewReportModel.create({
    _id: reportId,
    resumeGroup,
    version,
    user: req.user.id,
    resume: resumeText,
    selfDescription: selfDescription.trim(),
    jobDescription: fullJobDescription,
    ...interviewReportByAi,
  })

  res.status(201).json({
    message: 'Interview report generated successfully',
    interviewReport,
  })
}

/**
 * @description Controller to get interview report be interviewId
 */

async function getInterviewReportByIdController(req, res) {
  const { interviewId } = req.params

  const interviewReport = await interviewReportModel.findOne({
    _id: interviewId,
    user: req.user.id,
  })

  if (!interviewReport) {
    return res.status(404).json({
      message: 'Interview report not found',
    })
  }

  res.status(200).json({
    message: 'Interview report fetched successfully.',
    interviewReport,
  })
}

/**
 * @description Controller to list every resume version analysed against the same job description
 */
async function getReportVersionsController(req, res) {
  const { interviewId } = req.params
  if (!mongoose.isValidObjectId(interviewId)) {
    return res.status(400).json({ message: 'Invalid report id' })
  }

  const report = await interviewReportModel
    .findOne({ _id: interviewId, user: req.user.id })
    .select('resumeGroup')

  if (!report) {
    return res.status(404).json({ message: 'Interview report not found' })
  }

  const group = report.resumeGroup || report._id
  const documents = await interviewReportModel
    .find({ user: req.user.id, $or: [{ resumeGroup: group }, { _id: group }] })
    .sort({ version: 1, createdAt: 1 })
    .select('version matchScore createdAt requirementEvidence.skill requirementEvidence.matched')

  const versions = documents.map((doc) => {
    const evidence = doc.requirementEvidence || []
    return {
      _id: doc._id,
      version: doc.version || 1,
      matchScore: doc.matchScore ?? 0,
      createdAt: doc.createdAt,
      matchedSkills: evidence.filter((item) => item.matched).map((item) => item.skill),
      totalSkills: evidence.length,
    }
  })

  res.status(200).json({
    message: 'Resume versions fetched successfully.',
    versions,
  })
}

/**
 * @description Controller to get all interview report by logged in user
 */

async function getAllInterviewReportaController(req, res) {
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), 25)
  const cursor = parseCursor(req.query.cursor)
  if (req.query.cursor && !cursor) {
    return res.status(400).json({ message: 'Invalid pagination cursor' })
  }

  const query = { user: req.user.id }
  if (cursor) {
    query.$or = [
      { createdAt: { $lt: cursor.createdAt } },
      { createdAt: cursor.createdAt, _id: { $lt: cursor.id } },
    ]
  }

  const results = await interviewReportModel
    .find(query)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .select('title matchScore version createdAt updatedAt')

  const hasMore = results.length > limit
  const interviewReports = hasMore ? results.slice(0, limit) : results

  res.status(200).json({
    message: 'Interview reports fetched successfully.',
    interviewReports,
    pageInfo: {
      hasMore,
      nextCursor: hasMore ? toCursor(interviewReports[interviewReports.length - 1]) : null,
    },
  })
}

/**
 * @description Controller to generate pdf report based on user self description , resume and job description
 */
async function generateResumePdfController(req,res){
  const {interviewReportId} = req.params
  const interviewReport = await interviewReportModel.findOne({
    _id: interviewReportId,
    user: req.user.id,
  })

  if(!interviewReport){
    return res.status(404).json({
      message:"Interview Report Not Found."
    })
  }

  const {resume , jobDescription , selfDescription} = interviewReport

  const pdfBuffer = await generateResumePdf({resume ,jobDescription , selfDescription })

  res.set({
    "Content-Type" : "application/pdf",
    "Content-Disposition":`attachment;filename = resume_${interviewReportId}.pdf`
  })

  return res.send(pdfBuffer);
}

async function renameInterviewReportController(req, res) {
  const title = String(req.body.title || '').trim()
  if (!title || title.length > 140) return res.status(400).json({ message: 'Interview name must be between 1 and 140 characters' })
  const report = await interviewReportModel.findOneAndUpdate({ _id: req.params.interviewId, user: req.user.id }, { $set: { title } }, { new: true })
  if (!report) return res.status(404).json({ message: 'Interview report not found' })
  return res.status(200).json({ interviewReport: report })
}

async function deleteInterviewReportController(req, res) {
  const report = await interviewReportModel.findOneAndDelete({ _id: req.params.interviewId, user: req.user.id })
  if (!report) return res.status(404).json({ message: 'Interview report not found' })
  const analyses = await Analysis.find({ userId: req.user.id, sourceReportId: report._id }).select('_id')
  const analysisIds = analyses.map((analysis) => analysis._id)
  const roadmaps = await Roadmap.find({ userId: req.user.id, analysisId: { $in: analysisIds } }).select('_id')
  const roadmapIds = roadmaps.map((roadmap) => roadmap._id)
  if (roadmapIds.length) await RoadmapProgress.deleteMany({ userId: req.user.id, roadmapId: { $in: roadmapIds } })
  if (analysisIds.length) await SkillGap.deleteMany({ analysisId: { $in: analysisIds } })
  if (roadmapIds.length) await Roadmap.deleteMany({ _id: { $in: roadmapIds }, userId: req.user.id })
  if (analysisIds.length) await Analysis.deleteMany({ _id: { $in: analysisIds }, userId: req.user.id })
  return res.status(204).send()
}



module.exports = {
  generateInterviewReportController,
  getInterviewReportByIdController,
  getAllInterviewReportaController,
  generateResumePdfController,
  getReportVersionsController,
  renameInterviewReportController,
  deleteInterviewReportController,
}
