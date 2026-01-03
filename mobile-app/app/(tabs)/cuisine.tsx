import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { DishCard } from '@/src/components/cuisine/DishCard';
import { useLanguageStore } from '@/src/store/language';

interface SerbianDish {
  id: string;
  name_sr: string;
  name_en: string;
  description_sr?: string;
  description_en?: string;
  category: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  typical_serving_size?: number;
  is_popular: boolean;
  image_url?: string;
}

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export default function CuisineScreen() {
  const { language } = useLanguageStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { data: dishes, isLoading } = useQuery<SerbianDish[]>({
    queryKey: ['serbian-dishes', language],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/serbian-cuisine/dishes?language=${language}`);
      if (!response.ok) throw new Error('Failed to fetch dishes');
      return response.json();
    },
  });

  const categories = [
    { id: 'all', label: language === 'sr' ? 'Sve' : 'All' },
    { id: 'main', label: language === 'sr' ? 'Glavna jela' : 'Main dishes' },
    { id: 'appetizer', label: language === 'sr' ? 'Predjela' : 'Appetizers' },
    { id: 'side', label: language === 'sr' ? 'Prilozi' : 'Sides' },
    { id: 'dessert', label: language === 'sr' ? 'Deserti' : 'Desserts' },
  ];

  const filteredDishes = dishes?.filter(
    dish => selectedCategory === 'all' || dish.category === selectedCategory
  );

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {language === 'sr' ? '🇷🇸 Srpska Kuhinja' : '🇷🇸 Serbian Cuisine'}
          </Text>
          <Text style={styles.subtitle}>
            {language === 'sr'
              ? 'Tradicionalna jela prilagođena vašim ciljevima'
              : 'Traditional dishes adapted to your goals'}
          </Text>
        </View>

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map(category => (
            <TouchableOpacity
              key={category.id}
              onPress={() => setSelectedCategory(category.id)}
              style={[
                styles.categoryButton,
                selectedCategory === category.id && styles.categoryButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.categoryTextActive,
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Dishes List */}
        <View style={styles.dishesContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>
                {language === 'sr' ? 'Učitavanje...' : 'Loading...'}
              </Text>
            </View>
          ) : filteredDishes && filteredDishes.length > 0 ? (
            filteredDishes.map(dish => (
              <DishCard
                key={dish.id}
                dish={dish}
                language={language}
                onPress={() => {
                  // Navigate to dish detail
                  console.log('View dish:', dish.id);
                }}
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {language === 'sr' ? 'Nema jela u ovoj kategoriji' : 'No dishes in this category'}
              </Text>
            </View>
          )}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            {language === 'sr' ? '💡 Saveti' : '💡 Tips'}
          </Text>
          <Text style={styles.infoText}>
            {language === 'sr'
              ? 'Sva jela su prilagođena vašim makro ciljevima. Veličine porcija su preporučene na osnovu vašeg profila.'
              : 'All dishes are adapted to your macro goals. Serving sizes are recommended based on your profile.'}
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  categoryButtonActive: {
    backgroundColor: 'rgba(14,165,233,0.3)',
    borderColor: '#0ea5e9',
  },
  categoryText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  dishesContainer: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
  },
  infoCard: {
    margin: 20,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(14,165,233,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(14,165,233,0.3)',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
  },
});
