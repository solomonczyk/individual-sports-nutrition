import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../src/store/auth-store';
import { useLanguageStore } from '../../src/store/language-store';
import { useNotificationStore } from '../../src/store/notification-store';
import { healthProfileService } from '../../src/services/health-profile-service';
import { SettingsSection, SettingsToggle, SettingsRow } from '../../src/components/settings';
import { GlassCard, Avatar } from '../../src/components/ui';
import { DesignTokens } from '../../src/constants/DesignTokens';
import i18n from '../../src/i18n';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { language } = useLanguageStore();
  const { settings, toggleSetting } = useNotificationStore();

  const { data: healthProfileData } = useQuery({
    queryKey: ['healthProfile'],
    queryFn: () => healthProfileService.get(),
    enabled: !!user,
  });

  const healthProfile = healthProfileData?.data;

  const handleLogout = () => {
    Alert.alert(i18n.t('logout'), i18n.t('logout_confirm'), [
      { text: i18n.t('cancel'), style: 'cancel' },
      { text: i18n.t('logout'), style: 'destructive', onPress: () => { logout(); router.replace('/(onboarding)/welcome'); } },
    ]);
  };

  const getGoalLabel = (goal?: string) => {
    const goals: Record<string, string> = { mass: i18n.t('mass_gain'), cut: i18n.t('weight_loss'), maintain: i18n.t('maintenance'), endurance: i18n.t('endurance') };
    return goal ? goals[goal] || goal : i18n.t('not_set');
  };

  const getLanguageName = () => {
    const langs: Record<string, string> = { sr: 'Српски', hu: 'Magyar', ro: 'Română', en: 'English', ru: 'Русский', uk: 'Українська' };
    return langs[language] || 'English';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{i18n.t('tab_settings')}</Text>
        </View>

        {/* Profile Card */}
        <GlassCard style={styles.profileCard}>
          <Avatar name={user?.email} size="lg" />
          <View style={styles.profileInfo}>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <Text style={styles.profileGoal}>{getGoalLabel(healthProfile?.goal)}</Text>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={() => router.push('/health-profile/edit')}>
            <Ionicons name="pencil" size={18} color={DesignTokens.colors.primary} />
          </TouchableOpacity>
        </GlassCard>

        {/* Profile Section */}
        <SettingsSection title={i18n.t('tab_profile')}>
          <SettingsRow
            icon="body"
            title={i18n.t('health_profile')}
            value={healthProfile ? `${healthProfile.age} ${i18n.t('years')}, ${healthProfile.weight} kg` : i18n.t('not_set')}
            onPress={() => router.push('/health-profile/edit')}
            iconColor={DesignTokens.colors.primary}
          />
          <SettingsRow
            icon="language"
            title={i18n.t('language')}
            value={getLanguageName()}
            onPress={() => router.push('/(onboarding)/language')}
            iconColor={DesignTokens.colors.secondary}
            isLast
          />
        </SettingsSection>

        {/* Notifications Section */}
        <SettingsSection title={i18n.t('notifications')}>
          <SettingsToggle
            icon="restaurant"
            title={i18n.t('meal_reminders')}
            description={i18n.t('meal_reminders_desc')}
            value={settings.mealReminders}
            onValueChange={() => toggleSetting('mealReminders')}
            iconColor={DesignTokens.colors.accent}
          />
          <SettingsToggle
            icon="medical"
            title={i18n.t('supplement_reminders')}
            description={i18n.t('supplement_reminders_desc')}
            value={settings.supplementReminders}
            onValueChange={() => toggleSetting('supplementReminders')}
            iconColor={DesignTokens.colors.warning}
          />
          <SettingsToggle
            icon="trending-up"
            title={i18n.t('progress_updates')}
            description={i18n.t('progress_updates_desc')}
            value={settings.progressUpdates}
            onValueChange={() => toggleSetting('progressUpdates')}
            iconColor={DesignTokens.colors.success}
          />
          <SettingsToggle
            icon="pricetag"
            title={i18n.t('price_alerts')}
            description={i18n.t('price_alerts_desc')}
            value={settings.priceAlerts}
            onValueChange={() => toggleSetting('priceAlerts')}
            iconColor={DesignTokens.colors.error}
            isLast
          />
        </SettingsSection>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={DesignTokens.colors.error} />
          <Text style={styles.logoutText}>{i18n.t('logout')}</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.version}>v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DesignTokens.colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 120 },
  header: { paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 32, fontWeight: '800', color: DesignTokens.colors.textPrimary, letterSpacing: -0.5 },
  profileCard: { flexDirection: 'row', alignItems: 'center', padding: 16, marginTop: 16, marginBottom: 24 },
  profileInfo: { flex: 1, marginLeft: 16 },
  profileEmail: { fontSize: 16, fontWeight: '600', color: DesignTokens.colors.textPrimary },
  profileGoal: { fontSize: 14, color: DesignTokens.colors.textSecondary, marginTop: 2 },
  editButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: `${DesignTokens.colors.primary}15`, justifyContent: 'center', alignItems: 'center' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16, backgroundColor: `${DesignTokens.colors.error}10`, borderWidth: 1, borderColor: `${DesignTokens.colors.error}30`, marginTop: 8 },
  logoutText: { fontSize: 16, fontWeight: '600', color: DesignTokens.colors.error, marginLeft: 8 },
  version: { textAlign: 'center', fontSize: 12, color: DesignTokens.colors.textTertiary, marginTop: 24 },
});
