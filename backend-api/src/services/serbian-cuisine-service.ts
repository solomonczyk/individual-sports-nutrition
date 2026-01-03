import { pool } from '../config/database';

export interface SerbianDish {
  id: string;
  name: string;
  name_sr: string;
  name_en: string;
  description?: string;
  description_sr?: string;
  description_en?: string;
  category: 'main' | 'appetizer' | 'dessert' | 'snack' | 'side';
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g?: number;
  typical_serving_size?: number;
  is_popular: boolean;
  image_url?: string;
  ingredients?: DishIngredient[];
}

export interface DishIngredient {
  ingredient_name: string;
  ingredient_name_sr: string;
  is_allergen: boolean;
  allergen_type?: string;
}

export interface UserFoodPreferences {
  user_id: string;
  prefers_local_cuisine: boolean;
  favorite_dishes: string[];
  avoided_ingredients: string[];
  dietary_restrictions: string[];
}

export interface NutritionRecommendation {
  dish: SerbianDish;
  recommended_serving: number;
  fits_macros: boolean;
  reason: string;
  reason_sr: string;
}

export class SerbianCuisineService {
  // Get all Serbian dishes
  async getAllDishes(language: string = 'sr'): Promise<SerbianDish[]> {
    const result = await pool.query(`
      SELECT 
        d.*,
        COALESCE(
          json_agg(
            json_build_object(
              'ingredient_name', i.ingredient_name,
              'ingredient_name_sr', i.ingredient_name_sr,
              'is_allergen', i.is_allergen,
              'allergen_type', i.allergen_type
            )
          ) FILTER (WHERE i.id IS NOT NULL),
          '[]'
        ) as ingredients
      FROM serbian_dishes d
      LEFT JOIN serbian_dish_ingredients i ON d.id = i.dish_id
      GROUP BY d.id
      ORDER BY d.is_popular DESC, d.name
    `);

    return result.rows;
  }

  // Get popular dishes
  async getPopularDishes(limit: number = 10): Promise<SerbianDish[]> {
    const result = await pool.query(`
      SELECT 
        d.*,
        COALESCE(
          json_agg(
            json_build_object(
              'ingredient_name', i.ingredient_name,
              'ingredient_name_sr', i.ingredient_name_sr,
              'is_allergen', i.is_allergen,
              'allergen_type', i.allergen_type
            )
          ) FILTER (WHERE i.id IS NOT NULL),
          '[]'
        ) as ingredients
      FROM serbian_dishes d
      LEFT JOIN serbian_dish_ingredients i ON d.id = i.dish_id
      WHERE d.is_popular = true
      GROUP BY d.id
      ORDER BY d.name
      LIMIT $1
    `, [limit]);

    return result.rows;
  }

  // Get dish by ID
  async getDishById(dishId: string): Promise<SerbianDish | null> {
    const result = await pool.query(`
      SELECT 
        d.*,
        COALESCE(
          json_agg(
            json_build_object(
              'ingredient_name', i.ingredient_name,
              'ingredient_name_sr', i.ingredient_name_sr,
              'is_allergen', i.is_allergen,
              'allergen_type', i.allergen_type
            )
          ) FILTER (WHERE i.id IS NOT NULL),
          '[]'
        ) as ingredients
      FROM serbian_dishes d
      LEFT JOIN serbian_dish_ingredients i ON d.id = i.dish_id
      WHERE d.id = $1
      GROUP BY d.id
    `, [dishId]);

    return result.rows[0] || null;
  }

  // Get user food preferences
  async getUserPreferences(userId: string): Promise<UserFoodPreferences | null> {
    const result = await pool.query(`
      SELECT * FROM user_food_preferences WHERE user_id = $1
    `, [userId]);

    return result.rows[0] || null;
  }

