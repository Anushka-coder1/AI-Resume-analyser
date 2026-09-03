const InterviewExperience = require('../models/experience.model')

async function createExperienceController(req, res) {
  const { company = '', role = '', experience = '' } = req.body

  if (!company.trim() || !role.trim() || !experience.trim()) {
    return res.status(400).json({
      message: 'Company, role, and interview experience are required',
    })
  }

  const interviewExperience = await InterviewExperience.create({
    company: company.trim(),
    role: role.trim(),
    experience: experience.trim(),
    user: req.user.id,
  })

  const populatedExperience = await interviewExperience.populate(
    'user',
    'username',
  )

  res.status(201).json({
    message: 'Interview experience shared successfully',
    interviewExperience: populatedExperience,
  })
}

async function getAllExperiencesController(req, res) {
  const interviewExperiences = await InterviewExperience.find()
    .populate('user', 'username')
    .sort({ createdAt: -1 })

  res.status(200).json({
    interviewExperiences,
  })
}

module.exports = { createExperienceController, getAllExperiencesController }
