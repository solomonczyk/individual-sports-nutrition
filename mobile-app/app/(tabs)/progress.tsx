import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/auth-store';
import { progressService } from '../../src/services/progress-service';
import { nutritionPlanService } from '../../src/services/nutrition-plan-service';
import { AddProgressModal, StatCard, LineChart, ChartDataPoint } from '../../src/components/progress';
import { LoadingSpinner, GlassCard, useToast } from '../../src/components/ui';
import { DesignTokens } from '../../src/constants/DesignTokens';
import i18n from '../../src/i18n';

type Period = '7d' | '30d' | '90d';

export default function ProgressScreen() {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('30d');
  const [showAddModal, setShowAddModal] = useState(false);

  const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;

  const { data: progressData, isLoading, refetch } = useQuery({
    queryKey: ['progress', days],
    queryFn: () => progressService.getHistory(days),
    enabled: !!user,
  });

  const { data: statsData } = useQuery({
    queryKey: ['progressStats'],
    queryFn: () => progressService.getStats(),
    enabled: !!user,
  });

  const { data: nutritionPlanData } = useQuery({
    queryKey: ['nutritionPlan'],
    queryFn: () => nutritionPlanService.get(),
    enabled: !!user,
  });

  const addProgressMutation = useMutation({
    mutationFn: (data: { weight: number; bodyFat?: number; notes?: string }) =>
      progressService.create({
        date: new Date().toISOString().split('T')[0],
        weight: data.weight,
        body_fat: data.bodyFat,
        notes: data.notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress'] });
      queryClient.invalidateQueries({ queryKey: ['progressStats'] });
      setShowAddModal(false);
      showToast(i18n.t('progress_saved'), 'success');
    },
    onError: () => {
      showToast(i18n.t('error_saving_progress'), 'error');
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const weightChartData: ChartDataPoint[] = useMemo(() => {
    if (!progressData?.data) return [];
    return progressData.data
      .filter((p) => p.weight)
      .map((p) => ({
        label: new Date(p.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        value: p.weight!,
        date: p.date,
      }))
      .slice(-14);
  }, [progressData]);

  const stats = statsData?.data;
  const targetCalories = nutritionPlanData?.data?.calories || 2000;

  if (isLoading && !progressData) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <LoadingSpinner message={i18n.t('loading_progress')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={DesignTokens.colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{i18n.t('tab_progress')}</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(['7d', '30d', '90d'] as Period[]).map((period) => (
            <TouchableOpacity
              key={period}
              style={[styles.periodButton, selectedPeriod === period && styles.periodButtonActive]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[styles.periodText, selectedPeriod === period && styles.periodTextActive]}>
                {period === '7d' ? i18n.t('seven_days') : period === '30d' ? i18n.t('thirty_days') : i18n.t('ninety_days')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            title={i18n.t('current_weight')}
            value={stats?.current_weight?.toFixed(1) || '--'}
            unit="kg"
            change={stats?.weight_change}
            icon="fitness"
            color={DesignTokens.colors.primary}
          />
          <StatCard
            title={i18n.t('body_fat')}
            value={stats?.current_body_fat?.toFixed(1) || '--'}
            unit="%"
            change={stats?.body_fat_change}
            icon="body"
            color={DesignTokens.colors.secondary}
          />
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            title={i18n.t('avg_calories')}
            value={Math.round(stats?.avg_calories_consumed || 0)}
            unit="kcal"
            icon="flame"
            color={DesignTokens.colors.warning}
          />
          <StatCard
            title={i18n.t('days_tracked')}
            value={stats?.days_tracked || 0}
            icon="calendar"
            color={DesignTokens.colors.accent}
          />
        </View>

        {/* Weight Chart */}
        {weightChartData.length > 0 && (
          <GlassCard style={styles.chartCard}>
            <Text style={styles.chartTitle}>{i18n.t('weight_trend')}</Text>
            <LineChart data={weightChartData} unit=" kg" color={DesignTokens.colors.primary} height={180} />
          </GlassCard>
        )}

        {/* Recent Entries */}
        {progressData?.data && progressData.data.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>{i18n.t('recent_entries')}</Text>
            {progressData.data.slice(0, 5).map((entry) => (
              <GlassCard key={entry.id} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryDate}>
                    {new Date(entry.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </Text>
                  {entry.weight && <Text style={styles.entryWeight}>{entry.weight} kg</Text>}
                </View>
                {entry.body_fat && <Text style={styles.entryBodyFat}>{i18n.t('body_fat')}: {entry.body_fat}%</Text>}
                {entry.notes && <Text style={styles.entryNotes}>{entry.notes}</Text>}
              </GlassCard>
            ))}
          </View>
        )}
      </ScrollView>

      <AddProgressModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={(data) => addProgressMutation.mutate(data)}
        loading={addProgressMutation.isPending}
      />
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DesignTokens.colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 120 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 32, fontWeight: '800', color: DesignTokens.colors.textPrimary, letterSpacing: -0.5 },
  addButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: DesignTokens.colors.primary, justifyContent: 'center', alignItems: 'center' },
  periodSelector: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20, gap: 8 },
  periodButton: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: DesignTokens.colors.surface, alignItems: 'center', borderWidth: 1, borderColor: DesignTokens.colors.glassBorder },
  periodButtonActive: { backgroundColor: DesignTokens.colors.primary, borderColor: DesignTokens.colors.primary },
  periodText: { fontSize: 14, fontWeight: '600', color: DesignTokens.colors.textSecondary },
  periodTextActive: { color: '#fff' },
  statsGrid: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 12 },
  chartCard: { marginHorizontal: 20, marginTop: 8, padding: 16 },
  chartTitle: { fontSize: 16, fontWeight: '700', color: DesignTokens.colors.textPrimary, marginBottom: 12 },
  recentSection: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: DesignTokens.colors.textPrimary, marginBottom: 12 },
  entryCard: { padding: 16, marginBottom: 10 },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  entryDate: { fontSize: 14, fontWeight: '600', color: DesignTokens.colors.textPrimary },
  entryWeight: { fontSize: 18, fontWeight: '700', color: DesignTokens.colors.primary },
  entryBodyFat: { fontSize: 13, color: DesignTokens.colors.textSecondary, marginTop: 4 },
  entryNotes: { fontSize: 13, color: DesignTokens.colors.textTertiary, marginTop: 6, fontStyle: 'italic' },
});
