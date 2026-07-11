const { PDFParse } = require('pdf-parse')
const {generateInterviewReport , generateResumePdf} = require('../services/ai.service')
const interviewReportModel = require('../models/interview.model')

/**
 * @description Controller to generate interview report based on user self description , resume and job description
 */

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
 * @description Controller to get all interview report by logged in user
 */

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

/**
 * @description Controller to generate pdf report based on user self description , resume and job description
 */
async function generateResumePdfController(req,res){
  const {interviewReportId} = req.params
  const interviewReport = await interviewReportModel.findById(interviewReportId)

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



module.exports = {
  generateInterviewReportController,
  getInterviewReportByIdController,
  getAllInterviewReportaController,
  generateResumePdfController
}
