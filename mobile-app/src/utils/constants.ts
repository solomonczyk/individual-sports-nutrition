export const SUPPORTED_LANGUAGES = [
  { code: 'sr', name: 'Српски' },
  { code: 'hu', name: 'Magyar' },
  { code: 'ro', name: 'Română' },
  { code: 'en', name: 'English' },
  { code: 'ru', name: 'Русский' },
  { code: 'uk', name: 'Українська' },
] as const

export const ACTIVITY_LEVELS = [
  { value: 'low', label: 'Низкая активность' },
  { value: 'moderate', label: 'Умеренная активность' },
  { value: 'high', label: 'Высокая активность' },
  { value: 'very_high', label: 'Очень высокая активность' },
] as const

export const GOALS = [
  { value: 'muscle_gain', label: 'Набор мышечной массы' },
  { value: 'weight_loss', label: 'Похудение' },
  { value: 'endurance', label: 'Выносливость' },
  { value: 'strength', label: 'Сила' },
] as const

