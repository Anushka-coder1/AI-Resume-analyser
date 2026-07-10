const { PDFParse } = require('pdf-parse')
const generateInterviewReport = require('../services/ai.service')
const interviewReportModel = require('../models/interview.model')

async function generateInterviewReportController(req, res) {
  const { selfDescription = '', jobDescription = '' } = req.body

  if (!jobDescription.trim()) {
    return res.status(400).json({
      message: 'Job description is required',
    })
  }

  if (!req.file && !selfDescription.trim()) {
    return res.status(400).json({
      message: 'Upload a resume or provide a self description',
    })
  }

  let resumeText = ''

  if (req.file) {
    const parser = new PDFParse({ data: Uint8Array.from(req.file.buffer) })
    const parsedResume = await parser.getText()
    resumeText = parsedResume.text.trim()
    await parser.destroy()
  }

  const interviewReportByAi = await generateInterviewReport({
    resume: resumeText,
    selfDescription: selfDescription.trim(),
    jobDescription: jobDescription.trim(),
  })

  const interviewReport = await interviewReportModel.create({
    user: req.user.id,
    resume: resumeText,
    selfDescription: selfDescription.trim(),
    jobDescription: jobDescription.trim(),
    ...interviewReportByAi,
  })

  res.status(201).json({
    message: 'Interview report generated successfully',
    interviewReport,
  })
}

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

async function getAllInterviewReportaController(req, res) {
  const interviewReports = await interviewReportModel
    .find({
      user: req.user.id,
    })
    .sort({ createdAt: -1 })
    .select('title matchScore createdAt updatedAt')

  res.status(200).json({
    message: 'Interview reports fetched successfully.',
    interviewReports,
  })
}

module.exports = {
  generateInterviewReportController,
  getInterviewReportByIdController,
  getAllInterviewReportaController,
}
