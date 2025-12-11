import { Redirect } from 'expo-router'
import { useAuthStore } from '../src/store/auth-store'

export default function Index() {
  const { isAuthenticated } = useAuthStore()

  // Если пользователь не авторизован - показываем онбординг
  if (!isAuthenticated) {
    return <Redirect href="/(onboarding)/welcome" />
  }

  // Если авторизован - переходим на главный экран
  return <Redirect href="/(tabs)/home" />
} {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
})

