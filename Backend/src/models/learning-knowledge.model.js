const mongoose = require('mongoose')

const objectId = mongoose.Schema.Types.ObjectId
const difficulty = ['beginner', 'intermediate', 'advanced']

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  normalizedName: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
  category: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  difficulty: { type: String, enum: difficulty, default: 'beginner' },
  prerequisites: [{ type: objectId, ref: 'Skill' }],
  estimatedHours: { type: Number, min: 0, default: 0 },
  isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true })

const skillAliasSchema = new mongoose.Schema({
  skillId: { type: objectId, ref: 'Skill', required: true, index: true },
  aliases: [{ type: String, required: true, trim: true, lowercase: true }],
}, { timestamps: true })
skillAliasSchema.index({ aliases: 1 }, { unique: true })

const learningPathSchema = new mongoose.Schema({
  skillId: { type: objectId, ref: 'Skill', required: true, index: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  totalEstimatedHours: { type: Number, min: 0, required: true },
  difficulty: { type: String, enum: difficulty, default: 'beginner' },
  version: { type: Number, min: 1, default: 1 },
  isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true })
learningPathSchema.index({ skillId: 1, version: -1 }, { unique: true })

const topicSchema = new mongoose.Schema({
  learningPathId: { type: objectId, ref: 'LearningPath', required: true, index: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  order: { type: Number, required: true, min: 1 },
  estimatedHours: { type: Number, required: true, min: 0 },
  difficulty: { type: String, enum: difficulty, default: 'beginner' },
  prerequisites: [{ type: objectId, ref: 'Topic' }],
  subtopics: [{ type: String, trim: true }],
}, { timestamps: true })
topicSchema.index({ learningPathId: 1, order: 1 }, { unique: true })

const resourceSchema = new mongoose.Schema({
  topicId: { type: objectId, ref: 'Topic', required: true, index: true },
  title: { type: String, required: true, trim: true },
  type: { type: String, enum: ['documentation', 'video', 'article', 'course'], required: true },
  url: { type: String, required: true, trim: true, match: /^https:\/\//i },
  platform: { type: String, required: true, trim: true },
  difficulty: { type: String, enum: difficulty, default: 'beginner' },
  isVerified: { type: Boolean, default: false, index: true },
}, { timestamps: true })
resourceSchema.index({ topicId: 1, url: 1 }, { unique: true })

const projectSchema = new mongoose.Schema({
  skillIds: [{ type: objectId, ref: 'Skill', required: true }],
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  difficulty: { type: String, enum: difficulty, default: 'intermediate' },
  requirements: [{ type: String, trim: true }],
  estimatedHours: { type: Number, required: true, min: 0 },
  recommendedTopics: [{ type: objectId, ref: 'Topic' }],
}, { timestamps: true })
projectSchema.index({ skillIds: 1 })

module.exports = {
  Skill: mongoose.models.Skill || mongoose.model('Skill', skillSchema),
  SkillAlias: mongoose.models.SkillAlias || mongoose.model('SkillAlias', skillAliasSchema),
  LearningPath: mongoose.models.LearningPath || mongoose.model('LearningPath', learningPathSchema),
  Topic: mongoose.models.Topic || mongoose.model('Topic', topicSchema),
  Resource: mongoose.models.Resource || mongoose.model('Resource', resourceSchema),
  LearningProject: mongoose.models.LearningProject || mongoose.model('LearningProject', projectSchema),
}
