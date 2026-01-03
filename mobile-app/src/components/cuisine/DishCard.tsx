import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface DishCardProps {
  dish: {
    id: string;
    name_sr: string;
    name_en: string;
    description_sr?: string;
    calories_per_100g: number;
    protein_per_100g: number;
    carbs_per_100g: number;
    fat_per_100g: number;
    typical_serving_size?: number;
    is_popular: boolean;
    image_url?: string;
  };
  onPress?: () => void;
  language?: string;
}

export function DishCard({ dish, onPress, language = 'sr' }: DishCardProps) {
  const displayName = language === 'sr' ? dish.name_sr : dish.name_en;
  const servingSize = dish.typical_serving_size || 100;
  const servingCalories = (dish.calories_per_100g * servingSize) / 100;
  const servingProtein = (dish.protein_per_100g * servingSize) / 100;

  return (
    <TouchableOpacity onPress={onPress} style={styles.container} activeOpacity={0.7}>
      <LinearGradient
        colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
        style={styles.gradient}
      >
        {dish.image_url && (
          <Image source={{ uri: dish.image_url }} style={styles.image} />
        )}
        
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.name}>{displayName}</Text>
            {dish.is_popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>⭐</Text>
              </View>
            )}
          </View>

          {dish.description_sr && (
            <Text style={styles.description} numberOfLines={2}>
              {language === 'sr' ? dish.description_sr : dish.description_sr}
            </Text>
          )}

          <View style={styles.macros}>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{servingCalories.toFixed(0)}</Text>
              <Text style={styles.macroLabel}>kcal</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{servingProtein.toFixed(1)}g</Text>
              <Text style={styles.macroLabel}>protein</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{((dish.carbs_per_100g * servingSize) / 100).toFixed(1)}g</Text>
              <Text style={styles.macroLabel}>carbs</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{((dish.fat_per_100g * servingSize) / 100).toFixed(1)}g</Text>
              <Text style={styles.macroLabel}>fat</Text>
            </View>
          </View>

          <Text style={styles.serving}>
            {language === 'sr' ? 'Porcija' : 'Serving'}: {servingSize}g
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  image: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  popularBadge: {
    backgroundColor: 'rgba(255,215,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  popularText: {
    fontSize: 14,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 12,
    lineHeight: 20,
  },
  macros: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  macroLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  serving: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
});
