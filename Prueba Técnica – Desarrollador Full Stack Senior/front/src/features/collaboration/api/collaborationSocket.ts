import { apiClient } from '@/shared/api/client'

export function openCollaborationSocket(documentId: number): WebSocket {
    const base = apiClient.defaults.baseURL?.replace(/\/$/, '') ?? ''
    const url = new URL(`${base}/documents/${documentId}/collaboration`, window.location.origin)
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    return new WebSocket(url)
}
