const mongoose = require('mongoose')

const objectId = mongoose.Schema.Types.ObjectId
const importance = ['high', 'medium', 'low']

const roadmapResourceSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  type: { type: String, enum: ['documentation', 'video', 'article', 'course'], required: true },
  url: { type: String, required: true, trim: true },
  platform: { type: String, required: true, trim: true },
}, { _id: false })

const analysisSchema = new mongoose.Schema({
  userId: { type: objectId, ref: 'users', required: true, index: true },
  sourceReportId: { type: objectId, ref: 'InterviewReport', required: true },
  resumeMetadata: {
    fileName: String,
    storageReference: String,
    extractedTextAvailable: { type: Boolean, default: false },
  },
  jobDescription: { type: String, required: true },
  targetRole: { type: String, required: true },
  company: { type: String, default: null },
  analysisStatus: { type: String, enum: ['completed', 'pending', 'failed'], default: 'completed' },
  overallMatchScore: { type: Number, min: 0, max: 100, default: 0 },
}, { timestamps: true })
analysisSchema.index({ userId: 1, sourceReportId: 1 }, { unique: true })

const skillGapSchema = new mongoose.Schema({
  analysisId: { type: objectId, ref: 'Analysis', required: true, index: true },
  skillId: { type: objectId, ref: 'Skill', default: null },
  skillName: { type: String, required: true, trim: true },
  requiredLevel: { type: String, default: 'intermediate' },
  userLevel: { type: String, default: 'not_assessed' },
  matchScore: { type: Number, min: 0, max: 100, required: true },
  gapStatus: { type: String, enum: ['missing', 'partial', 'matched', 'needs_verification'], required: true },
  importance: { type: String, enum: importance, default: 'medium' },
  reason: { type: String, default: '' },
}, { timestamps: true })
skillGapSchema.index({ analysisId: 1, skillName: 1 }, { unique: true })
skillGapSchema.index({ analysisId: 1, gapStatus: 1, importance: 1 })

const roadmapSchema = new mongoose.Schema({
  userId: { type: objectId, ref: 'users', required: true, index: true },
  analysisId: { type: objectId, ref: 'Analysis', required: true, index: true },
  title: { type: String, required: true },
  targetRole: { type: String, required: true },
  durationInDays: { type: Number, min: 1, required: true },
  dailyStudyHours: { type: Number, min: 0.25, max: 16, required: true },
  startDate: { type: Date, required: true },
  targetDate: { type: Date, required: true },
  skillsToLearn: [{
    skillId: { type: objectId, ref: 'Skill', default: null },
    name: String,
    importance: { type: String, enum: importance },
    gapStatus: String,
    learningPathStatus: { type: String, enum: ['available', 'requires_learning_path', 'ai_generated'], default: 'ai_generated' },
  }],
  status: { type: String, enum: ['active', 'completed', 'archived'], default: 'active', index: true },
  overallProgress: { type: Number, min: 0, max: 100, default: 0 },
  generatedAt: { type: Date, default: Date.now },
  learningPathVersions: [{ skillId: { type: objectId, ref: 'Skill' }, learningPathId: { type: objectId, ref: 'LearningPath' }, version: Number }],
}, { timestamps: true })
roadmapSchema.index({ userId: 1, createdAt: -1 })

const roadmapProgressSchema = new mongoose.Schema({
  roadmapId: { type: objectId, ref: 'Roadmap', required: true, index: true },
  userId: { type: objectId, ref: 'users', required: true, index: true },
  skillId: { type: objectId, ref: 'Skill', default: null },
  topicId: { type: objectId, ref: 'Topic', default: null },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  dayNumber: { type: Number, required: true, min: 1 },
  scheduledDate: { type: Date, required: true },
  estimatedHours: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'skipped'], default: 'pending', index: true },
  completedAt: { type: Date, default: null },
  timeSpent: { type: Number, min: 0, default: 0 },
  resources: { type: [roadmapResourceSchema], default: [] },
  projectReference: { type: objectId, ref: 'LearningProject', default: null },
}, { timestamps: true })
roadmapProgressSchema.index({ roadmapId: 1, dayNumber: 1, scheduledDate: 1 })
roadmapProgressSchema.index({ roadmapId: 1, skillId: 1, status: 1 })

module.exports = {
  Analysis: mongoose.models.Analysis || mongoose.model('Analysis', analysisSchema),
  SkillGap: mongoose.models.SkillGap || mongoose.model('SkillGap', skillGapSchema),
  Roadmap: mongoose.models.Roadmap || mongoose.model('Roadmap', roadmapSchema),
  RoadmapProgress: mongoose.models.RoadmapProgress || mongoose.model('RoadmapProgress', roadmapProgressSchema),
}
