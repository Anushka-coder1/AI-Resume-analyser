const express = require('express')
const { authUser } = require('../middlewares/auth.middleware')
const controller = require('../controllers/roadmap.controller')

const router = express.Router()
router.use(authUser)
router.post('/generate', controller.generateRoadmapController)
router.get('/', controller.listRoadmapsController)
router.get('/:id', controller.getRoadmapController)
router.get('/:id/progress', controller.getProgressController)
router.patch('/:id', controller.updateRoadmapController)
router.delete('/:id', controller.deleteRoadmapController)
router.patch('/:id/tasks/:taskId', controller.updateTaskController)
router.patch('/:id/tasks/:taskId/time', controller.updateTaskTimeController)
router.post('/:id/regenerate', controller.regenerateRoadmapController)

module.exports = router
