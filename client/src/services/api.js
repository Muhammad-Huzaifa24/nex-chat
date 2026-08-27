import axios from 'axios'
import { useLoaderStore } from '../store/loaderStore'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Send HTTP-only cookies
  headers: {
    'Content-Type': 'application/json',
  },
})

// Intercept requests to trigger global loader (skip silent background calls like typing)
api.interceptors.request.use(
  (config) => {
    // Check if request is silent
    if (!config.url?.includes('/typing')) {
      useLoaderStore.getState().startLoading()
    }
    return config
  },
  (error) => {
    useLoaderStore.getState().stopLoading()
    return Promise.reject(error)
  }
)

// Intercept responses to stop loader & handle errors
api.interceptors.response.use(
  (response) => {
    if (!response.config?.url?.includes('/typing')) {
      useLoaderStore.getState().stopLoading()
    }
    return response
  },
  (error) => {
    if (!error.config?.url?.includes('/typing')) {
      useLoaderStore.getState().stopLoading()
    }
    if (error.response && error.response.status === 401) {
      // User is not authenticated
    }
    return Promise.reject(error)
  }
)

export default api
