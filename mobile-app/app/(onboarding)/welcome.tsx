import React from 'react'
import { View, Text, StyleSheet, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'
import { ModernButton } from '../../src/components/ui/ModernButton'
import { DesignTokens } from '../../src/constants/DesignTokens'
import i18n from '../../src/i18n'
import { Ionicons } from '@expo/vector-icons'

export default function WelcomeScreen() {
  const router = useRouter()

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <View style={styles.main}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="fitness" size={60} color={DesignTokens.colors.primary} />
            </View>
            <View style={styles.logoRing} />
          </View>

          <Text style={styles.title}>
            {i18n.t('welcome')}
          </Text>
          <Text style={styles.subtitle}>
            {i18n.t('welcome_subtitle')}
          </Text>
        </View>

        <View style={styles.footer}>
          <ModernButton
            title={i18n.t('get_started')}
            onPress={() => router.push('/(onboarding)/language')}
          />
          <ModernButton
            title={i18n.t('login')}
            onPress={() => router.push('/(auth)/login')}
            variant="outline"
            style={styles.loginButton}
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
    justifyContent: 'center',
  },
  main: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 48,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${DesignTokens.colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${DesignTokens.colors.primary}30`,
    zIndex: 2,
  },
  logoRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: `${DesignTokens.colors.primary}10`,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: DesignTokens.colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -1.5,
  },
  subtitle: {
    fontSize: 18,
    color: DesignTokens.colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 28,
  },
  footer: {
    paddingBottom: DesignTokens.spacing.lg,
  },
  loginButton: {
    marginTop: 16,
  }
})

