// Используем прямой путь к require версии для совместимости с Metro bundler
const i18nModule = require('i18n-js/dist/require/index.js')
// В require версии I18n экспортируется как i18nModule.I18n
const I18n = i18nModule.I18n

import en from './locales/en.json'
import ru from './locales/ru.json'
import sr from './locales/sr.json'
import hu from './locales/hu.json'
import ro from './locales/ro.json'
import uk from './locales/uk.json'

if (!I18n || typeof I18n !== 'function') {
  console.error('I18n module:', i18nModule)
  console.error('I18n type:', typeof I18n, I18n)
  throw new Error(`I18n is not a constructor. Got: ${typeof I18n}, value: ${I18n}`)
}

const i18n = new I18n({
  en,
  ru,
  sr,
  hu,
  ro,
  uk,
})

i18n.enableFallback = true
i18n.locale = 'en'

export default i18n

export type Language = 'sr' | 'hu' | 'ro' | 'en' | 'ru' | 'uk'
