const { GoogleGenAI } = require('@google/genai')
const { z, toJSONSchema } = require('zod')

const ai = process.env.GOOGLE_GENAI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
    })
  : null

const interviewReportSchema = z.object({
  matchScore: z
    .number()
    .describe(
      "A score between 0 and 100 indicating how well the candidate's profile matches the job description"
    ),
  technicalQuestions: z
    .array(
      z.object({
        question: z
          .string()
          .describe('The technical questions that can be asked in an interview'),
        intention: z
          .string()
          .describe('The intention of interviewer behind this question'),
        answer: z
          .string()
          .describe('How to answer this question and what points to cover'),
      })
    )
    .describe('Technical questions that can be asked in the interview'),
  behavioralQuestions: z
    .array(
      z.object({
        question: z
          .string()
          .describe('The behavioral questions that can be asked in an interview'),
        intention: z
          .string()
          .describe('The intention of interviewer behind this question'),
        answer: z
          .string()
          .describe('How to answer this question and what points to cover'),
      })
    )
    .describe('Behavioral questions that can be asked in the interview'),
  skillGaps: z
    .array(
      z.object({
        skill: z.string().describe('The skill which the candidate is lacking'),
        severity: z
          .enum(['low', 'medium', 'high'])
          .describe('The severity of the skill gap'),
      })
    )
    .describe("List of skill gaps in the candidate's profile"),
  preparationPlan: z
    .array(
      z.object({
        day: z.number().describe('The day number in the preparation plan'),
        focus: z
          .string()
          .describe('The main focus area of the day in the preparation plan'),
        task: z
          .array(z.string())
          .describe('List of tasks to be done on this day'),
      })
    )
    .describe('A day-wise preparation plan for the candidate'),
  title: z.string().describe('The title of the job for which the interview report is generated'),
})

function pickTitle(jobDescription) {
  const firstLine = jobDescription
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean)

  return firstLine || 'Target Role'
}

function buildFallbackReport({ resume, selfDescription, jobDescription }) {
  const combinedProfile = `${resume} ${selfDescription}`.toLowerCase()
  const normalizedJobDescription = jobDescription.toLowerCase()
  const targetSkills = [
    'javascript',
    'typescript',
    'react',
    'node',
    'express',
    'mongodb',
    'sql',
    'docker',
    'aws',
    'system design',
    'rest api',
    'git',
  ]

  const matchedSkills = targetSkills.filter(
    (skill) =>
      combinedProfile.includes(skill) && normalizedJobDescription.includes(skill)
  )

  const missingSkills = targetSkills.filter(
    (skill) =>
      normalizedJobDescription.includes(skill) && !combinedProfile.includes(skill)
  )

  const denominator = Math.max(1, matchedSkills.length + missingSkills.length)
  const matchScore = Math.max(
    45,
    Math.min(95, Math.round((matchedSkills.length / denominator) * 100))
  )

  return {
    title: pickTitle(jobDescription),
    matchScore,
    technicalQuestions: [
      {
        question: 'Walk me through a project that is closest to this role.',
        intention: 'The interviewer wants to measure relevance, ownership, and technical depth.',
        answer:
          'Explain the problem, your stack choices, the tradeoffs you made, and the measurable result you achieved.',
      },
      {
        question: 'How would you improve performance or scalability in a product like this?',
        intention: 'The interviewer is testing practical engineering judgment.',
        answer:
          'Describe how you identify bottlenecks, measure current behavior, implement targeted fixes, and validate the outcome.',
      },
      {
        question: 'Which part of the required stack would you be ready to use on day one?',
        intention: 'The interviewer wants clarity on readiness and ramp-up areas.',
        answer:
          'Be direct about your strongest tools, then mention one weaker area and the plan to close that gap quickly.',
      },
    ],
    behavioralQuestions: [
      {
        question: 'Tell me about a time you had to learn something quickly to deliver.',
        intention: 'The interviewer is assessing adaptability and follow-through.',
        answer:
          'Use a STAR structure, show the learning approach you used, and end with the concrete result you delivered.',
      },
      {
        question: 'Describe a situation where feedback improved your work.',
        intention: 'The interviewer wants to see coachability and collaboration.',
        answer:
          'Share the original issue, the feedback you received, how you applied it, and what improved afterward.',
      },
      {
        question: 'How do you handle competing priorities when deadlines are tight?',
        intention: 'The interviewer is checking prioritization and communication habits.',
        answer:
          'Explain how you clarify impact, align on priorities, communicate risks early, and keep stakeholders informed.',
      },
    ],
    skillGaps: missingSkills.slice(0, 4).map((skill) => ({
      skill,
      severity: missingSkills.length > 2 ? 'high' : 'medium',
    })),
    preparationPlan: [
      {
        day: 1,
        focus: 'Role breakdown',
        task: [
          'Extract the key responsibilities and must-have skills from the job description.',
          'Map your strongest projects and experiences to those requirements.',
        ],
      },
      {
        day: 2,
        focus: 'Technical stories',
        task: [
          'Prepare two project walkthroughs with problem, solution, tradeoffs, and results.',
          'Practice explaining architecture decisions in simple terms.',
        ],
      },
      {
        day: 3,
        focus: 'Gap reduction',
        task: [
          'Review the top missing skills flagged in this report.',
          'Build short notes, examples, or mini demos for each one.',
        ],
      },
      {
        day: 4,
        focus: 'Mock interview practice',
        task: [
          'Answer the technical and behavioral questions aloud.',
          'Refine answers to stay concise, specific, and evidence-based.',
        ],
      },
    ],
  }
}

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
  if (!ai) {
    return buildFallbackReport({ resume, selfDescription, jobDescription })
  }

  const prompt = `Generate ONLY valid JSON.
Do not include markdown.
Do not include explanations.
The JSON must exactly match the provided schema.
Generate an interview report for a candidate with the following details:
Resume: ${resume}
Self Description: ${selfDescription}
Job Description: ${jobDescription}`

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: toJSONSchema(interviewReportSchema),
      },
    })

    return JSON.parse(response.text)
  } catch (error) {
    console.error('Gemini API Error:', error)
    return buildFallbackReport({ resume, selfDescription, jobDescription })
  }
}

module.exports = generateInterviewReport
