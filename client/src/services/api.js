import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // Send HTTP-only cookies
  headers: {
    'Content-Type': 'application/json',
  },
})

// Intercept responses to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // User is not authenticated
    }
    return Promise.reject(error)
  }
)

export default api
