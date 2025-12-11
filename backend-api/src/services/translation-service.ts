import { Pool } from 'pg'
import { pool } from '../config/database'

export type Language = 'sr' | 'hu' | 'ro' | 'en' | 'ru' | 'ua'

interface TranslationCache {
  [key: string]: {
    [language: string]: string
  }
}

export class TranslationService {
  private pool: Pool
  private cache: TranslationCache = {}
  private cacheInitialized = false

  constructor() {
    this.pool = pool
  }

  /**
   * Получить перевод по ключу и языку
   */
  async translate(key: string, language: Language = 'en'): Promise<string> {
    await this.ensureCache()

    if (this.cache[key] && this.cache[key][language]) {
      return this.cache[key][language]
    }

    // Если перевода нет, возвращаем ключ или английский вариант
    if (this.cache[key] && this.cache[key]['en']) {
      return this.cache[key]['en']
    }

    return key
  }

  /**
   * Получить переводы для всех языков по ключу
   */
  async getTranslations(key: string): Promise<Partial<Record<Language, string>>> {
    await this.ensureCache()
    return this.cache[key] || {}
  }

  /**
   * Инициализация кэша переводов
   */
  private async ensureCache(): Promise<void> {
    if (this.cacheInitialized) {
      return
    }

    try {
      const result = await this.pool.query(
        'SELECT key, language, text FROM translations'
      )

      this.cache = {}
      for (const row of result.rows) {
        if (!this.cache[row.key]) {
          this.cache[row.key] = {}
        }
        this.cache[row.key][row.language] = row.text
      }

      this.cacheInitialized = true
    } catch (error) {
      // Если таблицы нет или ошибка БД, используем пустой кэш
      console.warn('Failed to load translations:', error)
      this.cacheInitialized = true
    }
  }

  /**
   * Очистить кэш (для перезагрузки переводов)
   */
  clearCache(): void {
    this.cache = {}
    this.cacheInitialized = false
  }
}

// Стандартные переводы для сообщений об ошибках
const defaultTranslations: Record<string, Record<Language, string>> = {
  'error.unauthorized': {
    en: 'Unauthorized',
    sr: 'Neovlašćeno',
    hu: 'Jogosulatlan',
    ro: 'Neautorizat',
    ru: 'Не авторизован',
    ua: 'Не авторизовано',
  },
  'error.user_exists': {
    en: 'User with this email already exists',
    sr: 'Korisnik sa ovom e-poštom već postoji',
    hu: 'Ez az e-mail cím már használatban van',
    ro: 'Utilizatorul cu acest e-mail există deja',
    ru: 'Пользователь с таким email уже существует',
    ua: 'Користувач з таким email вже існує',
  },
  'error.invalid_credentials': {
    en: 'Invalid email or password',
    sr: 'Neispravna e-pošta ili lozinka',
    hu: 'Érvénytelen e-mail vagy jelszó',
    ro: 'E-mail sau parolă incorectă',
    ru: 'Неверный email или пароль',
    ua: 'Невірний email або пароль',
  },
  'error.profile_not_found': {
    en: 'Health profile not found. Please create your profile first.',
    sr: 'Zdravstveni profil nije pronađen. Molimo vas da prvo kreirajte profil.',
    hu: 'Az egészségügyi profil nem található. Kérjük, először hozza létre a profilját.',
    ro: 'Profilul de sănătate nu a fost găsit. Vă rugăm să creați mai întâi profilul.',
    ru: 'Профиль здоровья не найден. Пожалуйста, сначала создайте профиль.',
    ua: 'Профіль здоров\'я не знайдено. Будь ласка, спочатку створіть профіль.',
  },
  'error.incomplete_profile': {
    en: 'Missing required profile fields',
    sr: 'Nedostaju obavezni podaci profila',
    hu: 'Hiányoznak a kötelező profil adatok',
    ro: 'Lipsesc câmpurile obligatorii ale profilului',
    ru: 'Отсутствуют обязательные поля профиля',
    ua: 'Відсутні обов\'язкові поля профілю',
  },
  'error.validation_error': {
    en: 'Validation error',
    sr: 'Greška validacije',
    hu: 'Érvényesítési hiba',
    ro: 'Eroare de validare',
    ru: 'Ошибка валидации',
    ua: 'Помилка валідації',
  },
}

export function getDefaultTranslation(key: string, language: Language = 'en'): string {
  if (defaultTranslations[key] && defaultTranslations[key][language]) {
    return defaultTranslations[key][language]
  }
  if (defaultTranslations[key] && defaultTranslations[key]['en']) {
    return defaultTranslations[key]['en']
  }
  return key
}

