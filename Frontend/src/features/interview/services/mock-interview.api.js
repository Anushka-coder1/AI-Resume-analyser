import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_BACKEND_URL, withCredentials: true })

export const startMockInterview = async ({ reportId, mode, count, timeLimitSeconds }) =>
  (await api.post(`/api/mock-interview/start/${reportId}`, { mode, count, timeLimitSeconds })).data

export const answerMockInterview = async ({ sessionId, answer, inputMode, timeTakenSeconds }) =>
  (await api.post(`/api/mock-interview/${sessionId}/answer`, { answer, inputMode, timeTakenSeconds })).data

export const skipMockQuestion = async ({ sessionId, timeTakenSeconds }) =>
  (await api.post(`/api/mock-interview/${sessionId}/answer`, { skip: true, timeTakenSeconds })).data

export const finishMockInterview = async ({ sessionId }) =>
  (await api.post(`/api/mock-interview/${sessionId}/finish`)).data

export const getMockInterview = async ({ sessionId }) =>
  (await api.get(`/api/mock-interview/${sessionId}`)).data

export const getMockInterviewsForReport = async ({ reportId }) =>
  (await api.get(`/api/mock-interview/report/${reportId}`)).data

export const deleteMockInterview = async ({ sessionId }) =>
  api.delete(`/api/mock-interview/${sessionId}`)
