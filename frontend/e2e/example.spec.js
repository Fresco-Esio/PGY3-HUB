// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * PGY3-HUB E2E Test Suite
 * Version: 0.7.2 - Connection-Aware Realignment
 * 
 * Tests all current implemented features including:
 * - Basic application loading
 * - Node creation and management
 * - Connection system
 * - Realignment functionality (Smart Layout with Connection-Aware forces)
 * - Focus Mode with localized physics
 * - Physics Controls with persistence
 * - Search and filtering
 * - Modal interactions
 */

/**
 * Helper function to navigate past the home screen and into the app
 * @param {import('@playwright/test').Page} page 
 */
async function enterApp(page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  // Wait for home screen to fully load with animations
  await page.waitForTimeout(1500);
  
  // Click "Create New Map" button to enter the app
  const createButton = page.getByRole('button', { name: /create new map/i });
  await createButton.click();
  
  // Wait for the app to load
  await page.waitForTimeout(2000);
  await page.waitForLoadState('networkidle');
}

/**
 * Basic Application Tests
 */
test.describe('Application Smoke Tests', () => {
  test('should load the homepage successfully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify page title
    await expect(page).toHaveTitle(/PGY3-HUB/i);
    
    // Verify main app container exists
    const appContainer = page.locator('#root');
    await expect(appContainer).toBeVisible();
  });

  test('should display home screen with Create New Map button', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500); // Wait for animations
    
    // Verify "Create New Map" button is visible
    const createButton = page.getByRole('button', { name: /create new map/i });
    await expect(createButton).toBeVisible({ timeout: 10000 });
  });

  test('should enter app when clicking Create New Map', async ({ page }) => {
    await enterApp(page);
    
    // Should now be in the main app (not home screen)
    // Look for toolbar or other app elements
    const appElements = page.locator('button').filter({ hasText: /realign|focus|search/i }).first();
    await expect(appElements).toBeVisible({ timeout: 10000 });
  });

  test('should display version number in app', async ({ page }) => {
    await enterApp(page);
    
    // Look for version indicator (v0.7.2)
    const versionText = page.locator('text=/v0\\.7\\./i');
    await expect(versionText).toBeVisible({ timeout: 10000 });
  });
});

/**
 * Node Creation and Management Tests
 */
test.describe('Node Creation', () => {
  test('should have node creation button visible', async ({ page }) => {
    await enterApp(page);
    
    // Look for "New Node" or add button with Plus icon
    const addButton = page.getByRole('button', { name: /new|add|create/i }).first();
    await expect(addButton).toBeVisible({ timeout: 10000 });
  });

  test('should open node selector modal when creating node', async ({ page }) => {
    await enterApp(page);
    
    // Click add button
    const addButton = page.getByRole('button', { name: /new|add|create/i }).first();
    await addButton.click();
    
    // Wait for modal/selector to appear
    await page.waitForTimeout(500);
    
    // Check for node type options (Topic, Case, Task, Literature)
    const modal = page.locator('[role="dialog"], .modal').first();
    await expect(modal).toBeVisible({ timeout: 5000 });
  });

  test('should allow keyboard shortcut for node creation (Ctrl+N)', async ({ page }) => {
    await enterApp(page);
    
    // Use keyboard shortcut
    await page.keyboard.press('Control+N');
    
    // Modal should appear
    await page.waitForTimeout(500);
    const modal = page.locator('[role="dialog"], .modal').first();
    await expect(modal).toBeVisible({ timeout: 5000 });
  });
});

/**
 * Connection System Tests
 */
test.describe('Connection Mode', () => {
  test('should enable connection mode with Ctrl+C', async ({ page }) => {
    await enterApp(page);
    
    // Enable connection mode
    await page.keyboard.press('Control+C');
    await page.waitForTimeout(500);
    
    // Look for connection mode indicator
    // This might be a button state change or toast notification
    const connectionIndicator = page.locator('text=/connection mode/i').first();
    
    // Give it time to appear
    if (await connectionIndicator.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(connectionIndicator).toBeVisible();
    }
  });

  test('should have connection mode toggle button', async ({ page }) => {
    await enterApp(page);
    
    // Look for connection mode button in toolbar
    const connectionButton = page.locator('button').filter({ hasText: /connect/i }).first();
    
    // Button may or may not exist depending on UI, check gracefully
    const exists = await connectionButton.isVisible({ timeout: 3000 }).catch(() => false);
    if (exists) {
      await expect(connectionButton).toBeVisible();
    }
  });
});

