import { I18n } from 'i18n-js'

export type Language = 'sr' | 'hu' | 'ro' | 'en' | 'ru' | 'ua'

const translations = {
  sr: {
    welcome: 'Добродошли',
    welcome_subtitle: 'Персонализовано спортско исхрана',
    get_started: 'Почните',
    login: 'Пријави се',
    register: 'Региструј се',
    email: 'Е-пошта',
    password: 'Лозинка',
    confirm_password: 'Потврди лозинку',
    next: 'Следеће',
    back: 'Назад',
    skip: 'Прескочи',
    language: 'Језик',
    select_language: 'Изабери језик',
  },
  hu: {
    welcome: 'Üdvözöljük',
    welcome_subtitle: 'Személyre szabott sporttáplálkozás',
    get_started: 'Kezdés',
    login: 'Bejelentkezés',
    register: 'Regisztráció',
    email: 'E-mail',
    password: 'Jelszó',
    confirm_password: 'Jelszó megerősítése',
    next: 'Következő',
    back: 'Vissza',
    skip: 'Kihagyás',
    language: 'Nyelv',
    select_language: 'Válassz nyelvet',
  },
  ro: {
    welcome: 'Bun venit',
    welcome_subtitle: 'Nutriție sportivă personalizată',
    get_started: 'Începe',
    login: 'Autentificare',
    register: 'Înregistrare',
    email: 'E-mail',
    password: 'Parolă',
    confirm_password: 'Confirmă parola',
    next: 'Următorul',
    back: 'Înapoi',
    skip: 'Sari peste',
    language: 'Limbă',
    select_language: 'Selectează limba',
  },
  en: {
    welcome: 'Welcome',
    welcome_subtitle: 'Personalized Sports Nutrition',
    get_started: 'Get Started',
    login: 'Login',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    confirm_password: 'Confirm Password',
    next: 'Next',
    back: 'Back',
    skip: 'Skip',
    language: 'Language',
    select_language: 'Select Language',
  },
  ru: {
    welcome: 'Добро пожаловать',
    welcome_subtitle: 'Персонализированное спортивное питание',
    get_started: 'Начать',
    login: 'Войти',
    register: 'Регистрация',
    email: 'Email',
    password: 'Пароль',
    confirm_password: 'Подтвердите пароль',
    next: 'Далее',
    back: 'Назад',
    skip: 'Пропустить',
    language: 'Язык',
    select_language: 'Выберите язык',
  },
  ua: {
    welcome: 'Ласкаво просимо',
    welcome_subtitle: 'Персоналізоване спортивне харчування',
    get_started: 'Почати',
    login: 'Увійти',
    register: 'Реєстрація',
    email: 'Email',
    password: 'Пароль',
    confirm_password: 'Підтвердити пароль',
    next: 'Далі',
    back: 'Назад',
    skip: 'Пропустити',
    language: 'Мова',
    select_language: 'Виберіть мову',
  },
}

const i18n = new I18n(translations)
i18n.defaultLocale = 'sr'
i18n.enableFallback = true
i18n.locale = 'sr'

export default i18n

