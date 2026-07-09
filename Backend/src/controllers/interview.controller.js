const pdfParse = require("pdf-parse")
const generateInterviewReport = require("../services/ai.service")
const interviewReportModel= require("../models/interview.model")

async function generateInterviewReportController(req,res){
  const resumeFile = req.file

  const resumeContent = (new pdfParse.PDFParse(Uint8Array.from(req.file.buffer))).getText
  const {selfDescription , jobDescription} = req.body

  const interviewReportBtAi = await generateInterviewReport({
    resume:resumeContent.text,
    selfDescription,
    jobDescription
  })

  const interviewReport = await interviewReportModel.create({
    user:req.user.id,
    resume:resumeContent,
    selfDescription,
    jobDescription,
    ...interviewReportBtAi
  })

  res.status(201).json({
    message:"interview report generated successsfully",
    interviewReport
  })

}

module.exports = {generateInterviewReportController}