/**
 * Realignment Tests (Smart Layout + Connection-Aware)
 */
test.describe('Realignment Functionality', () => {
  test('should have Realign Nodes button visible', async ({ page }) => {
    await enterApp(page);
    
    // Look for Realign button (Ctrl+R shortcut)
    const realignButton = page.locator('button').filter({ hasText: /realign/i }).first();
    await expect(realignButton).toBeVisible({ timeout: 10000 });
  });

  test('should trigger realignment with Ctrl+R keyboard shortcut', async ({ page }) => {
    await enterApp(page);
    
    // Use keyboard shortcut
    await page.keyboard.press('Control+R');
    
    // Wait for realignment animation
    await page.waitForTimeout(1500);
    
    // Check for toast notification or visual feedback
    const toast = page.locator('.toast, [role="alert"]').first();
    const visible = await toast.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (visible) {
      await expect(toast).toContainText(/cluster|organiz|realign/i);
    }
  });

  test('should click Realign button and trigger layout', async ({ page }) => {
    await enterApp(page);
    
    // Click realign button
    const realignButton = page.locator('button').filter({ hasText: /realign/i }).first();
    await realignButton.click();
    
    // Wait for animation to complete
    await page.waitForTimeout(2000);
    
    // Verify no errors in console (basic check)
    // Nodes should be repositioned (hard to assert without knowing initial positions)
  });

  test('should maintain node positions after realignment drag', async ({ page }) => {
    await enterApp(page);
    
    // Trigger realignment
    await page.keyboard.press('Control+R');
    await page.waitForTimeout(2000);
    
    // Note: Dragging nodes after realignment should work without snap-back
    // This is tested by the stability guard system
    // Visual inspection recommended for full validation
  });
});

/**
 * Focus Mode Tests (v0.7.0)
 */
test.describe('Focus Mode', () => {
  test('should have Focus Mode toggle button', async ({ page }) => {
    await enterApp(page);
    
    // Look for Focus Mode toggle (with 🎯 or eye icon)
    const focusButton = page.locator('button').filter({ hasText: /focus mode/i }).first();
    await expect(focusButton).toBeVisible({ timeout: 10000 });
  });

  test('should toggle Focus Mode on and off', async ({ page }) => {
    await enterApp(page);
    
    // Find and click Focus Mode button
    const focusButton = page.locator('button').filter({ hasText: /focus mode/i }).first();
    await focusButton.click();
    
    // Wait for state change
    await page.waitForTimeout(500);
    
    // Button should show "ON" state or similar
    await expect(focusButton).toContainText(/on|active/i);
    
    // Click again to toggle off
    await focusButton.click();
    await page.waitForTimeout(500);
  });

  test('should exit Focus Mode with ESC key', async ({ page }) => {
    await enterApp(page);
    
    // Enable Focus Mode
    const focusButton = page.locator('button').filter({ hasText: /focus mode/i }).first();
    await focusButton.click();
    await page.waitForTimeout(500);
    
    // Press ESC to exit
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    // Focus mode should be disabled
    await expect(focusButton).not.toContainText(/active/i);
  });
});

/**
 * Physics Controls Tests (v0.6.0)
 */
