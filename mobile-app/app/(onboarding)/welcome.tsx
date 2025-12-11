import { View, Text, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Link } from 'expo-router'
import { Button } from '../../src/components/ui/Button'
import i18n from '../../src/i18n'

export default function WelcomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="flex-1 justify-center items-center px-6">
        <View className="flex-1 justify-center items-center">
          {/* Logo placeholder */}
          <View className="w-32 h-32 bg-blue-100 rounded-full items-center justify-center mb-8">
            <Text className="text-4xl">🏋️</Text>
          </View>

          <Text className="text-3xl font-bold text-gray-900 text-center mb-4">
            {i18n.t('welcome')}
          </Text>
          <Text className="text-lg text-gray-600 text-center mb-12">
            {i18n.t('welcome_subtitle')}
          </Text>
        </View>

        <View className="w-full mb-8">
          <Link href="/(onboarding)/language" asChild>
            <Button title={i18n.t('get_started')} onPress={() => {}} />
          </Link>
          <Link href="/(auth)/login" asChild className="mt-4">
            <Button title={i18n.t('login')} onPress={() => {}} variant="outline" />
          </Link>
        </View>
      </View>
    </SafeAreaView>
  )
}

