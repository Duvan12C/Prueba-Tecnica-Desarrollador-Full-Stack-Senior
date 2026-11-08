import axios from 'axios'
import { getAccessToken } from './sessionToken'

const apiBaseUrl = import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_URL ?? 'http://localhost:8000')
const publicEndpoints = new Set(['/auth/login', '/users/create'])

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    Accept: 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const url = config.url ?? ''
  const endpoint = `/${url.split(/[?#]/, 1)[0].replace(/^\/+|\/+$/g, '')}`
  const isApiRequest = config.baseURL === apiBaseUrl && !/^([a-z][a-z\d+.-]*:|[/\\]{2})/i.test(url.trim())

  if (isApiRequest && !publicEndpoints.has(endpoint) && !config.headers.has('Authorization')) {
    const token = getAccessToken()
    if (token) config.headers.set('Authorization', `Bearer ${token}`)
  }

  return config
})
