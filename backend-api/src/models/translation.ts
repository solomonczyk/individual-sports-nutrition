export interface Translation {
  key: string
  language: 'sr' | 'hu' | 'ro' | 'en' | 'ru' | 'ua'
  text: string
}

export interface TranslationsMap {
  [key: string]: {
    [language: string]: string
  }
}

