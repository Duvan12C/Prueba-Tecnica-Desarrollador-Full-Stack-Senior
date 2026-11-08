export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthToken {
  access_token: string
  token_type: string
}

export interface SignUpCredentials {
  name: string
  email: string
  password: string
  role_name: 'Gestor' | 'Colaborador'
}

export type RegisteredUser = Pick<SignUpCredentials, 'name' | 'email'>
