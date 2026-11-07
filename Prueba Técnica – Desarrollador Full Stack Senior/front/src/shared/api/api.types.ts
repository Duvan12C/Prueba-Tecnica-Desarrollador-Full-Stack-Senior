export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T | null
}

export interface ApiErrorResponse {
  success: false
  message: string
  code: string
  details?: Array<{
    field: string
    message: string
    code: string
  }>
}
