import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  withCredentials: true,
})

export const generateInterviewReport = async ({
  jobDescription,
  jobDescriptionFile,
  selfDescription,
  resumeFile,
  previousReportId,
}) => {
  const formData = new FormData()
  formData.append('jobDescription', jobDescription || '')
  formData.append('selfDescription', selfDescription || '')

  if (previousReportId) {
    formData.append('previousReportId', previousReportId)
  }

  if (jobDescriptionFile) {
    formData.append('jobDescriptionFile', jobDescriptionFile)
  }

  if (resumeFile) {
    formData.append('resume', resumeFile)
  }

  const response = await api.post('/api/interview', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data
}

export const getInterviewReportById = async ({ interviewId }) => {
  const response = await api.get(`/api/interview/report/${interviewId}`)
  return response.data
}

export const renameInterviewReport = async ({ interviewId, title }) => (await api.patch(`/api/interview/report/${interviewId}`, { title })).data
export const deleteInterviewReport = async ({ interviewId }) => api.delete(`/api/interview/report/${interviewId}`)

export const getInterviewReportVersions = async ({ interviewId }) => {
  const response = await api.get(`/api/interview/report/${interviewId}/versions`)
  return response.data
}

export const getAllInterviewReport = async ({ cursor } = {}) => {
  const response = await api.get('/api/interview', {
    params: { limit: 10, ...(cursor ? { cursor } : {}) },
  })
  return response.data
}

export const generateResumePdf = async ({ interviewReportId}) =>{
  const response = await api.post(`/api/interview/resume/pdf/${interviewReportId}`,null,{
    responseType:"blob"
  })
  return response.data
}
