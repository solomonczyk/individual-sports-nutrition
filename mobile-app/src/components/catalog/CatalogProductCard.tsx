import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../../types/product';
import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/Badge';
import { DesignTokens } from '../../constants/DesignTokens';

interface CatalogProductCardProps {
  product: Product;
  isRecommended?: boolean;
  onPress?: () => void;
  onFavoritePress?: () => void;
  isFavorite?: boolean;
}

export const CatalogProductCard: React.FC<CatalogProductCardProps> = ({
  product,
  isRecommended,
  onPress,
  onFavoritePress,
  isFavorite,
}) => {
  const productName = product.name || product.name_key;
  const brandName = product.brand?.name || 'Unknown';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <GlassCard style={styles.card}>
        <View style={styles.imageContainer}>
          {product.image_url ? (
            <Image source={{ uri: product.image_url }} style={styles.image} contentFit="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="nutrition" size={40} color={DesignTokens.colors.textTertiary} />
            </View>
          )}
          {isRecommended && (
            <View style={styles.recommendedBadge}>
              <Ionicons name="star" size={12} color="#fff" />
            </View>
          )}
          {onFavoritePress && (
            <TouchableOpacity style={styles.favoriteButton} onPress={onFavoritePress}>
              <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={20} color={isFavorite ? DesignTokens.colors.error : DesignTokens.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.content}>
          <Badge text={product.type.replace('_', ' ')} variant="info" size="sm" />
          <Text style={styles.productName} numberOfLines={2}>{productName}</Text>
          <Text style={styles.brandName}>{brandName}</Text>

          <View style={styles.footer}>
            <View style={styles.macros}>
              <Text style={styles.macroText}>{product.macros.protein}g protein</Text>
            </View>
            {product.price && (
              <Text style={styles.price}>{product.price} RSD</Text>
            )}
          </View>

          {!product.available && (
            <View style={styles.outOfStock}>
              <Text style={styles.outOfStockText}>Out of stock</Text>
            </View>
          )}
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
};


const styles = StyleSheet.create({
  card: { padding: 0, overflow: 'hidden' },
  imageContainer: { height: 140, backgroundColor: DesignTokens.colors.surface, position: 'relative' },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  recommendedBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: DesignTokens.colors.accent, width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  favoriteButton: { position: 'absolute', top: 8, right: 8, backgroundColor: DesignTokens.colors.glassBackground, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 12 },
  productName: { fontSize: 15, fontWeight: '700', color: DesignTokens.colors.textPrimary, marginTop: 8, lineHeight: 20 },
  brandName: { fontSize: 13, color: DesignTokens.colors.textSecondary, marginTop: 2 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  macros: { flexDirection: 'row' },
  macroText: { fontSize: 12, color: DesignTokens.colors.textTertiary },
  price: { fontSize: 16, fontWeight: '700', color: DesignTokens.colors.primary },
  outOfStock: { backgroundColor: `${DesignTokens.colors.error}15`, padding: 6, borderRadius: 6, marginTop: 8 },
  outOfStockText: { fontSize: 12, color: DesignTokens.colors.error, textAlign: 'center', fontWeight: '600' },
});
