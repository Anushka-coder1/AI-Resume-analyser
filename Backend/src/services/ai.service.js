const {GoogleGenAI } = require('@google/genai')
const {z} = require("zod")
const { toJSONSchema } = require("zod");
const {resume , selfDescription , jobDescription} = require("../services/temp.js")

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY
});

const interviewReportSchema = z.object({
  matchScore:z.number().describe("A score between 0 and 100 indicating how well the candidated's profile matches the job description"),

  technicalQuestion: z.array(z.object({
    question:z.string().describe("The technical questions that can be asked in an interview"),
    intention:z.string().describe("The intension of interviewer behind this question"),
    answer:z.string().describe("How to answer this question , what points to cover , what approach to take etc.")
  })).describe("technicals questions that can be asked in the interview along with their intensions and how to answer them"),

  behavioralQuestion: z.array(z.object({
    question:z.string().describe("The behavioral questions that can be asked in an interview"),
    intention:z.string().describe("The intension of interviewer behind this question"),
    answer:z.string().describe("How to answer this question , what points to cover , what approach to take etc.")
  })).describe("behavioral questions that can be asked in the interview along with their intensions and how to answer them"),

  skillGaps:z.array(z.object({
    skill:z.string().describe("The skill which the candidate is lacking"),
    severity:z.string().describe("the severity of the skill gap i.e. low , medium , high"),
  })).describe("List of skill gap in the candidate's profile along with their severity"),

  preparationPlan:z.array(z.object({
    day:z.string().describe("The day number in the preparation plan , starting from 1"),
    focus:z.string().describe("The main focus of the day in the preparation plan, e.g.data structure , system design , mock interview "),
    task:z.string().describe("List of the tasks to be done on this day to follow the preparation plan e.g. read a specific book or video on youtube")
  })).describe("A day-wise preparation plan for the candidate to follow in order to prepare for interview effectively"),
})

async function generateInterviewReport(){

  const prompt = `Generate ONLY valid JSON.
Do not include markdown.
Do not include explanations.
The JSON must exactly match the provided schema.
Generate an interview report for a candidate with the following details:
  Resume: ${resume}
  Self Description: ${selfDescription}
  Job Description: ${jobDescription}`
  
  try{
    const response = await ai.models.generateContent({
      model:"gemini-2.5-flash", 
      contents:prompt,
      config:{
        responseMimeType:"application/json",
        responseJsonSchema:toJSONSchema(interviewReportSchema)
      }
    })
  
    return JSON.parse(response.text)


  }  catch (error) {
    console.error("Gemini API Error:", error);
  
    throw new Error("AI service is temporarily unavailable.");
  }
}

module.exports = generateInterviewReport
