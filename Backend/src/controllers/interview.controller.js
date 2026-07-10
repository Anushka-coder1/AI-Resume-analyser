const pdfParse = require("pdf-parse")
const generateInterviewReport = require("../services/ai.service")
const interviewReportModel= require("../models/interview.model")

/**
 * @description Controller to generate report based on resume , self description and job description
 */

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

/**
 * @description Controller to get report by interview id
 */

async function getInterviewReportByIdController(req,res){
  const { interviewId} = req.params

  const interviewReport = await interviewReportModel.findOne({
    _id : interviewId,
    user:req.user.id
  })

  if(!interviewReport){
    return res.status(404).json({
      message:"interview report not found"
    })
  }

  res.status(200).json({
    message:"interview report fetched successfully.",
    interviewReport
  })
}

/**
 * @description get all interview by user id
 */

async function getAllInterviewReportaController(req,res){
  const { interviewId} = req.params

  const interviewReports = await interviewReportModel.findOne({
    user:req.user.id
  }).sort({createdAt:-1}).select("-resume -selfDescription -jobDescription -_v -techicalQuestion  -behaviouralQuestion -skillGaps -preparationPlan")

  if(!interviewReports){
    return res.status(404).json({
      message:"interview report not found"
    })
  }

  res.status(200).json({
    message:"interview report fetched successfully.",
    interviewReport
  })
}


module.exports = {generateInterviewReportController , getInterviewReportByIdController , getAllInterviewReportaController}