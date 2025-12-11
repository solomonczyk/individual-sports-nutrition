import { Redirect, useRouter } from 'expo-router'
import { useEffect } from 'react'
import { useAuthStore } from '../src/store/auth-store'
import { useQuery } from '@tanstack/react-query'
import { healthProfileService } from '../src/services/health-profile-service'

export default function Index() {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()

  const { data: healthProfile, isLoading } = useQuery({
    queryKey: ['healthProfile'],
    queryFn: () => healthProfileService.get(),
    enabled: isAuthenticated,
    retry: false,
  })

  // Если пользователь не авторизован - показываем онбординг
  if (!isAuthenticated) {
    return <Redirect href="/(onboarding)/welcome" />
  }

  // Если авторизован, проверяем наличие профиля здоровья
  if (isLoading) {
    return null // Можно показать загрузку
  }

  if (!healthProfile?.data) {
    return <Redirect href="/health-profile/create" />
  }

  // Если есть профиль - переходим на главный экран
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

