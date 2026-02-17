import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const authStore = useAuthStore.getState()
      authStore.logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  register: (email, password) =>
    apiClient.post('/api/users/register', { email, password }),
  
  login: (email, password) =>
    apiClient.post('/api/users/login', { email, password }),
  
  getCurrentUser: () =>
    apiClient.get('/api/users/me'),
}

export const courseAPI = {
  getCourses: () =>
    apiClient.get('/api/courses/'),
  
  getCourseDetail: (courseId) =>
    apiClient.get(`/api/courses/${courseId}`),
  
  createCourse: (data) =>
    apiClient.post('/api/courses/', data),
  
  updateCourse: (courseId, data) =>
    apiClient.patch(`/api/courses/${courseId}`, data),
  
  deleteCourse: (courseId) =>
    apiClient.delete(`/api/courses/${courseId}`),
  
  getCourseProgress: (courseId) =>
    apiClient.get(`/api/courses/${courseId}/progress`),
  
  shareCourse: (courseId) =>
    apiClient.post(`/api/courses/${courseId}/share`),
  
  getSharedCourse: (shareToken) =>
    apiClient.get(`/api/courses/share/${shareToken}`),
}

export const videoAPI = {
  addVideo: (courseId, data) =>
    apiClient.post(`/api/videos/${courseId}/add`, data),
  
  getCourseVideos: (courseId) =>
    apiClient.get(`/api/videos/course/${courseId}/list`),
  
  updateVideo: (videoId, data) =>
    apiClient.patch(`/api/videos/${videoId}`, data),
  
  deleteVideo: (videoId) =>
    apiClient.delete(`/api/videos/${videoId}`),
  
  reorderVideo: (videoId, newPosition) =>
    apiClient.post(`/api/videos/${videoId}/reorder`, { new_position: newPosition }),
}

export const progressAPI = {
  updateVideoProgress: (videoId, data) =>
    apiClient.post(`/api/progress/video/${videoId}`, data),
  
  getVideoProgress: (videoId) =>
    apiClient.get(`/api/progress/video/${videoId}`),
  
  getCourseProgress: (courseId) =>
    apiClient.get(`/api/progress/course/${courseId}`),
  
  startPomodoroSession: (duration) =>
    apiClient.post('/api/progress/pomodoro/start', { duration }),
  
  completePomodoroSession: (sessionId) =>
    apiClient.patch(`/api/progress/pomodoro/${sessionId}`),
  
  getPomodoroStats: () =>
    apiClient.get('/api/progress/pomodoro/stats'),
}

export const aiAPI = {
  getAssistance: (data) =>
    apiClient.post('/api/ai/assistant', data),
  
  askAboutVideo: (videoId, question) =>
    apiClient.post('/api/ai/ask-about-video', { video_id: videoId, question }),
  
  summarizeVideo: (videoId) =>
    apiClient.get(`/api/ai/summarize/${videoId}`),
}

export const timestampAPI = {
  createTimestamp: (data) =>
    apiClient.post('/api/timestamps/', data),
  
  getVideoTimestamps: (videoId) =>
    apiClient.get(`/api/timestamps/video/${videoId}`),
  
  updateTimestamp: (timestampId, data) =>
    apiClient.put(`/api/timestamps/${timestampId}`, data),
  
  deleteTimestamp: (timestampId) =>
    apiClient.delete(`/api/timestamps/${timestampId}`),
}

export default apiClient
