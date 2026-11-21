import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_BACKEND_URL, withCredentials: true })

export const generateRoadmap = async (payload) => (await api.post('/api/roadmaps/generate', payload)).data
export const getRoadmaps = async () => (await api.get('/api/roadmaps')).data
export const getRoadmap = async (roadmapId) => (await api.get(`/api/roadmaps/${roadmapId}`)).data
export const updateRoadmapTask = async (roadmapId, taskId, status) => (await api.patch(`/api/roadmaps/${roadmapId}/tasks/${taskId}`, { status })).data
export const updateRoadmapTaskTime = async (roadmapId, taskId, timeSpent) => (await api.patch(`/api/roadmaps/${roadmapId}/tasks/${taskId}/time`, { timeSpent })).data
export const regenerateRoadmap = async (roadmapId, payload) => (await api.post(`/api/roadmaps/${roadmapId}/regenerate`, payload)).data
