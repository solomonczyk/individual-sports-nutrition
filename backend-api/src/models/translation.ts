export interface Translation {
  key: string
  language: 'sr' | 'hu' | 'ro' | 'en' | 'ru' | 'uk'
  text: string
}

export interface TranslationsMap {
  [key: string]: {
    [language: string]: string
  }
}

