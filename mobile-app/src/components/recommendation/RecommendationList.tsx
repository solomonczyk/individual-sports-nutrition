import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { ProductRecommendation, Dosage } from '../../types/recommendation';
import { RecommendationCard } from './RecommendationCard';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { EmptyState } from '../ui/EmptyState';
import { DesignTokens } from '../../constants/DesignTokens';
import i18n from '../../i18n';

interface RecommendationListProps {
  recommendations: ProductRecommendation[];
  dosages?: Dosage[];
  loading?: boolean;
  onProductPress?: (productId: string) => void;
  onBuyPress?: (productId: string) => void;
}

export const RecommendationList: React.FC<RecommendationListProps> = ({
  recommendations,
  dosages,
  loading,
  onProductPress,
  onBuyPress,
}) => {
  const getDosageForProduct = (productId: string): Dosage | undefined => {
    return dosages?.find((d) => d.product_id === productId);
  };

  if (loading) {
    return <LoadingSpinner message={i18n.t('loading_recommendations')} />;
  }

  if (recommendations.length === 0) {
    return (
      <EmptyState
        title={i18n.t('no_recommendations')}
        message={i18n.t('complete_profile_desc')}
      />
    );
  }

  return (
    <View style={styles.container}>
      {recommendations.map((recommendation) => (
        <RecommendationCard
          key={recommendation.product.id}
          recommendation={recommendation}
          dosage={getDosageForProduct(recommendation.product.id)}
          onPress={() => onProductPress?.(recommendation.product.id)}
          onBuyPress={() => onBuyPress?.(recommendation.product.id)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 0 },
});
