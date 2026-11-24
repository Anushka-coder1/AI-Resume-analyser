import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_BACKEND_URL, withCredentials: true })

export const startMockInterview = async ({ reportId, mode, count }) =>
  (await api.post(`/api/mock-interview/start/${reportId}`, { mode, count })).data

export const answerMockInterview = async ({ sessionId, answer }) =>
  (await api.post(`/api/mock-interview/${sessionId}/answer`, { answer })).data

export const skipMockQuestion = async ({ sessionId }) =>
  (await api.post(`/api/mock-interview/${sessionId}/answer`, { skip: true })).data

export const finishMockInterview = async ({ sessionId }) =>
  (await api.post(`/api/mock-interview/${sessionId}/finish`)).data

export const getMockInterview = async ({ sessionId }) =>
  (await api.get(`/api/mock-interview/${sessionId}`)).data

export const getMockInterviewsForReport = async ({ reportId }) =>
  (await api.get(`/api/mock-interview/report/${reportId}`)).data

export const deleteMockInterview = async ({ sessionId }) =>
  api.delete(`/api/mock-interview/${sessionId}`)
