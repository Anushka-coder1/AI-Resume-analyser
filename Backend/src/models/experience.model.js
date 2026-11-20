const mongoose = require('mongoose')

const structuredItemSchema = new mongoose.Schema({
  content: { type: String, required: true },
  kind: { type: String, enum: ['question', 'activity', 'statement'], required: true },
  primaryTag: { type: String, required: true },
  secondaryTags: [{ type: String }],
}, { _id: false })

const structuredRoundSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['OA', 'Aptitude', 'Coding', 'Communication', 'Technical', 'Managerial', 'HR', 'Other', 'Unclassified'], required: true },
  items: [structuredItemSchema],
}, { _id: false })

const integritySummarySchema = new mongoose.Schema({
  originalQuestionsIdentified: Number,
  questionsOrganized: Number,
  questionsWithTopicTags: Number,
  unclassifiedItems: Number,
  informationAdded: String,
  factualInformationInvented: String,
}, { _id: false })

const experienceSchema = new mongoose.Schema(
  {
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: 100,
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      trim: true,
      maxlength: 100,
    },
    experience: {
      type: String,
      required: [true, 'Interview experience is required'],
      trim: true,
      maxlength: 10000,
    },
    structuredExperience: {
      rounds: [structuredRoundSchema],
      unclassifiedContent: [{ type: String }],
      integritySummary: integritySummarySchema,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
  },
  { timestamps: true },
)

experienceSchema.index({ createdAt: -1, _id: -1 })

module.exports = mongoose.model('InterviewExperience', experienceSchema)
