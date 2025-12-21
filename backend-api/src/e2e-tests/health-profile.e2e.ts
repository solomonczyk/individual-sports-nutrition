import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Health Profile Setup Flow
 * 
 * Tests user health profile creation journey:
 * - Age, height, weight validation
 * - Activity level selection
 * - Goal selection
 * - Dietary restrictions
 * - Allergen management
 * - Nutritional goals calculation
 */

test.describe('Health Profile Setup', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'ValidPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
  });

  test('should display health profile setup page', async ({ page }) => {
    await page.goto('/health-profile');
    
    await expect(page).toHaveTitle(/Health|Profile/i);
    await expect(page.locator('input[name="age"]')).toBeVisible();
    await expect(page.locator('input[name="height"]')).toBeVisible();
    await expect(page.locator('input[name="weight"]')).toBeVisible();
  });

  test('should validate age range (18-120)', async ({ page }) => {
    await page.goto('/health-profile');
    
    // Try age too young
    await page.fill('input[name="age"]', '15');
    await page.click('button[type="submit"]');
    
    let errorMessage = page.locator('text=/age.*18|minimum age/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    
    // Try age too old
    await page.fill('input[name="age"]', '150');
    await page.click('button[type="submit"]');
    
    errorMessage = page.locator('text=/age.*120|maximum age/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    
    // Valid age
    await page.fill('input[name="age"]', '30');
    const error = page.locator('text=/age.*error/i');
    await expect(error).not.toBeVisible();
  });

  test('should validate height (cm)', async ({ page }) => {
    await page.goto('/health-profile');
    
    // Try height too short
    await page.fill('input[name="height"]', '50');
    await page.click('button[type="submit"]');
    
    let errorMessage = page.locator('text=/height|unrealistic/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    
    // Try height too tall
    await page.fill('input[name="height"]', '300');
    await page.click('button[type="submit"]');
    
    errorMessage = page.locator('text=/height|unrealistic/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    
    // Valid height
    await page.fill('input[name="height"]', '175');
    const error = page.locator('text=/height.*error/i');
    await expect(error).not.toBeVisible();
  });

  test('should validate weight (kg)', async ({ page }) => {
    await page.goto('/health-profile');
    
    // Fill valid age and height first
    await page.fill('input[name="age"]', '30');
    await page.fill('input[name="height"]', '175');
    
    // Try weight too light
    await page.fill('input[name="weight"]', '20');
    await page.click('button[type="submit"]');
    
    let errorMessage = page.locator('text=/weight|unrealistic/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    
    // Try weight too heavy
    await page.fill('input[name="weight"]', '500');
    await page.click('button[type="submit"]');
    
    errorMessage = page.locator('text=/weight|unrealistic/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    
    // Valid weight
    await page.fill('input[name="weight"]', '75');
    const error = page.locator('text=/weight.*error/i');
    await expect(error).not.toBeVisible();
  });

  test('should select gender and activity level', async ({ page }) => {
    await page.goto('/health-profile');
    
    // Fill basic info
    await page.fill('input[name="age"]', '30');
    await page.fill('input[name="height"]', '175');
    await page.fill('input[name="weight"]', '75');
    
    // Select gender (radio or select)
    const maleOption = page.locator('input[name="gender"][value="male"]');
    await maleOption.check();
    await expect(maleOption).toBeChecked();
    
    // Select activity level
    const activitySelect = page.locator('select[name="activity"]');
    await activitySelect.selectOption('moderate');
    
    // Verify selection
    await expect(activitySelect).toHaveValue('moderate');
  });

  test('should select fitness goal', async ({ page }) => {
    await page.goto('/health-profile');
    
    // Fill basic info
    await page.fill('input[name="age"]', '30');
    await page.fill('input[name="height"]', '175');
    await page.fill('input[name="weight"]', '75');
    await page.locator('input[name="gender"][value="male"]').check();
    
    // Select goal
    const goalSelect = page.locator('select[name="goal"]');
    const options = ['maintain', 'lose_weight', 'gain_muscle'];
    
    for (const option of options) {
      await goalSelect.selectOption(option);
      await expect(goalSelect).toHaveValue(option);
    }
  });

  test('should handle dietary restrictions', async ({ page }) => {
    await page.goto('/health-profile');
    
    // Fill basic info
    await page.fill('input[name="age"]', '30');
    await page.fill('input[name="height"]', '175');
    await page.fill('input[name="weight"]', '75');
    
    // Select dietary restrictions (checkboxes)
    const vegetarian = page.locator('input[name="dietary"][value="vegetarian"]');
    const vegan = page.locator('input[name="dietary"][value="vegan"]');
    
    // Check vegetarian
    await vegetarian.check();
    await expect(vegetarian).toBeChecked();
    
    // Uncheck and check vegan
    await vegetarian.uncheck();
    await vegan.check();
    await expect(vegan).toBeChecked();
    await expect(vegetarian).not.toBeChecked();
  });

  test('should manage allergens', async ({ page }) => {
    await page.goto('/health-profile');
    
    // Fill basic info
    await page.fill('input[name="age"]', '30');
    await page.fill('input[name="height"]', '175');
    await page.fill('input[name="weight"]', '75');
    
    // Add allergens
    const allergenInput = page.locator('input[placeholder="Search allergens"]');
    await allergenInput.fill('peanut');
    
    // Wait for autocomplete suggestions
    const suggestion = page.locator('li:has-text("Peanut")');
    await expect(suggestion).toBeVisible({ timeout: 5000 });
    await suggestion.click();
    
    // Verify allergen was added
    const allergenTag = page.locator('[data-testid="allergen-tag"]:has-text("Peanut")');
    await expect(allergenTag).toBeVisible();
    
    // Should be able to remove allergen
    const removeButton = allergenTag.locator('button');
    await removeButton.click();
    await expect(allergenTag).not.toBeVisible();
  });

  test('should calculate and display nutritional goals', async ({ page }) => {
    await page.goto('/health-profile');
    
    // Fill health profile
    await page.fill('input[name="age"]', '30');
    await page.fill('input[name="height"]', '175');
    await page.fill('input[name="weight"]', '75');
    await page.locator('input[name="gender"][value="male"]').check();
    await page.locator('select[name="activity"]').selectOption('moderate');
    await page.locator('select[name="goal"]').selectOption('maintain');
    
    // Should show calculated values
    const calorieGoal = page.locator('[data-testid="calorie-goal"]');
    const proteinGoal = page.locator('[data-testid="protein-goal"]');
    const carbGoal = page.locator('[data-testid="carb-goal"]');
    const fatGoal = page.locator('[data-testid="fat-goal"]');
    
    await expect(calorieGoal).toBeVisible();
    await expect(proteinGoal).toBeVisible();
    await expect(carbGoal).toBeVisible();
    await expect(fatGoal).toBeVisible();
    
    // Values should be reasonable (BMR: ~1800-2500 for this profile)
    const calorieText = await calorieGoal.textContent();
    expect(parseInt(calorieText || '0')).toBeGreaterThan(1500);
    expect(parseInt(calorieText || '0')).toBeLessThan(3500);
  });

  test('should successfully save health profile', async ({ page }) => {
    await page.goto('/health-profile');
    
    // Fill complete profile
    await page.fill('input[name="age"]', '28');
    await page.fill('input[name="height"]', '178');
    await page.fill('input[name="weight"]', '78');
    await page.locator('input[name="gender"][value="male"]').check();
    await page.locator('select[name="activity"]').selectOption('very_active');
    await page.locator('select[name="goal"]').selectOption('gain_muscle');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Should show success message
    const successMessage = page.locator('text=/saved|success|profile updated/i');
    await expect(successMessage).toBeVisible({ timeout: 5000 });
    
    // Should redirect or stay on profile page
    const currentUrl = page.url();
    expect(currentUrl).toContain('/health-profile');
  });

  test('should pre-fill existing health data on return', async ({ page }) => {
    // First visit - save profile
    await page.goto('/health-profile');
    await page.fill('input[name="age"]', '28');
    await page.fill('input[name="height"]', '178');
    await page.fill('input[name="weight"]', '78');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    // Navigate away and back
    await page.goto('/home');
    await page.goto('/health-profile');
    
    // Data should be pre-filled
    await expect(page.locator('input[name="age"]')).toHaveValue('28');
    await expect(page.locator('input[name="height"]')).toHaveValue('178');
    await expect(page.locator('input[name="weight"]')).toHaveValue('78');
  });
});
