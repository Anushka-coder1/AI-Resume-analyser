const express = require('express')
const authMiddleware = require('../middlewares/auth.middleware')
const controller = require('../controllers/mock-interview.controller')

const mockInterviewRouter = express.Router()

mockInterviewRouter.use(authMiddleware.authUser)

/**
 * @route POST /api/mock-interview/start/:reportId
 * @description start a mock interview from a report's questions. Body: { mode: 'technical'|'behavioral'|'mixed', count: 3|5|8|10 }
 * @access private
 */
mockInterviewRouter.post('/start/:reportId', controller.startMockInterviewController)

/**
 * @route GET /api/mock-interview/report/:reportId
 * @description list past mock interviews for a report
 * @access private
 */
mockInterviewRouter.get('/report/:reportId', controller.listMockInterviewsForReportController)

/**
 * @route POST /api/mock-interview/:sessionId/answer
 * @description answer the current question. Body: { answer: string } or { skip: true }
 * @access private
 */
mockInterviewRouter.post('/:sessionId/answer', controller.answerMockInterviewController)

/**
 * @route POST /api/mock-interview/:sessionId/finish
 * @description end the interview (early) and build the scorecard
 * @access private
 */
mockInterviewRouter.post('/:sessionId/finish', controller.finishMockInterviewController)

mockInterviewRouter.get('/:sessionId', controller.getMockInterviewController)
mockInterviewRouter.delete('/:sessionId', controller.deleteMockInterviewController)

module.exports = mockInterviewRouter
