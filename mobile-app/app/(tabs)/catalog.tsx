import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../src/services/api-client';
import { API_ENDPOINTS } from '../../src/config/api';
import { CatalogProductCard, FilterModal, CatalogFilters } from '../../src/components/catalog';
import { LoadingSpinner, EmptyState } from '../../src/components/ui';
import { DesignTokens } from '../../src/constants/DesignTokens';
import { Product } from '../../src/types/product';
import i18n from '../../src/i18n';

const defaultFilters: CatalogFilters = {
  types: [],
  brands: [],
  priceRange: { min: 0, max: 50000 },
  inStockOnly: false,
  recommendedOnly: false,
};

export default function CatalogScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<CatalogFilters>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: Product[] }>(API_ENDPOINTS.products);
      return response;
    },
  });

  const products = productsData?.data || [];
  const availableBrands = useMemo(() => {
    const brands = new Set(products.map((p) => p.brand?.name).filter(Boolean));
    return Array.from(brands) as string[];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Search filter
      if (searchQuery) {
        const name = (product.name || product.name_key).toLowerCase();
        const brand = (product.brand?.name || '').toLowerCase();
        if (!name.includes(searchQuery.toLowerCase()) && !brand.includes(searchQuery.toLowerCase())) {
          return false;
        }
      }
      // Type filter
      if (filters.types.length > 0 && !filters.types.includes(product.type)) {
        return false;
      }
      // Brand filter
      if (filters.brands.length > 0 && product.brand && !filters.brands.includes(product.brand.name)) {
        return false;
      }
      // In stock filter
      if (filters.inStockOnly && !product.available) {
        return false;
      }
      return true;
    });
  }, [products, searchQuery, filters]);

  const activeFiltersCount = filters.types.length + filters.brands.length + (filters.inStockOnly ? 1 : 0) + (filters.recommendedOnly ? 1 : 0);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{i18n.t('catalog')}</Text>
      </View>

      {/* Search & Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={DesignTokens.colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder={i18n.t('search_products')}
            placeholderTextColor={DesignTokens.colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={DesignTokens.colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(true)}>
          <Ionicons name="options-outline" size={22} color={DesignTokens.colors.textPrimary} />
          {activeFiltersCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Products Grid */}
      {isLoading ? (
        <LoadingSpinner message={i18n.t('loading')} />
      ) : filteredProducts.length === 0 ? (
        <EmptyState title={i18n.t('no_products')} message={i18n.t('try_different_filters')} />
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <CatalogProductCard
                product={item}
                onPress={() => router.push(`/product/${item.id}`)}
              />
            </View>
          )}
        />
      )}

      {/* Filter Modal */}
      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onApply={setFilters}
        availableBrands={availableBrands}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DesignTokens.colors.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 32, fontWeight: '800', color: DesignTokens.colors.textPrimary, letterSpacing: -0.5 },
  searchContainer: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 16, gap: 12 },
  searchInputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: DesignTokens.colors.surface, borderRadius: 16, paddingHorizontal: 16, height: 50, borderWidth: 1, borderColor: DesignTokens.colors.glassBorder },
  searchInput: { flex: 1, fontSize: 16, color: DesignTokens.colors.textPrimary, marginLeft: 10 },
  filterButton: { width: 50, height: 50, backgroundColor: DesignTokens.colors.surface, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: DesignTokens.colors.glassBorder, position: 'relative' },
  filterBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: DesignTokens.colors.primary, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  filterBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  listContent: { paddingHorizontal: 14, paddingBottom: 120 },
  row: { justifyContent: 'space-between' },
  cardWrapper: { width: '48%', marginBottom: 12 },
});
