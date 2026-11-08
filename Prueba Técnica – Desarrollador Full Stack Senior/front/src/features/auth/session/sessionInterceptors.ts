import { apiClient } from '@/shared/api/client'
import { getActiveSession, renewSession } from './sessionLifecycle'
import { clearAccessToken, getAccessToken } from './sessionToken'

const publicEndpoints = new Set(['/auth/login', '/auth/refresh', '/auth/logout', '/users/create'])

export function installSessionInterceptors(): void {
    apiClient.interceptors.request.use(async (config) => {
        const url = (config.url ?? '').trim()
        const endpoint = `/${url.split(/[?#]/, 1)[0].replace(/^\/+|\/+$/g, '')}`
        const isApiRequest = config.baseURL === apiClient.defaults.baseURL && !/^([a-z][a-z\d+.-]*:|[/\\]{2})/i.test(url)
        if (!isApiRequest || publicEndpoints.has(endpoint) || config.headers.has('Authorization')) return config

        let session = getActiveSession()
        if (session && session.access_expires_at * 1000 <= Date.now() + 15_000) {
            session = await renewSession(false)
        }
        if (session) config.headers.set('Authorization', `Bearer ${session.access_token}`)
        return config
    })

    apiClient.interceptors.response.use(undefined, (error) => {
        const accessToken = getAccessToken()
        if (
            error.response?.status === 401 && accessToken &&
            error.config?.headers?.get('Authorization') === `Bearer ${accessToken}`
        ) {
            clearAccessToken()
        }
        return Promise.reject(error)
    })
}
