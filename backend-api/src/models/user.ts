export interface User {
  id: string
  email: string
  password_hash: string
  preferred_language: 'sr' | 'hu' | 'ro' | 'en' | 'ru' | 'ua'
  created_at: Date
  updated_at: Date
}

export interface CreateUserInput {
  email: string
  password: string
  preferred_language?: 'sr' | 'hu' | 'ro' | 'en' | 'ru' | 'ua'
}

export interface UserResponse {
  id: string
  email: string
  preferred_language: string
  created_at: string
  updated_at: string
}

