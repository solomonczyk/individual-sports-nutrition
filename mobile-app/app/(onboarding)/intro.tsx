import React from 'react'
import { View, Text, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'
import { Button } from '../../src/components/ui/Button'
import i18n from '../../src/i18n'

const { width } = Dimensions.get('window')

const introSteps = [
  {
    title: 'Персонализованный подход',
    description: 'Мы учитываем ваше здоровье, цели и противопоказания',
    emoji: '🎯',
  },
  {
    title: 'Локальные продукты',
    description: 'Рекомендации на основе доступных продуктов в Сербии',
    emoji: '🛒',
  },
  {
    title: 'Полный контроль',
    description: 'Отслеживайте прогресс и корректируйте план питания',
    emoji: '📊',
  },
]

export default function IntroScreen() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = React.useState(0)

  const handleNext = () => {
    if (currentStep < introSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      router.push('/(auth)/register')
    }
  }

  const handleSkip = () => {
    router.push('/(auth)/register')
  }

  const step = introSteps[currentStep]

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="flex-1 px-6">
        {/* Progress dots */}
        <View className="flex-row justify-center pt-8 pb-4">
          {introSteps.map((_, index) => (
            <View
              key={index}
              className={`
                h-2 rounded-full mx-1
                ${index === currentStep ? 'bg-blue-600 w-8' : 'bg-gray-300 w-2'}
              `}
            />
          ))}
        </View>

        {/* Content */}
        <View className="flex-1 justify-center items-center">
          <Text className="text-8xl mb-8">{step.emoji}</Text>
          <Text className="text-2xl font-bold text-gray-900 text-center mb-4">
            {step.title}
          </Text>
          <Text className="text-lg text-gray-600 text-center px-4">
            {step.description}
          </Text>
        </View>

        {/* Buttons */}
        <View className="pb-8">
          <Button title={i18n.t('next')} onPress={handleNext} />
          <Button
            title={i18n.t('skip')}
            onPress={handleSkip}
            variant="outline"
            className="mt-4"
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

