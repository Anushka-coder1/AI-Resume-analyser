const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const interviewController = require('../controllers/interview.controller')
const upload = require("../middlewares/file.middleware")

const interviewRouter = express.Router()

/**
 * @router POST /api/interview
 * @description generate new interview report on the basis of user self description resume pdf and job description
 * @access private
 */
interviewRouter.post('/',authMiddleware.authUser,upload.single("resume"),interviewController.generateInterviewReportController)

/**
 * @router POST /api/interview/report/:interviewId
 * @description generate new interview report on the basis of user self description resume pdf and job description
 * @access private
 */
interviewRouter.get('/report/:interviewId',authMiddleware.authUser,upload.single("resume"),interviewController.getInterviewReportByIdController)

/**
 * @router POST /api/interview/
 * @description get all interview report by logged in user
 * @access private
 */
interviewRouter.get('/interview',authMiddleware.authUser,upload.single("resume"),interviewController.getAllInterviewReportaController)

module.exports = interviewRouter