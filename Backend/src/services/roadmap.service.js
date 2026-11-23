const mongoose = require('mongoose')
const interviewReportModel = require('../models/interview.model')
const { Skill, SkillAlias, LearningPath, Topic, Resource, LearningProject } = require('../models/learning-knowledge.model')
const { Analysis, SkillGap, Roadmap, RoadmapProgress } = require('../models/roadmap.model')

const IMPORTANCE_WEIGHT = { high: 3, medium: 2, low: 1 }
const normalise = (value = '') => String(value).toLowerCase().replace(/[^a-z0-9+#.]/g, '')
const priorityFor = (weight) => (weight >= 5 ? 'high' : weight >= 3 ? 'medium' : 'low')
const dayAt = (startDate, dayNumber) => {
  const date = new Date(startDate)
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + dayNumber - 1)
  return date
}

async function resolveSkill(skillName) {
  const key = normalise(skillName)
  let skill = await Skill.findOne({ normalizedName: key, isActive: true })
  if (skill) return skill

  const alias = await SkillAlias.findOne({ aliases: key }).populate({ path: 'skillId', match: { isActive: true } })
  return alias?.skillId || null
}

async function createAnalysisFromReport({ userId, reportId }) {
  if (!mongoose.isValidObjectId(reportId)) throw new Error('Invalid report id')
  const report = await interviewReportModel.findOne({ _id: reportId, user: userId })
  if (!report) {
    const error = new Error('Interview report not found')
    error.statusCode = 404
    throw error
  }

  let analysis = await Analysis.findOne({ userId, sourceReportId: report._id })
  if (!analysis) {
    analysis = await Analysis.create({
      userId,
      sourceReportId: report._id,
      resumeMetadata: { extractedTextAvailable: Boolean(report.resume) },
      jobDescription: report.jobDescription,
      targetRole: report.title,
      overallMatchScore: report.matchScore ?? 0,
      analysisStatus: 'completed',
    })
  }

  // Reports created before requirementEvidence existed still contain skillGaps.
  // Synchronize either source every time so an existing empty analysis is repaired.
  const evidence = report.requirementEvidence || []
  const sourceGaps = evidence.length
    ? evidence.map((item) => ({
      skill: item.skill,
      weight: item.weight,
      matched: item.matched,
      jobEvidence: item.jobEvidence,
      candidateEvidence: item.candidateEvidence,
    }))
    : (report.skillGaps || []).map((item) => ({
      skill: item.skill,
      weight: item.severity === 'high' ? 5 : item.severity === 'medium' ? 3 : 1,
      matched: false,
      jobEvidence: 'Marked as a skill gap in the interview report.',
      candidateEvidence: null,
    }))
  const gaps = await Promise.all(sourceGaps.map(async (item) => {
    const skill = await resolveSkill(item.skill)
    const importance = priorityFor(item.weight)
    return {
      analysisId: analysis._id,
      skillId: skill?._id || null,
      skillName: item.skill,
      requiredLevel: item.weight >= 5 ? 'advanced' : item.weight >= 3 ? 'intermediate' : 'beginner',
      userLevel: item.matched ? 'matched' : 'not_assessed',
      matchScore: item.matched ? 100 : 0,
      gapStatus: item.matched ? 'matched' : skill ? 'missing' : 'needs_verification',
      importance,
      reason: item.matched
        ? 'This requirement was found in the candidate profile.'
        : (item.candidateEvidence || item.jobEvidence || 'This requirement was not found in the candidate profile.'),
    }
  }))
  await Promise.all(gaps.map((gap) => SkillGap.findOneAndUpdate(
    { analysisId: analysis._id, skillName: gap.skillName },
    { $set: gap },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  )))
  return analysis
}

async function getOwnedAnalysis({ userId, analysisId, reportId }) {
  if (analysisId) {
    if (!mongoose.isValidObjectId(analysisId)) throw new Error('Invalid analysis id')
    const analysis = await Analysis.findOne({ _id: analysisId, userId })
    if (!analysis) {
      const error = new Error('Analysis not found')
      error.statusCode = 404
      throw error
    }
    return analysis
  }
  if (!reportId) throw new Error('analysisId or reportId is required')
  return createAnalysisFromReport({ userId, reportId })
}

function orderTopics(topics) {
  const byId = new Map(topics.map((topic) => [String(topic._id), topic]))
  const visited = new Set()
  const visiting = new Set()
  const ordered = []
  const visit = (topic) => {
    const id = String(topic._id)
    if (visited.has(id) || visiting.has(id)) return
    visiting.add(id)
    ;(topic.prerequisites || []).forEach((prerequisiteId) => {
      const prerequisite = byId.get(String(prerequisiteId))
      if (prerequisite) visit(prerequisite)
    })
    visiting.delete(id)
    visited.add(id)
    ordered.push(topic)
  }
  topics.sort((a, b) => a.order - b.order).forEach(visit)
  return ordered
}

async function loadLearningContent(gaps) {
  const result = []
  for (const gap of gaps) {
    const skill = gap.skillId ? await Skill.findById(gap.skillId) : await resolveSkill(gap.skillName)
    if (!skill) {
      result.push({ gap, skill: null, path: null, topics: [], resources: new Map(), project: null })
      continue
    }
    const path = await LearningPath.findOne({ skillId: skill._id, isActive: true }).sort({ version: -1 })
    if (!path) {
      result.push({ gap, skill, path: null, topics: [], resources: new Map(), project: null })
      continue
    }
    const topics = orderTopics(await Topic.find({ learningPathId: path._id }).sort({ order: 1 }))
    const resources = await Resource.find({ topicId: { $in: topics.map((topic) => topic._id) }, isVerified: true })
    const resourceMap = new Map()
    resources.forEach((resource) => {
      const key = String(resource.topicId)
      resourceMap.set(key, [...(resourceMap.get(key) || []), resource])
    })
    const project = await LearningProject.findOne({ skillIds: skill._id }).sort({ estimatedHours: 1 })
    result.push({ gap, skill, path, topics, resources: resourceMap, project })
  }
  return result.sort((a, b) => (IMPORTANCE_WEIGHT[b.gap.importance] || 0) - (IMPORTANCE_WEIGHT[a.gap.importance] || 0))
}

function buildSchedule({ content, dailyStudyHours, durationInDays, startDate, completedTopicIds = new Set() }) {
  const tasks = []
  let dayNumber = 1
  let remainingToday = dailyStudyHours
  const pushTask = ({ skill, topic, title, description, hours, resources = [], projectReference = null }) => {
    let remainingHours = hours
    let part = 1
    while (remainingHours > 0 && dayNumber <= durationInDays) {
      const allocation = Math.min(remainingHours, remainingToday)
      if (allocation <= 0) {
        dayNumber += 1
        remainingToday = dailyStudyHours
        continue
      }
      tasks.push({
        skillId: skill._id,
        topicId: topic?._id || null,
        title: remainingHours > allocation ? `${title} (part ${part})` : title,
        description,
        dayNumber,
        scheduledDate: dayAt(startDate, dayNumber),
        estimatedHours: Number(allocation.toFixed(2)),
        resources: resources.map((resource) => ({ title: resource.title, type: resource.type, url: resource.url, platform: resource.platform })),
        projectReference: projectReference?._id || null,
      })
      part += 1
      remainingHours = Number((remainingHours - allocation).toFixed(2))
      remainingToday = Number((remainingToday - allocation).toFixed(2))
      if (remainingToday <= 0) {
        dayNumber += 1
        remainingToday = dailyStudyHours
      }
    }
  }

  content.forEach(({ skill, topics, resources, project }) => {
    if (!skill) return
    topics.forEach((topic) => {
      if (!completedTopicIds.has(String(topic._id))) {
        pushTask({ skill, topic, title: topic.title, description: topic.description, hours: topic.estimatedHours, resources: resources.get(String(topic._id)) || [] })
      }
    })
    if (project && dayNumber <= durationInDays) {
      pushTask({ skill, title: project.title, description: project.description, hours: project.estimatedHours, projectReference: project })
    }
  })
  return tasks
}

function buildAiSchedule({ topics, dailyStudyHours, durationInDays, startDate }) {
  const tasks = []
  let dayNumber = 1
  let remainingToday = dailyStudyHours
  for (const topic of topics) {
    let remainingHours = topic.estimatedHours
    let part = 1
    while (remainingHours > 0 && dayNumber <= durationInDays) {
      const allocation = Math.min(remainingHours, remainingToday)
      if (allocation <= 0) { dayNumber += 1; remainingToday = dailyStudyHours; continue }
      tasks.push({
        skillId: null,
        topicId: null,
        title: remainingHours > allocation ? `${topic.title} (part ${part})` : topic.title,
        description: topic.description,
        dayNumber,
        scheduledDate: dayAt(startDate, dayNumber),
        estimatedHours: Number(allocation.toFixed(2)),
        resources: topic.resources,
        projectReference: null,
      })
      part += 1
      remainingHours = Number((remainingHours - allocation).toFixed(2))
      remainingToday = Number((remainingToday - allocation).toFixed(2))
      if (remainingToday <= 0) { dayNumber += 1; remainingToday = dailyStudyHours }
    }
  }
  return tasks
}

async function calculateProgress(roadmapId) {
  const tasks = await RoadmapProgress.find({ roadmapId }).select('status estimatedHours timeSpent skillId')
  const totalTasks = tasks.length
  const completed = tasks.filter((task) => task.status === 'completed')
  const estimatedHours = tasks.reduce((total, task) => total + task.estimatedHours, 0)
  const timeSpent = tasks.reduce((total, task) => total + task.timeSpent, 0)
  const overallProgress = totalTasks ? Math.round((completed.length / totalTasks) * 100) : 0
  const skillMap = new Map()
  tasks.forEach((task) => {
    const id = String(task.skillId || 'unassigned')
    const current = skillMap.get(id) || { skillId: task.skillId, total: 0, completed: 0 }
    current.total += 1
    if (task.status === 'completed') current.completed += 1
    skillMap.set(id, current)
  })
  const skillWise = [...skillMap.values()].map((item) => ({ ...item, progress: Math.round((item.completed / item.total) * 100) }))
  const weekly = new Map()
  tasks.forEach((task) => {
    const week = Math.ceil(task.dayNumber / 7)
    const data = weekly.get(week) || { week, total: 0, completed: 0, timeSpent: 0 }
    data.total += 1
    data.timeSpent += task.timeSpent
    if (task.status === 'completed') data.completed += 1
    weekly.set(week, data)
  })
  return { totalTasks, completedTasks: completed.length, pendingTasks: tasks.filter((task) => task.status === 'pending').length, estimatedHours, timeSpent, overallProgress, skillWise, weekly: [...weekly.values()] }
}

async function generateRoadmap({ userId, analysisId, reportId, skillName, durationInDays = 28, dailyStudyHours = 2, startDate = new Date() }) {
  const analysis = await getOwnedAnalysis({ userId, analysisId, reportId })
  let gaps = await SkillGap.find({ analysisId: analysis._id, gapStatus: { $in: ['missing', 'partial', 'needs_verification'] } })
  if (skillName) {
    const selectedName = normalise(skillName)
    const selectedSkill = await resolveSkill(skillName)
    gaps = gaps.filter((gap) => normalise(gap.skillName) === selectedName || (selectedSkill && String(gap.skillId) === String(selectedSkill._id)))
    if (!gaps.length) {
      const error = new Error('This skill is not an active learning gap in the selected analysis')
      error.statusCode = 404
      throw error
    }
    const existingRoadmap = await Roadmap.findOne({
      userId,
      analysisId: analysis._id,
      status: { $ne: 'archived' },
      skillsToLearn: { $elemMatch: { name: gaps[0].skillName, learningPathStatus: 'ai_generated' } },
    }).sort({ createdAt: -1 })
    if (existingRoadmap) {
      return { roadmap: existingRoadmap, progress: await calculateProgress(existingRoadmap._id), unavailableSkills: [], existing: true }
    }
  }
  const safeDuration = Math.min(Math.max(Number(durationInDays) || 28, 1), 365)
  const safeHours = Math.min(Math.max(Number(dailyStudyHours) || 2, 0.25), 16)
  const safeStartDate = new Date(startDate)
  if (Number.isNaN(safeStartDate.getTime())) throw new Error('Invalid start date')

  if (skillName) {
    const { generateSkillGapRoadmap } = require('./ai.service')
    const plan = await generateSkillGapRoadmap({
      skillName: gaps[0].skillName,
      targetRole: analysis.targetRole,
      jobDescription: analysis.jobDescription,
      durationInDays: safeDuration,
      dailyStudyHours: safeHours,
    })
    const roadmap = await Roadmap.create({
      userId,
      analysisId: analysis._id,
      title: plan.title,
      targetRole: analysis.targetRole,
      durationInDays: safeDuration,
      dailyStudyHours: safeHours,
      startDate: safeStartDate,
      targetDate: dayAt(safeStartDate, safeDuration),
      skillsToLearn: [{ skillId: null, name: gaps[0].skillName, importance: gaps[0].importance, gapStatus: gaps[0].gapStatus, learningPathStatus: 'ai_generated' }],
      learningPathVersions: [],
    })
    const tasks = buildAiSchedule({ topics: plan.topics, dailyStudyHours: safeHours, durationInDays: safeDuration, startDate: safeStartDate })
      .map((task) => ({ ...task, roadmapId: roadmap._id, userId }))
    if (tasks.length) await RoadmapProgress.insertMany(tasks)
    const progress = await calculateProgress(roadmap._id)
    roadmap.overallProgress = progress.overallProgress
    await roadmap.save()
    return { roadmap, progress, unavailableSkills: [] }
  }

  const content = await loadLearningContent(gaps)
  const skillsToLearn = content.map(({ gap, skill, path }) => ({ skillId: skill?._id || null, name: gap.skillName, importance: gap.importance, gapStatus: gap.gapStatus, learningPathStatus: path ? 'available' : 'requires_learning_path' }))
  const roadmap = await Roadmap.create({
    userId,
    analysisId: analysis._id,
    title: skillName ? `${gaps[0].skillName} learning roadmap` : `${analysis.targetRole} learning roadmap`,
    targetRole: analysis.targetRole,
    durationInDays: safeDuration,
    dailyStudyHours: safeHours,
    startDate: safeStartDate,
    targetDate: dayAt(safeStartDate, safeDuration),
    skillsToLearn,
    learningPathVersions: content.filter(({ skill, path }) => skill && path).map(({ skill, path }) => ({ skillId: skill._id, learningPathId: path._id, version: path.version })),
  })
  const scheduledTasks = buildSchedule({ content, dailyStudyHours: safeHours, durationInDays: safeDuration, startDate: safeStartDate })
  // Load the AI layer only for generation. This keeps deterministic scheduling
  // independently testable and leaves PDF-generation dependencies out of tests.
  const { personalizeRoadmapTasks } = require('./ai.service')
  const tasks = (await personalizeRoadmapTasks({ targetRole: analysis.targetRole, tasks: scheduledTasks })).map((task) => ({ ...task, roadmapId: roadmap._id, userId }))
  if (tasks.length) await RoadmapProgress.insertMany(tasks)
  const progress = await calculateProgress(roadmap._id)
  roadmap.overallProgress = progress.overallProgress
  await roadmap.save()
  return { roadmap, progress, unavailableSkills: skillsToLearn.filter((skill) => skill.learningPathStatus === 'requires_learning_path') }
}

async function getRoadmapDetails({ userId, roadmapId }) {
  if (!mongoose.isValidObjectId(roadmapId)) throw new Error('Invalid roadmap id')
  const roadmap = await Roadmap.findOne({ _id: roadmapId, userId }).lean()
  if (!roadmap) { const error = new Error('Roadmap not found'); error.statusCode = 404; throw error }
  const tasks = await RoadmapProgress.find({ roadmapId, userId }).sort({ dayNumber: 1, scheduledDate: 1 }).lean()
  return { roadmap, tasks, progress: await calculateProgress(roadmapId) }
}

async function updateTask({ userId, roadmapId, taskId, updates }) {
  const task = await RoadmapProgress.findOne({ _id: taskId, roadmapId, userId })
  if (!task) { const error = new Error('Roadmap task not found'); error.statusCode = 404; throw error }
  if (updates.status) {
    task.status = updates.status
    task.completedAt = updates.status === 'completed' ? new Date() : null
  }
  if (updates.timeSpent !== undefined) task.timeSpent = Number(updates.timeSpent)
  await task.save()
  const progress = await calculateProgress(roadmapId)
  await Roadmap.updateOne({ _id: roadmapId, userId }, { $set: { overallProgress: progress.overallProgress, status: progress.overallProgress === 100 ? 'completed' : 'active' } })
  return { task, progress }
}

async function regenerateRoadmap({ userId, roadmapId, durationInDays, dailyStudyHours }) {
  const roadmap = await Roadmap.findOne({ _id: roadmapId, userId })
  if (!roadmap) { const error = new Error('Roadmap not found'); error.statusCode = 404; throw error }
  const completedTasks = await RoadmapProgress.find({ roadmapId, userId, status: 'completed' }).select('topicId')
  const completedTopicIds = new Set(completedTasks.filter((task) => task.topicId).map((task) => String(task.topicId)))
  await RoadmapProgress.deleteMany({ roadmapId, userId, status: { $ne: 'completed' } })
  const isAiRoadmap = roadmap.skillsToLearn.some((skill) => skill.learningPathStatus === 'ai_generated')
  roadmap.durationInDays = Math.min(Math.max(Number(durationInDays) || roadmap.durationInDays, 1), 365)
  roadmap.dailyStudyHours = Math.min(Math.max(Number(dailyStudyHours) || roadmap.dailyStudyHours, 0.25), 16)
  roadmap.startDate = new Date()
  roadmap.targetDate = dayAt(roadmap.startDate, roadmap.durationInDays)
  if (isAiRoadmap) {
    const analysis = await Analysis.findOne({ _id: roadmap.analysisId, userId })
    const { generateSkillGapRoadmap } = require('./ai.service')
    const plan = await generateSkillGapRoadmap({ skillName: roadmap.skillsToLearn[0].name, targetRole: roadmap.targetRole, jobDescription: analysis.jobDescription, durationInDays: roadmap.durationInDays, dailyStudyHours: roadmap.dailyStudyHours })
    const tasks = buildAiSchedule({ topics: plan.topics, dailyStudyHours: roadmap.dailyStudyHours, durationInDays: roadmap.durationInDays, startDate: roadmap.startDate }).map((task) => ({ ...task, roadmapId: roadmap._id, userId }))
    if (tasks.length) await RoadmapProgress.insertMany(tasks)
    const progress = await calculateProgress(roadmap._id)
    roadmap.overallProgress = progress.overallProgress
    await roadmap.save()
    return { roadmap, progress }
  }
  const gaps = await SkillGap.find({ analysisId: roadmap.analysisId, gapStatus: { $in: ['missing', 'partial', 'needs_verification'] } })
  const content = await loadLearningContent(gaps)
  const tasks = buildSchedule({ content, dailyStudyHours: roadmap.dailyStudyHours, durationInDays: roadmap.durationInDays, startDate: roadmap.startDate, completedTopicIds }).map((task) => ({ ...task, roadmapId: roadmap._id, userId }))
  if (tasks.length) await RoadmapProgress.insertMany(tasks)
  const progress = await calculateProgress(roadmap._id)
  roadmap.overallProgress = progress.overallProgress
  await roadmap.save()
  return { roadmap, progress }
}

async function updateRoadmapMetadata({ userId, roadmapId, title, startDate, targetDate, durationInDays }) {
  const roadmap = await Roadmap.findOne({ _id: roadmapId, userId })
  if (!roadmap) { const error = new Error('Roadmap not found'); error.statusCode = 404; throw error }
  if (title !== undefined) {
    if (!String(title).trim() || String(title).trim().length > 140) throw new Error('Roadmap name must be between 1 and 140 characters')
    roadmap.title = String(title).trim()
  }
  if (startDate !== undefined) {
    const date = new Date(startDate)
    if (Number.isNaN(date.getTime())) throw new Error('Invalid start date')
    roadmap.startDate = date
  }
  if (targetDate !== undefined) {
    const date = new Date(targetDate)
    if (Number.isNaN(date.getTime())) throw new Error('Invalid target date')
    roadmap.targetDate = date
  }
  if (durationInDays !== undefined) {
    const days = Number(durationInDays)
    if (!Number.isInteger(days) || days < 1 || days > 365) throw new Error('Duration must be between 1 and 365 days')
    roadmap.durationInDays = days
    if (targetDate === undefined) roadmap.targetDate = dayAt(roadmap.startDate, days)
  } else if (startDate !== undefined && targetDate !== undefined) {
    const days = Math.ceil((roadmap.targetDate - roadmap.startDate) / 86400000) + 1
    if (days < 1 || days > 365) throw new Error('Target date must be within 365 days of the start date')
    roadmap.durationInDays = days
  }
  await roadmap.save()
  return roadmap
}

async function deleteRoadmap({ userId, roadmapId }) {
  const roadmap = await Roadmap.findOneAndDelete({ _id: roadmapId, userId })
  if (!roadmap) { const error = new Error('Roadmap not found'); error.statusCode = 404; throw error }
  await RoadmapProgress.deleteMany({ roadmapId, userId })
}

module.exports = { createAnalysisFromReport, generateRoadmap, getRoadmapDetails, updateTask, regenerateRoadmap, updateRoadmapMetadata, deleteRoadmap, calculateProgress, resolveSkill, orderTopics, buildSchedule, buildAiSchedule }
