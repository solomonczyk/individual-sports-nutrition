import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { UserRepository } from '../repositories/user-repository'
import { CreateUserInput, User } from '../models/user'
import { config } from '../config/env'

export interface LoginInput {
  email: string
  password: string
}

export interface AuthResponse {
  user: {
    id: string
    email: string
    preferred_language: string
  }
  token: string
}

export class AuthService {
  private userRepository: UserRepository

  constructor() {
    this.userRepository = new UserRepository()
  }

  async register(input: CreateUserInput): Promise<AuthResponse> {
    const existingUser = await this.userRepository.findByEmail(input.email)
    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    const password_hash = await bcrypt.hash(input.password, 10)

    const user = await this.userRepository.create({
      ...input,
      password_hash,
    })

    const token = this.generateToken(user)

    return {
      user: {
        id: user.id,
        email: user.email,
        preferred_language: user.preferred_language,
      },
      token,
    }
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await this.userRepository.findByEmail(input.email)
    if (!user) {
      throw new Error('Invalid email or password')
    }

    const isValidPassword = await bcrypt.compare(input.password, user.password_hash)
    if (!isValidPassword) {
      throw new Error('Invalid email or password')
    }

    const token = this.generateToken(user)

    return {
      user: {
        id: user.id,
        email: user.email,
        preferred_language: user.preferred_language,
      },
      token,
    }
  }

  async verifyToken(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET) as { userId: string }
      const user = await this.userRepository.findById(decoded.userId)
      return user
    } catch (error) {
      return null
    }
  }

  private generateToken(user: User): string {
    return jwt.sign(
      { userId: user.id, email: user.email },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    )
  }
}

