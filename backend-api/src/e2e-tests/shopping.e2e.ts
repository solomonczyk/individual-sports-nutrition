import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Shopping & Products
 * 
 * Tests shopping list and product interaction:
 * - Browse products
 * - Search by barcode
 * - Add to shopping list
 * - Manage quantities
 * - View prices from stores
 * - Compare nutrition info
 * - Checkout
 */

test.describe('Shopping & Products', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'ValidPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
  });

  test('should display product list', async ({ page }) => {
    await page.goto('/shopping/products');
    
    // Should show products
    const productList = page.locator('[data-testid="product-list"]');
    await expect(productList).toBeVisible({ timeout: 10000 });
    
    // Each product should have required info
    const productCards = page.locator('[data-testid="product-card"]');
    expect(await productCards.count()).toBeGreaterThan(0);
    
    // Check product details
    const firstProduct = productCards.first();
    await expect(firstProduct.locator('[data-testid="product-name"]')).toBeVisible();
    await expect(firstProduct.locator('[data-testid="product-calories"]')).toBeVisible();
  });

  test('should search products by name', async ({ page }) => {
    await page.goto('/shopping/products');
    
    // Use search
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('apple');
    
    // Wait for results
    await page.waitForTimeout(500);
    
    // Results should filter
    const productCards = page.locator('[data-testid="product-card"]');
    expect(await productCards.count()).toBeGreaterThan(0);
    
    // Verify results contain search term
    const firstProduct = productCards.first();
    const productText = await firstProduct.textContent();
    expect(productText?.toLowerCase()).toContain('apple');
  });

  test('should search products by barcode', async ({ page }) => {
    await page.goto('/shopping/products');
    
    // Find barcode search option
    const barcodeButton = page.locator('button:has-text("Barcode")');
    await barcodeButton.click();
    
    // Should show camera or input for barcode
    const barcodeInput = page.locator('input[placeholder*="Barcode"]');
    await expect(barcodeInput).toBeVisible({ timeout: 5000 });
    
    // Enter a test barcode
    await barcodeInput.fill('1234567890123');
    
    // Should search for product
    const searchButton = page.locator('button:has-text("Search")');
    await searchButton.click();
    
    // Wait for results
    await page.waitForTimeout(1000);
  });

  test('should filter products by category', async ({ page }) => {
    await page.goto('/shopping/products');
    
    // Open filter
    const filterButton = page.locator('button:has-text("Filter")');
    await filterButton.click();
    
    // Select category
    const categorySelect = page.locator('select[name="category"]');
    await categorySelect.selectOption('vegetables');
    
    // Apply filter
    const applyButton = page.locator('button:has-text("Apply")');
    await applyButton.click();
    
    // Results should be vegetables only
    const productCards = page.locator('[data-testid="product-card"]');
    const firstProduct = productCards.first();
    const productText = await firstProduct.textContent();
    expect(productText?.toLowerCase()).toMatch(/vegetable|carrot|lettuce|tomato/);
  });

  test('should show product nutrition details', async ({ page }) => {
    await page.goto('/shopping/products');
    
    // Click on product to view details
    const productCard = page.locator('[data-testid="product-card"]').first();
    await productCard.click();
    
    // Should show nutrition details page
    const nutritionSection = page.locator('[data-testid="nutrition-section"]');
    await expect(nutritionSection).toBeVisible({ timeout: 5000 });
    
    // Check nutrition values
    const calories = page.locator('[data-testid="calories"]');
    const protein = page.locator('[data-testid="protein"]');
    const carbs = page.locator('[data-testid="carbs"]');
    const fat = page.locator('[data-testid="fat"]');
    
    await expect(calories).toBeVisible();
    await expect(protein).toBeVisible();
    await expect(carbs).toBeVisible();
    await expect(fat).toBeVisible();
  });

  test('should add product to shopping list', async ({ page }) => {
    await page.goto('/shopping/products');
    
    // Click on product
    const productCard = page.locator('[data-testid="product-card"]').first();
    const productName = await productCard.locator('[data-testid="product-name"]').textContent();
    
    await productCard.click();
    
    // Add to shopping list
    const addButton = page.locator('button:has-text("Add to List")');
    await addButton.click();
    
    // Should show success
    const successMessage = page.locator('text=/added|success/i');
    await expect(successMessage).toBeVisible({ timeout: 5000 });
    
    // Navigate to shopping list
    await page.goto('/shopping/list');
    
    // Product should be in list
    const itemInList = page.locator(`text="${productName}"`);
    await expect(itemInList).toBeVisible();
  });

  test('should adjust product quantity in shopping list', async ({ page }) => {
    await page.goto('/shopping/products');
    
    // Add product first
    const productCard = page.locator('[data-testid="product-card"]').first();
    await productCard.click();
    const addButton = page.locator('button:has-text("Add to List")');
    await addButton.click();
    
    // Go to shopping list
    await page.goto('/shopping/list');
    
    // Find product and adjust quantity
    const listItem = page.locator('[data-testid="list-item"]').first();
    const quantityInput = listItem.locator('input[name="quantity"]');
    
    // Change quantity
    await quantityInput.fill('5');
    await quantityInput.press('Enter');
    
    // Verify change
    await expect(quantityInput).toHaveValue('5');
  });

  test('should remove product from shopping list', async ({ page }) => {
    await page.goto('/shopping/list');
    
    // Find product and remove
    const listItem = page.locator('[data-testid="list-item"]').first();
    const productName = await listItem.textContent();
    
    const removeButton = listItem.locator('button:has-text("Remove")');
    await removeButton.click();
    
    // Confirm if needed
    const confirmButton = page.locator('button:has-text("Confirm")');
    if (await confirmButton.count() > 0) {
      await confirmButton.click();
    }
    
    // Product should be removed
    const removedItem = page.locator(`text="${productName}"`);
    await expect(removedItem).not.toBeVisible({ timeout: 5000 });
  });

  test('should show available stores and prices', async ({ page }) => {
    await page.goto('/shopping/products');
    
    // Click on product
    const productCard = page.locator('[data-testid="product-card"]').first();
    await productCard.click();
    
    // Find where to buy section
    const whereToBuy = page.locator('[data-testid="where-to-buy"]');
    await expect(whereToBuy).toBeVisible({ timeout: 5000 });
    
    // Should show store locations
    const storeList = whereToBuy.locator('[data-testid="store-item"]');
    expect(await storeList.count()).toBeGreaterThan(0);
    
    // Each store should have name, price, distance
    const firstStore = storeList.first();
    await expect(firstStore.locator('[data-testid="store-name"]')).toBeVisible();
    await expect(firstStore.locator('[data-testid="store-price"]')).toBeVisible();
    await expect(firstStore.locator('[data-testid="store-distance"]')).toBeVisible();
  });

  test('should compare prices across stores', async ({ page }) => {
    await page.goto('/shopping/products');
    
    // Open first product
    const productCard = page.locator('[data-testid="product-card"]').first();
    await productCard.click();
    
    // Get store list
    const storeList = page.locator('[data-testid="store-item"]');
    const count = await storeList.count();
    
    if (count >= 2) {
      // Get prices
      const firstStorePrice = parseInt(
        (await storeList.nth(0).locator('[data-testid="store-price"]').textContent()) || '0'
      );
      const secondStorePrice = parseInt(
        (await storeList.nth(1).locator('[data-testid="store-price"]').textContent()) || '0'
      );
      
      // Prices should be different
      expect(firstStorePrice).not.toBe(secondStorePrice);
    }
  });

  test('should calculate shopping list total price', async ({ page }) => {
    await page.goto('/shopping/list');
    
    // Should show total
    const totalPrice = page.locator('[data-testid="total-price"]');
    await expect(totalPrice).toBeVisible();
    
    // Get total value
    const totalText = await totalPrice.textContent();
    const total = parseFloat(totalText || '0');
    
    expect(total).toBeGreaterThanOrEqual(0);
  });

  test('should optimize shopping list by price', async ({ page }) => {
    await page.goto('/shopping/list');
    
    // Click optimize button
    const optimizeButton = page.locator('button:has-text("Optimize")');
    if (await optimizeButton.count() > 0) {
      await optimizeButton.click();
      
      // Should show recommendations
      const recommendations = page.locator('[data-testid="optimization-result"]');
      await expect(recommendations).toBeVisible({ timeout: 5000 });
      
      // Should show suggested stores or alternatives
      const alternatives = page.locator('[data-testid="alternative-product"]');
      expect(await alternatives.count()).toBeGreaterThan(0);
    }
  });

  test('should checkout from shopping list', async ({ page }) => {
    await page.goto('/shopping/list');
    
    // Make sure there are items
    const items = page.locator('[data-testid="list-item"]');
    if (await items.count() === 0) {
      // Add a product first
      await page.goto('/shopping/products');
      const productCard = page.locator('[data-testid="product-card"]').first();
      await productCard.click();
      const addButton = page.locator('button:has-text("Add to List")');
      await addButton.click();
      await page.goto('/shopping/list');
    }
    
    // Click checkout
    const checkoutButton = page.locator('button:has-text("Checkout")');
    await checkoutButton.click();
    
    // Should go to payment/summary page
    await page.waitForNavigation();
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/checkout|payment|summary/i);
  });

  test('should filter products by allergens', async ({ page }) => {
    await page.goto('/shopping/products');
    
    // Open filter
    const filterButton = page.locator('button:has-text("Filter")');
    await filterButton.click();
    
    // Select allergen to exclude
    const allergenCheckbox = page.locator('input[name="excludeAllergens"][value="peanut"]');
    await allergenCheckbox.check();
    
    const applyButton = page.locator('button:has-text("Apply")');
    await applyButton.click();
    
    // Products should not contain peanuts
    const productCards = page.locator('[data-testid="product-card"]');
    const firstProduct = productCards.first();
    const allergensText = await firstProduct.locator('[data-testid="allergens"]').textContent();
    
    expect(allergensText?.toLowerCase()).not.toContain('peanut');
  });
});
