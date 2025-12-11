import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'
import { getDefaultTranslation, Language } from '../services/translation-service'

export interface ApiError extends Error {
  statusCode?: number
  code?: string
}

export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (res.headersSent) {
    return next(err)
  }

  const statusCode = err.statusCode || 500
  const code = err.code || 'INTERNAL_ERROR'
  
  // Определяем язык из заголовка или используем английский по умолчанию
  const acceptLanguage = req.headers['accept-language'] || 'en'
  const language = (acceptLanguage.split(',')[0].split('-')[0] || 'en') as Language
  
  // Пытаемся найти переведенное сообщение
  let message = err.message || 'Internal Server Error'
  
  // Если есть код ошибки, пытаемся найти перевод
  if (code && code !== 'INTERNAL_ERROR') {
    const translationKey = `error.${code.toLowerCase()}`
    const translated = getDefaultTranslation(translationKey, language)
    if (translated !== translationKey) {
      message = translated
    } else if (err.message) {
      // Если перевода нет, используем оригинальное сообщение
      message = err.message
    }
  } else if (err.message && err.message.startsWith('Missing required profile fields:')) {
    // Специальная обработка для неполного профиля
    const translationKey = 'error.incomplete_profile'
    const translated = getDefaultTranslation(translationKey, language)
    const missingFields = err.message.split(':')[1]?.trim()
    message = missingFields ? `${translated}: ${missingFields}` : translated
  }

  logger.error('Error occurred', {
    error: message,
    code,
    statusCode,
    language,
    stack: err.stack,
    path: req.path,
    method: req.method,
  })

  res.status(statusCode).json({
    error: {
      message,
      code,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  })
}