  // Update user food preferences
  async updateUserPreferences(
    userId: string,
    preferences: Partial<UserFoodPreferences>
  ): Promise<UserFoodPreferences> {
    const existing = await this.getUserPreferences(userId);

    if (existing) {
      const result = await pool.query(`
        UPDATE user_food_preferences
        SET 
          prefers_local_cuisine = COALESCE($2, prefers_local_cuisine),
          favorite_dishes = COALESCE($3, favorite_dishes),
          avoided_ingredients = COALESCE($4, avoided_ingredients),
          dietary_restrictions = COALESCE($5, dietary_restrictions),
          updated_at = NOW()
        WHERE user_id = $1
        RETURNING *
      `, [
        userId,
        preferences.prefers_local_cuisine,
        preferences.favorite_dishes,
        preferences.avoided_ingredients,
        preferences.dietary_restrictions,
      ]);

      return result.rows[0];
    } else {
      const result = await pool.query(`
        INSERT INTO user_food_preferences (
          user_id,
          prefers_local_cuisine,
          favorite_dishes,
          avoided_ingredients,
          dietary_restrictions
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
        userId,
        preferences.prefers_local_cuisine ?? true,
        preferences.favorite_dishes ?? [],
        preferences.avoided_ingredients ?? [],
        preferences.dietary_restrictions ?? [],
      ]);

      return result.rows[0];
    }
  }

  // Get dish recommendations based on user's nutrition goals
  async getRecommendationsForUser(
    userId: string,
    targetCalories: number,
    targetProtein: number,
    targetCarbs: number,
    targetFat: number
  ): Promise<NutritionRecommendation[]> {
    const preferences = await this.getUserPreferences(userId);
    const dishes = await this.getAllDishes();

    const recommendations: NutritionRecommendation[] = [];

    for (const dish of dishes) {
      // Skip if user avoids ingredients
      if (preferences?.avoided_ingredients.length) {
        const hasAvoidedIngredient = dish.ingredients?.some(ing =>
          preferences.avoided_ingredients.includes(ing.ingredient_name.toLowerCase())
        );
        if (hasAvoidedIngredient) continue;
      }

      // Calculate recommended serving size
      const servingSize = dish.typical_serving_size || 200;
      const servingCalories = (dish.calories_per_100g * servingSize) / 100;
      const servingProtein = (dish.protein_per_100g * servingSize) / 100;
      const servingCarbs = (dish.carbs_per_100g * servingSize) / 100;
      const servingFat = (dish.fat_per_100g * servingSize) / 100;

      // Check if fits macros (within 20% tolerance)
      const caloriesFit = servingCalories <= targetCalories * 0.4; // Max 40% of daily calories per meal
      const proteinFit = servingProtein >= targetProtein * 0.25; // At least 25% of daily protein
      const fitsMacros = caloriesFit && proteinFit;

      let reason = '';
      let reason_sr = '';

      if (fitsMacros) {
        reason = `Good protein source (${servingProtein.toFixed(1)}g per serving)`;
        reason_sr = `Dobar izvor proteina (${servingProtein.toFixed(1)}g po porciji)`;
      } else if (servingProtein < targetProtein * 0.25) {
        reason = `Low protein content, consider adding protein supplement`;
        reason_sr = `Nizak sadržaj proteina, razmislite o dodatku proteina`;
      } else {
        reason = `High calorie content, adjust portion size`;
        reason_sr = `Visok sadržaj kalorija, prilagodite veličinu porcije`;
      }

      recommendations.push({
        dish,
        recommended_serving: servingSize,
        fits_macros: fitsMacros,
        reason,
        reason_sr,
      });
    }

    // Sort by fitness to macros and popularity
    recommendations.sort((a, b) => {
      if (a.fits_macros && !b.fits_macros) return -1;
      if (!a.fits_macros && b.fits_macros) return 1;
      if (a.dish.is_popular && !b.dish.is_popular) return -1;
      if (!a.dish.is_popular && b.dish.is_popular) return 1;
      return 0;
    });

    return recommendations.slice(0, 10);
  }

  // Get local brands
  async getLocalBrands(): Promise<any[]> {
    const result = await pool.query(`
      SELECT 
        b.*,
        COUNT(p.id) as products_count
      FROM brands b
      LEFT JOIN products p ON b.id = p.brand_id
      WHERE b.is_local = true
      GROUP BY b.id
      ORDER BY b.name
    `);

    return result.rows;
  }

  // Mark brand as local
  async markBrandAsLocal(brandId: string, isLocal: boolean = true): Promise<void> {
    await pool.query(`
      UPDATE brands
      SET is_local = $2, country_code = 'RS'
      WHERE id = $1
    `, [brandId, isLocal]);
  }
}
