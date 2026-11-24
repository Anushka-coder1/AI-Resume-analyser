const mongoose = require('mongoose')

const criteriaSchema = new mongoose.Schema({
  relevance: { type: Number, min: 0, max: 10, default: 0 },
  depth: { type: Number, min: 0, max: 10, default: 0 },
  structure: { type: Number, min: 0, max: 10, default: 0 },
  communication: { type: Number, min: 0, max: 10, default: 0 },
}, { _id: false })

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  type: { type: String, enum: ['technical', 'behavioral'], required: true },
  intention: { type: String, default: '' },
  modelAnswer: { type: String, default: '' },
}, { _id: false })

const turnSchema = new mongoose.Schema({
  question: { type: String, required: true },
  type: { type: String, enum: ['technical', 'behavioral'], required: true },
  intention: { type: String, default: '' },
  modelAnswer: { type: String, default: '' },
  isFollowUp: { type: Boolean, default: false },
  userAnswer: { type: String, default: null },
  skipped: { type: Boolean, default: false },
  score: { type: Number, min: 0, max: 10, default: null },
  criteria: { type: criteriaSchema, default: undefined },
  feedback: { type: String, default: '' },
  improvedAnswer: { type: String, default: '' },
  evaluatedBy: { type: String, enum: ['ai', 'fallback', 'none'], default: 'none' },
  askedAt: { type: Date, default: Date.now },
  answeredAt: { type: Date, default: null },
}, { _id: false })

const mockInterviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  report: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewReport', required: true },
  title: { type: String, default: 'Mock Interview' },
  mode: { type: String, enum: ['technical', 'behavioral', 'mixed'], default: 'mixed' },
  status: { type: String, enum: ['in_progress', 'completed'], default: 'in_progress' },
  // Main questions still waiting to be asked, in order.
  pendingQuestions: [questionSchema],
  turns: [turnSchema],
  followUpsUsed: { type: Number, default: 0 },
  maxFollowUps: { type: Number, default: 2 },
  overallScore: { type: Number, min: 0, max: 100, default: null },
  summary: {
    verdict: { type: String, default: '' },
    strengths: [String],
    improvements: [String],
    weakSkills: [String],
  },
  completedAt: { type: Date, default: null },
}, { timestamps: true })

mockInterviewSchema.index({ user: 1, report: 1, createdAt: -1 })

module.exports = mongoose.model('MockInterview', mockInterviewSchema)
