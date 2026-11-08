import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_URL ?? 'http://localhost:8000'),
  headers: {
    Accept: 'application/json',
  },
})
