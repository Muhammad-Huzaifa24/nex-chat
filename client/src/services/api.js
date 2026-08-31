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

const isSilentRequest = (url) => {
  if (!url) return false
  return (
    url.includes('/typing') ||
    url.includes('/heartbeat') ||
    url.includes('/offline') ||
    url.includes('/read')
  )
}

// Intercept requests to trigger global loader (skip silent background calls)
api.interceptors.request.use(
  (config) => {
    if (!isSilentRequest(config.url)) {
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
    if (!isSilentRequest(response.config?.url)) {
      useLoaderStore.getState().stopLoading()
    }
    return response
  },
  (error) => {
    if (!isSilentRequest(error.config?.url)) {
      useLoaderStore.getState().stopLoading()
    }
    if (error.response && error.response.status === 401) {
      // User is not authenticated
    }
    return Promise.reject(error)
  }
)

export default api
