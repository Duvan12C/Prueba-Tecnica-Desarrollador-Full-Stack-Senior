export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthToken {
  access_token: string
  token_type: string
  session_id: string
  access_expires_at: number
  idle_expires_at: number
}

export interface SignUpCredentials {
  name: string
  email: string
  password: string
  role_name: 'Gestor' | 'Colaborador'
}

export type RegisteredUser = Pick<SignUpCredentials, 'name' | 'email'>

export interface CurrentUserProfile {
  name: string
  role_name: string
}
