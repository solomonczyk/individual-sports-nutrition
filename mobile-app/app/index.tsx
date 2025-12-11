import { Redirect } from 'expo-router'
import { useAuthStore } from '../src/store/auth-store'
import { useQuery } from '@tanstack/react-query'
import { healthProfileService } from '../src/services/health-profile-service'

export default function Index() {
  const { isAuthenticated } = useAuthStore()

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
}
