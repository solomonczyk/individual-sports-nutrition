import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Modal, ModernButton } from '../ui';
import { DesignTokens } from '../../constants/DesignTokens';
import { Ionicons } from '@expo/vector-icons';
import i18n from '../../i18n';

export interface CatalogFilters {
  types: string[];
  brands: string[];
  priceRange: { min: number; max: number };
  inStockOnly: boolean;
  recommendedOnly: boolean;
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: CatalogFilters;
  onApply: (filters: CatalogFilters) => void;
  availableBrands: string[];
}

const productTypes = [
  { value: 'protein', label: 'Protein' },
  { value: 'creatine', label: 'Creatine' },
  { value: 'amino', label: 'Amino Acids' },
  { value: 'vitamin', label: 'Vitamins' },
  { value: 'pre_workout', label: 'Pre-Workout' },
  { value: 'post_workout', label: 'Post-Workout' },
  { value: 'fat_burner', label: 'Fat Burner' },
  { value: 'other', label: 'Other' },
];

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  filters,
  onApply,
  availableBrands,
}) => {
  const [localFilters, setLocalFilters] = useState<CatalogFilters>(filters);

  const toggleType = (type: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter((t) => t !== type)
        : [...prev.types, type],
    }));
  };

  const toggleBrand = (brand: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      brands: prev.brands.includes(brand)
        ? prev.brands.filter((b) => b !== brand)
        : [...prev.brands, brand],
    }));
  };

  const handleReset = () => {
    setLocalFilters({
      types: [],
      brands: [],
      priceRange: { min: 0, max: 50000 },
      inStockOnly: false,
      recommendedOnly: false,
    });
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  return (
    <Modal visible={visible} onClose={onClose} title={i18n.t('filters')}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Product Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t('product_type')}</Text>
          <View style={styles.chips}>
            {productTypes.map((type) => {
              const isSelected = localFilters.types.includes(type.value);
              return (
                <TouchableOpacity
                  key={type.value}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => toggleType(type.value)}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{type.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Brands */}
        {availableBrands.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{i18n.t('brand')}</Text>
            <View style={styles.chips}>
              {availableBrands.slice(0, 10).map((brand) => {
                const isSelected = localFilters.brands.includes(brand);
                return (
                  <TouchableOpacity
                    key={brand}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => toggleBrand(brand)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{brand}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Toggles */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => setLocalFilters((prev) => ({ ...prev, inStockOnly: !prev.inStockOnly }))}
          >
            <Text style={styles.toggleLabel}>{i18n.t('in_stock_only')}</Text>
            <View style={[styles.toggle, localFilters.inStockOnly && styles.toggleActive]}>
              {localFilters.inStockOnly && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => setLocalFilters((prev) => ({ ...prev, recommendedOnly: !prev.recommendedOnly }))}
          >
            <Text style={styles.toggleLabel}>{i18n.t('recommended_only')}</Text>
            <View style={[styles.toggle, localFilters.recommendedOnly && styles.toggleActive]}>
              {localFilters.recommendedOnly && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <ModernButton title={i18n.t('reset')} onPress={handleReset} variant="outline" style={styles.resetButton} />
        <ModernButton title={i18n.t('apply')} onPress={handleApply} style={styles.applyButton} />
      </View>
    </Modal>
  );
};


const styles = StyleSheet.create({
  content: { maxHeight: 400 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: DesignTokens.colors.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: DesignTokens.colors.surface, borderWidth: 1, borderColor: DesignTokens.colors.glassBorder },
  chipSelected: { backgroundColor: `${DesignTokens.colors.primary}20`, borderColor: DesignTokens.colors.primary },
  chipText: { fontSize: 14, fontWeight: '600', color: DesignTokens.colors.textSecondary },
  chipTextSelected: { color: DesignTokens.colors.primary },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: DesignTokens.colors.glassBorder },
  toggleLabel: { fontSize: 16, color: DesignTokens.colors.textPrimary },
  toggle: { width: 28, height: 28, borderRadius: 14, backgroundColor: DesignTokens.colors.surface, borderWidth: 1, borderColor: DesignTokens.colors.glassBorder, justifyContent: 'center', alignItems: 'center' },
  toggleActive: { backgroundColor: DesignTokens.colors.primary, borderColor: DesignTokens.colors.primary },
  footer: { flexDirection: 'row', gap: 12, marginTop: 16 },
  resetButton: { flex: 1 },
  applyButton: { flex: 2 },
});
