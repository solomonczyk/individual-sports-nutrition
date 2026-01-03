import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { View, Platform } from 'react-native'
import { DesignTokens } from '../../src/constants/DesignTokens'
import i18n from '../../src/i18n'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: DesignTokens.colors.primary,
        tabBarInactiveTintColor: DesignTokens.colors.textTertiary,
        tabBarStyle: {
          position: 'absolute',
          bottom: 24,
          left: 20,
          right: 20,
          backgroundColor: DesignTokens.colors.surfaceElevated,
          borderRadius: 32,
          height: 64,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: DesignTokens.colors.glassBorder,
          paddingBottom: Platform.OS === 'ios' ? 0 : 0,
          ...DesignTokens.shadows.premium,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: i18n.t('tab_home'),
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused && styles.activeIconContainer}>
              <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: i18n.t('catalog'),
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused && styles.activeIconContainer}>
              <Ionicons name={focused ? "grid" : "grid-outline"} size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: i18n.t('tab_progress'),
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused && styles.activeIconContainer}>
              <Ionicons name={focused ? "stats-chart" : "stats-chart-outline"} size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: i18n.t('tab_profile'),
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused && styles.activeIconContainer}>
              <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: i18n.t('tab_settings'),
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused && styles.activeIconContainer}>
              <Ionicons name={focused ? "settings" : "settings-outline"} size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="advice"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  )
}

const styles = {
  activeIconContainer: {
    backgroundColor: `${DesignTokens.colors.primary}15`,
    padding: 10,
    borderRadius: 20,
  }
}

