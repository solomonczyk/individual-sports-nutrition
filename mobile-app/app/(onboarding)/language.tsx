import React from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'
import { useLanguageStore } from '../../src/store/language-store'
import { Language } from '../../src/i18n'
import { ModernButton } from '../../src/components/ui/ModernButton'
import { DesignTokens } from '../../src/constants/DesignTokens'
import { GlassCard } from '../../src/components/ui/GlassCard'
import i18n from '../../src/i18n'
import { Ionicons } from '@expo/vector-icons'

const languages: Array<{ code: Language; name: string; nativeName: string }> = [
  { code: 'sr', name: 'Serbian', nativeName: 'Српски' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська' },
]

export default function LanguageScreen() {
  const { language, setLanguage } = useLanguageStore()
  const router = useRouter()

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang)
    i18n.locale = lang
  }

  const handleNext = () => {
    router.push('/(onboarding)/intro')
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {i18n.t('select_language')}
          </Text>
          <Text style={styles.subtitle}>
            Одаберите језик / Select your language
          </Text>
        </View>

        <View style={styles.list}>
          {languages.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                onPress={() => handleLanguageSelect(lang.code)}
                activeOpacity={0.7}
              >
                <GlassCard style={StyleSheet.flatten([
                  styles.card,
                  isSelected && styles.selectedCard
                ])}>
                  <View>
                    <Text style={[styles.langNative, isSelected && styles.selectedText]}>
                      {lang.nativeName}
                    </Text>
                    <Text style={styles.langName}>{lang.name}</Text>
                  </View>
                  {isSelected && (
                    <View style={styles.checkCircle}>
                      <Ionicons name="checkmark" size={16} color="white" />
                    </View>
                  )}
                </GlassCard>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <ModernButton title={i18n.t('next')} onPress={handleNext} />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignTokens.colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: DesignTokens.spacing.lg,
  },
  header: {
    marginTop: 24,
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: DesignTokens.colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: DesignTokens.colors.textSecondary,
    marginTop: 8,
  },
  list: {
    gap: 12,
  },
  card: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedCard: {
    borderColor: DesignTokens.colors.primary,
    backgroundColor: `${DesignTokens.colors.primary}10`,
  },
  langNative: {
    fontSize: 18,
    fontWeight: '700',
    color: DesignTokens.colors.textPrimary,
  },
  selectedText: {
    color: DesignTokens.colors.primary,
  },
  langName: {
    fontSize: 14,
    color: DesignTokens.colors.textSecondary,
    marginTop: 2,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: DesignTokens.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    padding: DesignTokens.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: DesignTokens.colors.glassBorder,
  }
})