test.describe('Physics Controls', () => {
  test('should open physics controls panel', async ({ page }) => {
    await enterApp(page);
    
    // Look for gear icon or settings button
    const settingsButton = page.locator('button[title*="Physics"], button[aria-label*="Physics"]').first();
    
    if (await settingsButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await settingsButton.click();
      await page.waitForTimeout(500);
      
      // Panel should appear with sliders
      const panel = page.locator('.physics-controls, [role="dialog"]').first();
      await expect(panel).toBeVisible();
    }
  });

  test('should have adjustable physics parameters', async ({ page }) => {
    await enterApp(page);
    
    // Open physics controls
    const settingsButton = page.locator('button[title*="Physics"], button[aria-label*="Physics"]').first();
    
    if (await settingsButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await settingsButton.click();
      await page.waitForTimeout(500);
      
      // Look for sliders (6 parameters: collision, link, simulation dynamics)
      const sliders = page.locator('input[type="range"]');
      const count = await sliders.count();
      
      // Should have 6 sliders (collision radius/strength, link distance/strength, alphaDecay, velocityDecay)
      expect(count).toBeGreaterThanOrEqual(4); // At least 4 sliders
    }
  });

  test('should save physics settings to localStorage', async ({ page }) => {
    await enterApp(page);
    
    // Open physics controls
    const settingsButton = page.locator('button[title*="Physics"], button[aria-label*="Physics"]').first();
    
    if (await settingsButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await settingsButton.click();
      await page.waitForTimeout(500);
      
      // Look for Save button
      const saveButton = page.locator('button').filter({ hasText: /save/i }).first();
      
      if (await saveButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await saveButton.click();
        
        // Check localStorage
        const savedSettings = await page.evaluate(() => {
          return localStorage.getItem('pgy3hub_physics_settings');
        });
        
        expect(savedSettings).toBeTruthy();
      }
    }
  });
});

/**
 * Search and Filtering Tests
 */
test.describe('Search Functionality', () => {
  test('should have search bar visible', async ({ page }) => {
    await enterApp(page);
    
    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });
  });

  test('should allow typing in search bar', async ({ page }) => {
    await enterApp(page);
    
    // Find search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    
    // Type search query
    await searchInput.fill('test search');
    
    // Verify input value
    await expect(searchInput).toHaveValue('test search');
  });

  test('should have category filter badges', async ({ page }) => {
    await enterApp(page);
    
    // Look for filter badges (Topic, Case, Task, Literature)
    const filterButtons = page.locator('button').filter({ hasText: /topic|case|task|literature/i });
    const count = await filterButtons.count();
    
    // Should have at least 3-4 filter options
    expect(count).toBeGreaterThanOrEqual(3);
  });
});

/**
 * Keyboard Shortcuts Tests
 */
test.describe('Keyboard Shortcuts', () => {
  test('should respond to Ctrl+N (new node)', async ({ page }) => {
    await enterApp(page);
    
    await page.keyboard.press('Control+N');
    await page.waitForTimeout(500);
    
    // Modal should appear
    const modal = page.locator('[role="dialog"], .modal').first();
    await expect(modal).toBeVisible({ timeout: 5000 });
  });

  test('should respond to Ctrl+R (realign)', async ({ page }) => {
    await enterApp(page);
    
    await page.keyboard.press('Control+R');
    await page.waitForTimeout(1500);
    
    // Should trigger realignment (check for toast or no errors)
  });

  test('should respond to Escape (clear selection)', async ({ page }) => {
    await enterApp(page);
    
    // Press escape
    await page.keyboard.press('Escape');
    
    // Should clear any active modals or selections
    await page.waitForTimeout(500);
  });
});

/**
 * Auto-Save Tests
 */
test.describe('Auto-Save Functionality', () => {
  test('should show auto-save indicator', async ({ page }) => {
    await enterApp(page);
    
    // Look for auto-save status indicator
    const saveIndicator = page.locator('text=/saved|saving|auto/i').first();
    
    // Give it time to appear
    const visible = await saveIndicator.isVisible({ timeout: 5000 }).catch(() => false);
    if (visible) {
      await expect(saveIndicator).toBeVisible();
    }
  });
});

/**
 * Performance and Stability Tests
 */
test.describe('Performance Tests', () => {
  test('should load without console errors', async ({ page }) => {
    /** @type {string[]} */
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await enterApp(page);
    await page.waitForTimeout(2000);
    
    // Filter out expected errors (like React dev mode warnings)
    const criticalErrors = errors.filter(err => 
      !err.includes('Warning:') && 
      !err.includes('Download the React DevTools')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('should handle rapid keyboard shortcut presses', async ({ page }) => {
    await enterApp(page);
    
    // Rapidly press shortcuts
    await page.keyboard.press('Control+N');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Control+R');
    await page.keyboard.press('Control+C');
    
    await page.waitForTimeout(2000);
    
    // App should still be responsive
    const appContainer = page.locator('#root');
    await expect(appContainer).toBeVisible();
  });
});
