import axios from "axios"

const api = axios.create({
  baseURL:"https//localhost:3000",
  withCredentials:true,
}) 

/**
 * @description serivice to generate interview report based on user self description , resume and job description. 
 */

export const generateInterviewReport =async ({jobDescription , selfDescription , resumeFile}) => {
  const formData = new FormData()
  formData.append("jobDescription" , jobDescription)
  formData.append("selfDescription" , selfDescription)
  formData.append("resume" , resumeFile)

  const response = await api.post("/api/interview",formData, {
    headers:{
      "Content-Type":"multipart/form-data"
    }
  })
  return response.data
}

/**
 * @description service to get interview report 
 */

export const getInterviewReportById = async ({interviewId}) => {
  const response  = await api.get(`/api/interview/report/${interviewId}`)
  return response.data
}

/**
 * @description service to get all interview report by logged in user.
 */

export const getAllInterviewReport = async () => {
  const response  = await api.get(`/api/interview`)
  return response.data
}