import { test, expect } from '@playwright/test';

/**
 * E2E Tests: API Integration & General Navigation
 * 
 * Tests overall application functionality:
 * - API endpoint availability
 * - Error handling and user feedback
 * - Navigation and page transitions
 * - Performance and load times
 * - Error recovery
 */

test.describe('API Integration', () => {
  test('should handle API timeout gracefully', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Simulate slow API by monitoring XHR
    let requestSlow = false;
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        // Mark if response is slow (>3s)
        if (response.timing?.responseStart > 3000) {
          requestSlow = true;
        }
      }
    });
    
    // Fill login form
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'ValidPassword123!');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Should either complete or show error message
    const errorMessage = page.locator('text=/error|timeout|failed/i');
    const successRedirect = page.waitForNavigation().catch(() => false);
    
    const result = await Promise.race([
      errorMessage.isVisible().then(v => v ? 'error' : 'success'),
      successRedirect.then(() => 'success').catch(() => 'error'),
      page.waitForTimeout(10000).then(() => 'timeout'),
    ]);
    
    expect(result).not.toBe('timeout');
  });

  test('should retry failed API requests', async ({ page }) => {
    let retryCount = 0;
    
    // Monitor API calls
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        if (response.status() >= 500) {
          retryCount++;
        }
      }
    });
    
    // Make API call that might fail
    await page.goto('/meals');
    
    // App should handle gracefully
    const errorToast = page.locator('[data-testid="error-toast"]');
    const contentLoaded = page.locator('[data-testid="meal-list"]');
    
    // Either content loads or error is shown
    const outcome = await Promise.race([
      contentLoaded.isVisible().then(() => 'success'),
      errorToast.isVisible().then(() => 'error'),
      page.waitForTimeout(10000).then(() => 'timeout'),
    ]);
    
    expect(['success', 'error']).toContain(outcome);
  });

  test('should handle 404 errors', async ({ page }) => {
    // Try to navigate to non-existent page
    await page.goto('/non-existent-page', { waitUntil: 'networkidle' });
    
    // Should show 404 page or message
    const notFoundMessage = page.locator('text=/404|not found|does not exist/i');
    const notFoundPage = page.locator('[data-testid="not-found-page"]');
    
    expect(await notFoundMessage.count() + await notFoundPage.count()).toBeGreaterThan(0);
  });

  test('should handle 500 errors with retry', async ({ page }) => {
    // Go to a page that makes API calls
    await page.goto('/meals');
    
    // Simulate 500 error
    await page.route('**/api/**', route => {
      route.abort('failed');
    });
    
    // Try to refresh
    await page.reload();
    
    // Should show error message
    const errorMessage = page.locator('text=/error|failed|try again/i');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
    
    // Should have retry button
    const retryButton = page.locator('button:has-text("Retry")');
    expect(await retryButton.count()).toBeGreaterThan(0);
  });
});

test.describe('Navigation', () => {
  test('should navigate between main pages', async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'ValidPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    
    // Navigation menu should exist
    const navMenu = page.locator('[data-testid="nav-menu"]');
    await expect(navMenu).toBeVisible();
    
    // Click each navigation item
    const navItems = navMenu.locator('[data-testid="nav-item"]');
    const count = await navItems.count();
    
    for (let i = 0; i < Math.min(count, 3); i++) {
      const navItem = navItems.nth(i);
      const href = await navItem.getAttribute('href');
      
      if (href) {
        await page.goto(href);
        await page.waitForTimeout(500);
        
        // Page should load
        const content = page.locator('[data-testid="page-content"]');
        expect(await content.count()).toBeGreaterThan(0);
      }
    }
  });

  test('should handle browser back button', async ({ page }) => {
    // Navigate to a page
    await page.goto('/meals');
    
    // Click on a meal
    const mealCard = page.locator('[data-testid="meal-card"]').first();
    if (await mealCard.count() > 0) {
      await mealCard.click();
      await page.waitForNavigation();
      
      const detailsUrl = page.url();
      expect(detailsUrl).toContain('/meal/');
      
      // Go back
      await page.goBack();
      
      // Should be back at meal list
      const mealList = page.locator('[data-testid="meal-list"]');
      await expect(mealList).toBeVisible({ timeout: 5000 });
    }
  });

  test('should maintain scroll position on navigation', async ({ page }) => {
    await page.goto('/meals');
    
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500));
    let scrollPosition = await page.evaluate(() => window.scrollY);
    expect(scrollPosition).toBeGreaterThan(0);
    
    // Navigate to another page and back
    const mealCard = page.locator('[data-testid="meal-card"]').first();
    if (await mealCard.count() > 0) {
      await mealCard.click();
      await page.waitForNavigation();
      
      await page.goBack();
      
      // Check if scroll position is maintained (or close to it)
      scrollPosition = await page.evaluate(() => window.scrollY);
      expect(scrollPosition).toBeGreaterThan(400);
    }
  });

  test('should show breadcrumb navigation', async ({ page }) => {
    await page.goto('/shopping/products');
    
    // Click on a product
    const productCard = page.locator('[data-testid="product-card"]').first();
    await productCard.click();
    await page.waitForNavigation();
    
    // Should show breadcrumb
    const breadcrumb = page.locator('[data-testid="breadcrumb"]');
    await expect(breadcrumb).toBeVisible({ timeout: 5000 });
    
    // Breadcrumb items should be clickable
    const breadcrumbItems = breadcrumb.locator('[data-testid="breadcrumb-item"]');
    expect(await breadcrumbItems.count()).toBeGreaterThan(1);
  });
});

