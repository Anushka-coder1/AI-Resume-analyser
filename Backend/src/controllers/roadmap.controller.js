const { Roadmap } = require('../models/roadmap.model')
const roadmapService = require('../services/roadmap.service')

function sendError(res, error) {
  return res.status(error.statusCode || 400).json({ message: error.message || 'Unable to process roadmap request' })
}

async function generateRoadmapController(req, res) {
  try {
    const result = await roadmapService.generateRoadmap({ userId: req.user.id, ...req.body })
    return res.status(201).json({ message: 'Roadmap generated successfully', ...result })
  } catch (error) { return sendError(res, error) }
}

async function listRoadmapsController(req, res) {
  const roadmaps = await Roadmap.find({ userId: req.user.id }).sort({ createdAt: -1 }).select('-learningPathVersions')
  return res.status(200).json({ roadmaps })
}

async function getRoadmapController(req, res) {
  try { return res.status(200).json(await roadmapService.getRoadmapDetails({ userId: req.user.id, roadmapId: req.params.id })) }
  catch (error) { return sendError(res, error) }
}

async function getProgressController(req, res) {
  try {
    const detail = await roadmapService.getRoadmapDetails({ userId: req.user.id, roadmapId: req.params.id })
    return res.status(200).json({ progress: detail.progress })
  } catch (error) { return sendError(res, error) }
}

async function updateTaskController(req, res) {
  const { status } = req.body
  if (!['pending', 'in_progress', 'completed', 'skipped'].includes(status)) return res.status(400).json({ message: 'A valid task status is required' })
  try { return res.status(200).json(await roadmapService.updateTask({ userId: req.user.id, roadmapId: req.params.id, taskId: req.params.taskId, updates: { status } })) }
  catch (error) { return sendError(res, error) }
}

async function updateTaskTimeController(req, res) {
  const value = Number(req.body.timeSpent)
  if (!Number.isFinite(value) || value < 0) return res.status(400).json({ message: 'timeSpent must be a non-negative number' })
  try { return res.status(200).json(await roadmapService.updateTask({ userId: req.user.id, roadmapId: req.params.id, taskId: req.params.taskId, updates: { timeSpent: value } })) }
  catch (error) { return sendError(res, error) }
}

async function regenerateRoadmapController(req, res) {
  try { return res.status(200).json({ message: 'Roadmap regenerated successfully', ...(await roadmapService.regenerateRoadmap({ userId: req.user.id, roadmapId: req.params.id, ...req.body })) }) }
  catch (error) { return sendError(res, error) }
}

module.exports = { generateRoadmapController, listRoadmapsController, getRoadmapController, getProgressController, updateTaskController, updateTaskTimeController, regenerateRoadmapController }
