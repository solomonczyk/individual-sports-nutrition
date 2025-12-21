import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Meal Planning Flow
 * 
 * Tests meal planning user journey:
 * - View meal recommendations
 * - Search for meals
 * - Filter by calories/macros
 * - Add meals to plan
 * - View nutrition tracking
 * - Generate meal plans
 */

test.describe('Meal Planning & Nutrition', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'ValidPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
  });

  test('should display meal recommendations', async ({ page }) => {
    await page.goto('/meals');
    
    // Should show list of meals
    const mealList = page.locator('[data-testid="meal-list"]');
    await expect(mealList).toBeVisible({ timeout: 10000 });
    
    // Each meal should have required elements
    const mealCards = page.locator('[data-testid="meal-card"]');
    expect(await mealCards.count()).toBeGreaterThan(0);
    
    // Check first meal has name and calories
    const firstMeal = mealCards.first();
    const mealName = firstMeal.locator('[data-testid="meal-name"]');
    const calories = firstMeal.locator('[data-testid="calories"]');
    
    await expect(mealName).toBeVisible();
    await expect(calories).toBeVisible();
  });

  test('should search for meals by name', async ({ page }) => {
    await page.goto('/meals');
    
    // Use search input
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('chicken');
    
    // Wait for search results
    await page.waitForTimeout(500);
    
    // Results should filter
    const mealCards = page.locator('[data-testid="meal-card"]');
    const count = await mealCards.count();
    
    // At least one result for "chicken"
    expect(count).toBeGreaterThan(0);
    
    // Verify results contain "chicken"
    const firstMeal = mealCards.first();
    const mealText = await firstMeal.textContent();
    expect(mealText?.toLowerCase()).toContain('chicken');
  });

  test('should filter meals by calorie range', async ({ page }) => {
    await page.goto('/meals');
    
    // Open filter menu
    const filterButton = page.locator('button:has-text("Filter")');
    await filterButton.click();
    
    // Set calorie range (200-400)
    const minCalories = page.locator('input[name="minCalories"]');
    const maxCalories = page.locator('input[name="maxCalories"]');
    
    await minCalories.fill('200');
    await maxCalories.fill('400');
    
    // Apply filter
    const applyButton = page.locator('button:has-text("Apply")');
    await applyButton.click();
    
    // Verify results are within range
    const mealCards = page.locator('[data-testid="meal-card"]');
    const firstMeal = mealCards.first();
    const calorieText = await firstMeal.locator('[data-testid="calories"]').textContent();
    const calories = parseInt(calorieText || '0');
    
    expect(calories).toBeGreaterThanOrEqual(200);
    expect(calories).toBeLessThanOrEqual(400);
  });

  test('should filter meals by macro nutrients', async ({ page }) => {
    await page.goto('/meals');
    
    // Open filter
    const filterButton = page.locator('button:has-text("Filter")');
    await filterButton.click();
    
    // Filter by high protein (>20g)
    const proteinInput = page.locator('input[name="minProtein"]');
    await proteinInput.fill('20');
    
    const applyButton = page.locator('button:has-text("Apply")');
    await applyButton.click();
    
    // Verify protein content
    const mealCards = page.locator('[data-testid="meal-card"]');
    const firstMeal = mealCards.first();
    const proteinText = await firstMeal.locator('[data-testid="protein"]').textContent();
    const protein = parseInt(proteinText || '0');
    
    expect(protein).toBeGreaterThanOrEqual(20);
  });

  test('should filter by dietary restrictions', async ({ page }) => {
    await page.goto('/meals');
    
    // Open filter
    const filterButton = page.locator('button:has-text("Filter")');
    await filterButton.click();
    
    // Select vegetarian
    const vegetarianCheckbox = page.locator('input[name="vegetarian"]');
    await vegetarianCheckbox.check();
    
    const applyButton = page.locator('button:has-text("Apply")');
    await applyButton.click();
    
    // All results should be vegetarian
    const mealCards = page.locator('[data-testid="meal-card"]');
    const count = await mealCards.count();
    expect(count).toBeGreaterThan(0);
    
    // Check for vegetarian badge
    const vegetarianBadges = page.locator('[data-testid="vegetarian-badge"]');
    expect(await vegetarianBadges.count()).toBeGreaterThan(0);
  });

  test('should add meal to plan', async ({ page }) => {
    await page.goto('/meals');
    
    // Find a meal and click add to plan
    const mealCard = page.locator('[data-testid="meal-card"]').first();
    const addButton = mealCard.locator('button:has-text("Add")');
    
    await addButton.click();
    
    // Should show portion selection modal or input
    const portionInput = page.locator('input[name="portion"]');
    await expect(portionInput).toBeVisible({ timeout: 5000 });
    
    // Set portion
    await portionInput.fill('100');
    
    // Confirm add
    const confirmButton = page.locator('button:has-text("Confirm")');
    await confirmButton.click();
    
    // Should show success message
    const successMessage = page.locator('text=/added|success/i');
    await expect(successMessage).toBeVisible({ timeout: 5000 });
  });

  test('should view daily nutrition summary', async ({ page }) => {
    await page.goto('/meals');
    
    // Add a meal
    const mealCard = page.locator('[data-testid="meal-card"]').first();
    const mealName = await mealCard.locator('[data-testid="meal-name"]').textContent();
    const mealCalories = parseInt(
      (await mealCard.locator('[data-testid="calories"]').textContent()) || '0'
    );
    
    const addButton = mealCard.locator('button:has-text("Add")');
    await addButton.click();
    
    const portionInput = page.locator('input[name="portion"]');
    await portionInput.fill('100');
    
    const confirmButton = page.locator('button:has-text("Confirm")');
    await confirmButton.click();
    
    // Navigate to summary/plan page
    await page.goto('/meal-plan');
    
    // Should show daily nutrition
    const summaryCard = page.locator('[data-testid="nutrition-summary"]');
    await expect(summaryCard).toBeVisible({ timeout: 5000 });
    
    // Should show the added meal
    const mealInPlan = page.locator(`text="${mealName}"`);
    await expect(mealInPlan).toBeVisible();
  });

  test('should track nutrition progress', async ({ page }) => {
    await page.goto('/meal-plan');
    
    // Check nutrition progress bars
    const calorieProgress = page.locator('[data-testid="calorie-progress"]');
    const proteinProgress = page.locator('[data-testid="protein-progress"]');
    const carbProgress = page.locator('[data-testid="carb-progress"]');
    const fatProgress = page.locator('[data-testid="fat-progress"]');
    
    await expect(calorieProgress).toBeVisible();
    await expect(proteinProgress).toBeVisible();
    await expect(carbProgress).toBeVisible();
    await expect(fatProgress).toBeVisible();
    
    // Check goal vs consumed
    const goalCalories = page.locator('[data-testid="goal-calories"]');
    const consumedCalories = page.locator('[data-testid="consumed-calories"]');
    
    await expect(goalCalories).toBeVisible();
    await expect(consumedCalories).toBeVisible();
  });

  test('should remove meal from plan', async ({ page }) => {
    await page.goto('/meal-plan');
    
    // Find meal and remove it
    const mealItem = page.locator('[data-testid="meal-item"]').first();
    const removeButton = mealItem.locator('button:has-text("Remove")');
    
    // Get meal name before removing
    const mealName = await mealItem.textContent();
    
    await removeButton.click();
    
    // Confirm removal if modal appears
    const confirmButton = page.locator('button:has-text("Confirm")');
    const count = await confirmButton.count();
    if (count > 0) {
      await confirmButton.click();
    }
    
    // Meal should be removed
    const removedMeal = page.locator(`text="${mealName}"`);
    await expect(removedMeal).not.toBeVisible({ timeout: 5000 });
  });

  test('should generate AI meal plan', async ({ page }) => {
    await page.goto('/meal-plan');
    
    // Click generate plan button
    const generateButton = page.locator('button:has-text("Generate Plan")');
    await generateButton.click();
    
    // Should show loading
    const loader = page.locator('[data-testid="loader"]');
    await expect(loader).toBeVisible({ timeout: 10000 });
    
    // Wait for plan to generate (AI service)
    await page.waitForTimeout(3000);
    
    // Should show generated meals
    const mealCards = page.locator('[data-testid="meal-card"]');
    expect(await mealCards.count()).toBeGreaterThan(0);
    
    // Each meal should have nutrition info
    const firstMeal = mealCards.first();
    await expect(firstMeal.locator('[data-testid="calories"]')).toBeVisible();
  });

  test('should show weekly meal plan view', async ({ page }) => {
    await page.goto('/meal-plan?view=weekly');
    
    // Should show 7 days
    const dayLabels = page.locator('[data-testid="day-label"]');
    expect(await dayLabels.count()).toBe(7);
    
    // Each day should have sections for breakfast, lunch, dinner
    const firstDay = page.locator('[data-testid="day-plan"]').first();
    const breakfast = firstDay.locator('[data-testid="breakfast"]');
    const lunch = firstDay.locator('[data-testid="lunch"]');
    const dinner = firstDay.locator('[data-testid="dinner"]');
    
    await expect(breakfast).toBeVisible();
    await expect(lunch).toBeVisible();
    await expect(dinner).toBeVisible();
  });

  test('should export meal plan', async ({ page }) => {
    await page.goto('/meal-plan');
    
    // Click export button
    const exportButton = page.locator('button:has-text("Export")');
    await exportButton.click();
    
    // Should show export options (PDF, CSV, etc)
    const pdfOption = page.locator('text=/PDF|pdf/');
    const csvOption = page.locator('text=/CSV|csv/');
    
    await expect(pdfOption).toBeVisible({ timeout: 5000 });
    await expect(csvOption).toBeVisible({ timeout: 5000 });
  });
});
