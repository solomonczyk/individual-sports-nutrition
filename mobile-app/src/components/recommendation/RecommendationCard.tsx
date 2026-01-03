import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { ProductRecommendation, Dosage } from '../../types/recommendation';
import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/Badge';
import { DesignTokens } from '../../constants/DesignTokens';

interface RecommendationCardProps {
  recommendation: ProductRecommendation;
  dosage?: Dosage;
  onPress?: () => void;
  onBuyPress?: () => void;
}

const getPriorityColor = (score: number) => {
  if (score >= 80) return DesignTokens.colors.success;
  if (score >= 60) return DesignTokens.colors.primary;
  return DesignTokens.colors.warning;
};

const getPriorityLabel = (score: number) => {
  if (score >= 80) return 'Essential';
  if (score >= 60) return 'Recommended';
  return 'Optional';
};

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  dosage,
  onPress,
  onBuyPress,
}) => {
  const { product, score, reasons } = recommendation;
  const priorityColor = getPriorityColor(score);
  const priorityLabel = getPriorityLabel(score);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <GlassCard style={styles.card}>
        <View style={styles.header}>
          <View style={styles.imageContainer}>
            {product.image_url ? (
              <Image source={{ uri: product.image_url }} style={styles.image} contentFit="cover" />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="nutrition" size={32} color={DesignTokens.colors.textTertiary} />
              </View>
            )}
          </View>
          <View style={styles.headerContent}>
            <View style={styles.titleRow}>
              <Text style={styles.productName} numberOfLines={2}>{product.name || product.name_key}</Text>
              <Badge text={`${Math.round(score)}%`} variant="primary" size="sm" />
            </View>
            <Text style={styles.brandName}>{product.brand?.name || 'Unknown'}</Text>
            <Badge text={priorityLabel} variant={score >= 80 ? 'success' : score >= 60 ? 'primary' : 'warning'} size="sm" />
          </View>
        </View>

        {dosage && (
          <View style={styles.dosageContainer}>
            <Ionicons name="time-outline" size={16} color={DesignTokens.colors.primary} />
            <Text style={styles.dosageText}>
              {dosage.daily_servings > 0 ? `${dosage.daily_servings} serving(s)/day` : `${dosage.daily_grams}g/day`}
            </Text>
          </View>
        )}

        {reasons.length > 0 && (
          <View style={styles.reasonContainer}>
            <Ionicons name="sparkles" size={14} color={DesignTokens.colors.accent} />
            <Text style={styles.reasonText} numberOfLines={2}>{reasons[0]}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <View style={styles.macros}>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{product.macros.protein}g</Text>
              <Text style={styles.macroLabel}>Protein</Text>
            </View>
            <View style={styles.macroDivider} />
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{product.macros.calories}</Text>
              <Text style={styles.macroLabel}>kcal</Text>
            </View>
          </View>
          {onBuyPress && (
            <TouchableOpacity style={styles.buyButton} onPress={onBuyPress}>
              <Ionicons name="cart-outline" size={18} color="#fff" />
              <Text style={styles.buyButtonText}>Buy</Text>
            </TouchableOpacity>
          )}
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
};


const styles = StyleSheet.create({
  card: { padding: DesignTokens.spacing.md, marginBottom: 12 },
  header: { flexDirection: 'row', marginBottom: 12 },
  imageContainer: { width: 72, height: 72, borderRadius: 12, overflow: 'hidden', marginRight: 12 },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { width: '100%', height: '100%', backgroundColor: DesignTokens.colors.surface, justifyContent: 'center', alignItems: 'center' },
  headerContent: { flex: 1, justifyContent: 'center' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  productName: { fontSize: 16, fontWeight: '700', color: DesignTokens.colors.textPrimary, flex: 1, marginRight: 8 },
  brandName: { fontSize: 13, color: DesignTokens.colors.textSecondary, marginBottom: 6 },
  dosageContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: `${DesignTokens.colors.primary}15`, padding: 10, borderRadius: 10, marginBottom: 10, gap: 8 },
  dosageText: { fontSize: 14, fontWeight: '600', color: DesignTokens.colors.primary },
  reasonContainer: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 12 },
  reasonText: { fontSize: 13, color: DesignTokens.colors.textSecondary, flex: 1, lineHeight: 18 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  macros: { flexDirection: 'row', alignItems: 'center' },
  macroItem: { alignItems: 'center' },
  macroValue: { fontSize: 16, fontWeight: '700', color: DesignTokens.colors.textPrimary },
  macroLabel: { fontSize: 11, color: DesignTokens.colors.textTertiary, marginTop: 2 },
  macroDivider: { width: 1, height: 24, backgroundColor: DesignTokens.colors.glassBorder, marginHorizontal: 16 },
  buyButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: DesignTokens.colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, gap: 6 },
  buyButtonText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
