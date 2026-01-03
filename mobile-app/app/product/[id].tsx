import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../src/services/api-client';
import { API_ENDPOINTS } from '../../src/config/api';
import { recommendationsService } from '../../src/services/recommendations-service';
import { LoadingSpinner, GlassCard, Badge, ModernButton } from '../../src/components/ui';
import { DesignTokens } from '../../src/constants/DesignTokens';
import { Product } from '../../src/types/product';
import i18n from '../../src/i18n';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: productData, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: Product }>(`${API_ENDPOINTS.products}/${id}`);
      return response;
    },
    enabled: !!id,
  });

  const { data: compatibilityData } = useQuery({
    queryKey: ['productCompatibility', id],
    queryFn: () => recommendationsService.checkCompatibility(id!),
    enabled: !!id,
  });

  const { data: pricesData } = useQuery({
    queryKey: ['productPrices', id],
    queryFn: async () => {
      const response = await apiClient.get(`${API_ENDPOINTS.dosage.products}/${id}/prices`);
      return response;
    },
    enabled: !!id,
  });

  const product = productData?.data;
  const compatibility = compatibilityData?.data;
  const prices = pricesData?.data;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <LoadingSpinner message="Loading product..." />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={DesignTokens.colors.textTertiary} />
          <Text style={styles.emptyText}>Product not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const productName = product.name || product.name_key;
  const brandName = product.brand?.name || 'Unknown';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={DesignTokens.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <TouchableOpacity style={styles.favoriteButton}>
          <Ionicons name="heart-outline" size={24} color={DesignTokens.colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          {product.image_url ? (
            <Image source={{ uri: product.image_url }} style={styles.productImage} contentFit="contain" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="nutrition" size={80} color={DesignTokens.colors.textTertiary} />
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.infoSection}>
          <Badge text={product.type.replace('_', ' ').toUpperCase()} variant="primary" size="sm" />
          <Text style={styles.productName}>{productName}</Text>
          <Text style={styles.brandName}>{brandName}</Text>
        </View>

        {/* Compatibility */}
        {compatibility && (
          <GlassCard style={[styles.compatibilityCard, !compatibility.compatible && styles.incompatibleCard]}>
            <View style={styles.compatibilityHeader}>
              <Ionicons
                name={compatibility.compatible ? 'checkmark-circle' : 'alert-circle'}
                size={24}
                color={compatibility.compatible ? DesignTokens.colors.success : DesignTokens.colors.error}
              />
              <Text style={[styles.compatibilityTitle, !compatibility.compatible && styles.incompatibleText]}>
                {compatibility.compatible ? 'Compatible with your profile' : 'Not Recommended'}
              </Text>
            </View>
            {compatibility.warnings?.length > 0 && (
              <View style={styles.warningsList}>
                {compatibility.warnings.map((warning: string, index: number) => (
                  <Text key={index} style={styles.warningText}>• {warning}</Text>
                ))}
              </View>
            )}
          </GlassCard>
        )}

        {/* Macros */}
        <GlassCard style={styles.macrosCard}>
          <Text style={styles.sectionTitle}>Nutritional Info</Text>
          <View style={styles.macrosGrid}>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{product.macros.calories}</Text>
              <Text style={styles.macroLabel}>Calories</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{product.macros.protein}g</Text>
              <Text style={styles.macroLabel}>Protein</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{product.macros.carbs}g</Text>
              <Text style={styles.macroLabel}>Carbs</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{product.macros.fats}g</Text>
              <Text style={styles.macroLabel}>Fats</Text>
            </View>
          </View>
          {product.serving_size && (
            <Text style={styles.servingSize}>Per serving: {product.serving_size}</Text>
          )}
        </GlassCard>

        {/* Prices */}
        {prices && prices.length > 0 && (
          <View style={styles.pricesSection}>
            <Text style={styles.sectionTitle}>Available in Stores</Text>
            {prices.slice(0, 5).map((price: any, index: number) => (
              <TouchableOpacity
                key={index}
                style={styles.priceCard}
                onPress={() => price.store_url && Linking.openURL(price.store_url)}
              >
                <View style={styles.priceInfo}>
                  <Text style={styles.storeName}>{price.store_name}</Text>
                  {price.package_name && <Text style={styles.packageName}>{price.package_name}</Text>}
                </View>
                <View style={styles.priceValue}>
                  <Text style={styles.priceAmount}>{price.price} RSD</Text>
                  <Ionicons name="chevron-forward" size={20} color={DesignTokens.colors.textTertiary} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomCTA}>
        <ModernButton title="View Shopping Options" onPress={() => router.push(`/shopping/${id}`)} />
      </View>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DesignTokens.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: DesignTokens.colors.glassBorder },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: DesignTokens.colors.textPrimary },
  favoriteButton: { padding: 8 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  imageContainer: { height: 250, backgroundColor: DesignTokens.colors.surface, justifyContent: 'center', alignItems: 'center' },
  productImage: { width: '100%', height: '100%' },
  imagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  infoSection: { padding: 20, gap: 8 },
  productName: { fontSize: 28, fontWeight: '800', color: DesignTokens.colors.textPrimary, letterSpacing: -0.5 },
  brandName: { fontSize: 16, color: DesignTokens.colors.textSecondary },
  compatibilityCard: { marginHorizontal: 20, marginBottom: 16, padding: 16 },
  incompatibleCard: { borderColor: `${DesignTokens.colors.error}40`, backgroundColor: `${DesignTokens.colors.error}10` },
  compatibilityHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  compatibilityTitle: { fontSize: 16, fontWeight: '600', color: DesignTokens.colors.success },
  incompatibleText: { color: DesignTokens.colors.error },
  warningsList: { marginTop: 12 },
  warningText: { fontSize: 14, color: DesignTokens.colors.textSecondary, marginTop: 4 },
  macrosCard: { marginHorizontal: 20, marginBottom: 16, padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: DesignTokens.colors.textPrimary, marginBottom: 16 },
  macrosGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  macroItem: { alignItems: 'center', flex: 1 },
  macroValue: { fontSize: 24, fontWeight: '800', color: DesignTokens.colors.textPrimary },
  macroLabel: { fontSize: 12, color: DesignTokens.colors.textSecondary, marginTop: 4 },
  servingSize: { fontSize: 13, color: DesignTokens.colors.textTertiary, marginTop: 16, textAlign: 'center' },
  pricesSection: { paddingHorizontal: 20, marginBottom: 20 },
  priceCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: DesignTokens.colors.surface, padding: 16, borderRadius: 12, marginTop: 12, borderWidth: 1, borderColor: DesignTokens.colors.glassBorder },
  priceInfo: { flex: 1 },
  storeName: { fontSize: 16, fontWeight: '600', color: DesignTokens.colors.textPrimary },
  packageName: { fontSize: 13, color: DesignTokens.colors.textSecondary, marginTop: 2 },
  priceValue: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  priceAmount: { fontSize: 18, fontWeight: '700', color: DesignTokens.colors.primary },
  bottomCTA: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: DesignTokens.colors.background, borderTopWidth: 1, borderTopColor: DesignTokens.colors.glassBorder },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 18, color: DesignTokens.colors.textSecondary, marginTop: 16 },
});
