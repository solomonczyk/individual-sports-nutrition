import { test, expect, Page } from '@playwright/test';

/**
 * E2E Tests: User Registration Flow
 * 
 * Tests critical registration user journey:
 * - Email validation
 * - Password strength requirements
 * - Account creation
 * - Email verification (if implemented)
 * - Redirect to login
 */

const TEST_USER = {
  email: `test-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  fullName: 'Test User',
};

test.describe('User Registration Flow', () => {
  test('should display registration page', async ({ page }) => {
    await page.goto('/auth/register');
    
    await expect(page).toHaveTitle(/Register/i);
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/auth/register');
    
    // Try invalid email
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.fill('input[name="fullName"]', TEST_USER.fullName);
    
    // Try to submit
    await page.click('button[type="submit"]');
    
    // Should show error message
    const errorMessage = page.locator('text=/invalid|valid email/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('should validate password strength', async ({ page }) => {
    await page.goto('/auth/register');
    
    // Try weak password
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', 'weak');
    await page.fill('input[name="fullName"]', TEST_USER.fullName);
    
    // Should show error or warning
    const strengthIndicator = page.locator('[data-testid="password-strength"]');
    await expect(strengthIndicator).toContainText(/weak|low/i);
  });

  test('should prevent duplicate email registration', async ({ page }) => {
    await page.goto('/auth/register');
    
    // Use existing test email
    await page.fill('input[name="email"]', 'existing@example.com');
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.fill('input[name="fullName"]', TEST_USER.fullName);
    
    await page.click('button[type="submit"]');
    
    // Should show "email already exists" error
    const errorMessage = page.locator('text=/already exists|already registered/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('should successfully register new user', async ({ page }) => {
    await page.goto('/auth/register');
    
    // Fill registration form
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.fill('input[name="fullName"]', TEST_USER.fullName);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to login or verification page
    await page.waitForNavigation();
    
    // Verify we're not on registration page anymore
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/register');
    expect(currentUrl).toMatch(/login|verify|home/i);
  });

  test('should show required field validation', async ({ page }) => {
    await page.goto('/auth/register');
    
    // Leave fields empty and try to submit
    await page.click('button[type="submit"]');
    
    // Should show validation errors
    const emailError = page.locator('text=/email.*required/i');
    const passwordError = page.locator('text=/password.*required/i');
    
    await expect(emailError).toBeVisible({ timeout: 5000 });
    await expect(passwordError).toBeVisible({ timeout: 5000 });
  });

  test('should have working "login" link', async ({ page }) => {
    await page.goto('/auth/register');
    
    // Click "Already have account? Login" link
    await page.click('a:has-text("login")');
    
    // Should navigate to login page
    await page.waitForNavigation();
    expect(page.url()).toContain('/login');
  });
});

/**
 * E2E Tests: Login Flow
 */
test.describe('User Login Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/auth/login');
    
    await expect(page).toHaveTitle(/Login|Sign In/i);
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test('should validate credentials', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Try with wrong credentials
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    
    await page.click('button[type="submit"]');
    
    // Should show error
    const errorMessage = page.locator('text=/invalid|incorrect|credentials/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Use test account
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'ValidPassword123!');
    
    await page.click('button[type="submit"]');
    
    // Should redirect to home/dashboard
    await page.waitForNavigation();
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/login');
  });

  test('should persist session after login', async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'ValidPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    
    // Navigate to another page
    await page.goto('/home');
    
    // Should stay logged in (no redirect to login)
    expect(page.url()).toContain('/home');
  });

  test('should have working "forgot password" link', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Click forgot password link
    await page.click('a:has-text("forgot")');
    
    // Should navigate to password reset page
    await page.waitForNavigation();
    expect(page.url()).toContain('/reset-password');
  });
});

/**
 * E2E Tests: Logout Flow
 */
test.describe('User Logout Flow', () => {
  test('should logout and redirect to login', async ({ page, context }) => {
    // First login
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'ValidPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    
    // Find and click logout button
    const logoutButton = page.locator('button:has-text("logout")');
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();
    
    // Should redirect to login
    await page.waitForNavigation();
    expect(page.url()).toContain('/login');
    
    // Session should be cleared
    const cookies = await context.cookies();
    const authCookie = cookies.find(c => c.name === 'authToken');
    expect(authCookie).toBeUndefined();
  });

  test('should clear session tokens on logout', async ({ page, context }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'ValidPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    
    // Verify token exists
    let cookies = await context.cookies();
    let authCookie = cookies.find(c => c.name === 'authToken');
    expect(authCookie).toBeDefined();
    
    // Logout
    await page.click('button:has-text("logout")');
    await page.waitForNavigation();
    
    // Token should be gone
    cookies = await context.cookies();
    authCookie = cookies.find(c => c.name === 'authToken');
    expect(authCookie).toBeUndefined();
  });
});
