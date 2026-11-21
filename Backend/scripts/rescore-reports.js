/**
 * Re-computes matchScore / requirementEvidence / skillGaps for saved reports
 * using the current skill matcher. Only these derived fields are touched; the
 * stored resume, job description and AI-generated questions are left as-is.
 *
 *   node scripts/rescore-reports.js          # dry run: prints old → new scores
 *   node scripts/rescore-reports.js --apply  # writes the new scores
 */
require('dotenv').config({ quiet: true })
const mongoose = require('mongoose')
const interviewReportModel = require('../src/models/interview.model')
const { analyseSkillMatch } = require('../src/services/skill-matching.service')

async function main() {
  const apply = process.argv.includes('--apply')
  await mongoose.connect(process.env.MONGO_URI)

  const reports = await interviewReportModel
    .find({})
    .sort({ createdAt: 1 })
    .select('title version resumeGroup matchScore resume selfDescription jobDescription')

  let changed = 0
  for (const report of reports) {
    const result = analyseSkillMatch({
      resume: report.resume || '',
      selfDescription: report.selfDescription || '',
      jobDescription: report.jobDescription || '',
    })

    const label = `${String(report._id).slice(-6)} v${report.version || 1} ${(report.title || '').slice(0, 40)}`
    console.log(`${label.padEnd(52)} ${String(report.matchScore).padStart(3)}% → ${String(result.matchScore).padStart(3)}%`)

    if (apply) {
      await interviewReportModel.updateOne(
        { _id: report._id },
        {
          $set: {
            matchScore: result.matchScore,
            scoringMethod: result.scoringMethod,
            requirementEvidence: result.requirements,
            skillGaps: result.skillGaps,
          },
        }
      )
    }
    if (report.matchScore !== result.matchScore) changed += 1
  }

  console.log(`\n${reports.length} reports, ${changed} with a different score. ${apply ? 'Changes written.' : 'Dry run only - pass --apply to save.'}`)
  await mongoose.disconnect()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
