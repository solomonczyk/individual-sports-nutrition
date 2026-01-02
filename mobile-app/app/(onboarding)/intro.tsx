import React from 'react'
import { View, Text, StyleSheet, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'
import { ModernButton } from '../../src/components/ui/ModernButton'
import { DesignTokens } from '../../src/constants/DesignTokens'
import i18n from '../../src/i18n'
import { Ionicons } from '@expo/vector-icons'

const { width } = Dimensions.get('window')

const introSteps = [
  {
    title: 'Personalized Evolution',
    description: 'We adapt to your unique health profile, goals, and needs.',
    icon: 'fitness-outline',
  },
  {
    title: 'Local Intelligence',
    description: 'Recommendations optimized for products found in your region.',
    icon: 'cart-outline',
  },
  {
    title: 'Total Mastery',
    description: 'Track every metric and adapt your plan in real-time.',
    icon: 'stats-chart-outline',
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
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.content}>
        {/* Progress indicators at top */}
        <View style={styles.progressContainer}>
          {introSteps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index === currentStep ? styles.progressActive : styles.progressInactive
              ]}
            />
          ))}
        </View>

        {/* Content */}
        <View style={styles.main}>
          <View style={styles.iconCircle}>
            <Ionicons
              name={step.icon as any}
              size={80}
              color={DesignTokens.colors.primary}
            />
          </View>

          <Text style={styles.title}>
            {step.title}
          </Text>
          <Text style={styles.description}>
            {step.description}
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.footer}>
          <ModernButton title={i18n.t('next')} onPress={handleNext} />
          <ModernButton
            title={i18n.t('skip')}
            onPress={handleSkip}
            variant="outline"
            style={styles.skipButton}
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignTokens.colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: DesignTokens.spacing.xl,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    gap: 8,
  },
  progressDot: {
    height: 4,
    borderRadius: 2,
  },
  progressActive: {
    width: 32,
    backgroundColor: DesignTokens.colors.primary,
  },
  progressInactive: {
    width: 12,
    backgroundColor: DesignTokens.colors.surfaceElevated,
  },
  main: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: `${DesignTokens.colors.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    borderWidth: 1,
    borderColor: `${DesignTokens.colors.primary}20`,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: DesignTokens.colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 18,
    color: DesignTokens.colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 28,
  },
  footer: {
    paddingBottom: DesignTokens.spacing.lg,
  },
  skipButton: {
    marginTop: 16,
  }
})