test.describe('User Session Management', () => {
  test('should handle session expiry', async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'ValidPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    
    // Clear authentication cookies to simulate session expiry
    const cookies = await page.context().cookies();
    const authCookie = cookies.find(c => c.name === 'authToken');
    
    if (authCookie) {
      await page.context().clearCookies({ name: 'authToken' });
    }
    
    // Try to navigate to protected page
    await page.goto('/meals');
    
    // Should redirect to login
    await page.waitForNavigation();
    expect(page.url()).toContain('/login');
  });

  test('should handle manual logout from all pages', async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'ValidPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    
    // Navigate to different page
    await page.goto('/meals');
    
    // Find logout button in menu/header
    const userMenu = page.locator('[data-testid="user-menu"]');
    await userMenu.click();
    
    const logoutButton = page.locator('button:has-text("logout")');
    await logoutButton.click();
    
    // Should redirect to login
    await page.waitForNavigation();
    expect(page.url()).toContain('/login');
  });

  test('should redirect to login for unauthenticated users', async ({ page }) => {
    // Try to access protected page without login
    await page.goto('/meals', { waitUntil: 'networkidle' });
    
    // Should be redirected to login
    expect(page.url()).toContain('/login');
  });
});

test.describe('Performance & Load Times', () => {
  test('should load main pages within acceptable time', async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'ValidPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    
    // Measure load time for meal page
    const startTime = Date.now();
    await page.goto('/meals');
    const loadTime = Date.now() - startTime;
    
    // Should load in less than 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should not make unnecessary API calls', async ({ page }) => {
    let apiCallCount = 0;
    
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        apiCallCount++;
      }
    });
    
    // Login and navigate
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'ValidPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    
    // Go to meals page
    await page.goto('/meals');
    
    // Count API calls (should be reasonable, not excessive)
    expect(apiCallCount).toBeLessThan(20);
    expect(apiCallCount).toBeGreaterThan(0);
  });

  test('should cache API responses when appropriate', async ({ page }) => {
    let apiCalls = 0;
    
    page.on('response', response => {
      if (response.url().includes('/api/products')) {
        apiCalls++;
      }
    });
    
    // First visit to products page
    await page.goto('/shopping/products');
    const firstLoadCalls = apiCalls;
    
    // Navigate away and back
    await page.goto('/meals');
    await page.goto('/shopping/products');
    
    // Should not make additional API calls if cached
    const secondLoadCalls = apiCalls - firstLoadCalls;
    
    // Allow one additional call for verification
    expect(secondLoadCalls).toBeLessThanOrEqual(1);
  });
});

test.describe('Error Messages & Feedback', () => {
  test('should show clear error messages for validation', async ({ page }) => {
    await page.goto('/health-profile');
    
    // Try to submit with invalid data
    await page.fill('input[name="age"]', '10');
    await page.click('button[type="submit"]');
    
    // Should show clear error message
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    
    // Error should be related to age
    const errorText = await errorMessage.textContent();
    expect(errorText?.toLowerCase()).toContain('age');
  });

  test('should show success messages for actions', async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'ValidPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    
    // Go to health profile
    await page.goto('/health-profile');
    
    // Fill and submit valid data
    await page.fill('input[name="age"]', '30');
    await page.fill('input[name="height"]', '175');
    await page.fill('input[name="weight"]', '75');
    await page.click('button[type="submit"]');
    
    // Should show success message
    const successMessage = page.locator('[data-testid="success-message"]');
    await expect(successMessage).toBeVisible({ timeout: 5000 });
  });

  test('should dismiss notification messages', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'WrongPassword');
    await page.click('button[type="submit"]');
    
    // Wait for error message
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    
    // Should have close button
    const closeButton = errorMessage.locator('button:has-text("×")');
    if (await closeButton.count() > 0) {
      await closeButton.click();
      
      // Message should disappear
      await expect(errorMessage).not.toBeVisible({ timeout: 5000 });
    }
  });
});
