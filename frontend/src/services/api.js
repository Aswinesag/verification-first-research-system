import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('❌ API Request Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`)
    return response
  },
  (error) => {
    console.error('❌ API Response Error:', error)
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please try again.')
    }
    
    if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.')
    }
    
    if (error.response?.status === 408) {
      throw new Error('Request took too long. Please try a simpler query.')
    }
    
    throw new Error(error.message || 'An error occurred while processing your request.')
  }
)

export const apiService = {
  async runQuery(query) {
    try {
      const response = await api.post('/query', { query })
      const payload = response.data
      return payload?.data ?? payload
    } catch (error) {
      throw error
    }
  },
  
  async getHealth() {
    try {
      const response = await api.get('/health')
      return response.data
    } catch (error) {
      throw error
    }
  },
  
  async getMetrics() {
    try {
      const response = await api.get('/metrics')
      return response.data
    } catch (error) {
      throw error
    }
  },
}

export default apiService
