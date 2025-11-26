# End-to-End Testing with Playwright

This directory contains Playwright end-to-end tests for PGY3-HUB.

## Setup

Playwright is already installed. Browser binaries are downloaded automatically.

## Running Tests

### Run all tests (headless)
```bash
npm run test:e2e
```

### Interactive UI Mode (RECOMMENDED for development)
```bash
npm run test:e2e:ui
```
- Watch tests run in real-time
- Time-travel debugging
- Visual test runner
- Best for writing and debugging tests

### Headed mode (see the browser)
```bash
npm run test:e2e:headed
```

### Debug mode (step-by-step)
```bash
npm run test:e2e:debug
```

### Run specific test file
```bash
npx playwright test example.spec.js
```

### Run tests in specific browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Test Structure

```
e2e/
├── example.spec.js          # Sample tests (edit these)
└── README.md               # This file
```

## Writing Tests

### Basic Test Structure
```javascript
const { test, expect } = require('@playwright/test');

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/');
    
    // Your test code here
    const element = page.locator('button');
    await expect(element).toBeVisible();
  });
});
```

### Common Actions
```javascript
// Navigation
await page.goto('/');

// Click elements
await page.click('button');
await page.getByRole('button', { name: 'Submit' }).click();

// Fill forms
await page.fill('input[name="email"]', 'test@example.com');

// Wait for elements
await page.waitForSelector('.loading', { state: 'hidden' });

// Assertions
await expect(page.locator('h1')).toHaveText('Welcome');
await expect(page).toHaveURL(/dashboard/);
```

### PGY3-HUB Specific Patterns

#### Wait for D3 Graph to Load
```javascript
await page.goto('/');
await page.waitForSelector('svg', { timeout: 10000 });
const svg = page.locator('svg');
await expect(svg).toBeVisible();
```

#### Create a Node
```javascript
// Click add button
await page.getByRole('button', { name: /new|add/i }).first().click();

// Select node type
await page.click('button:has-text("Topic")');

// Fill node details
await page.fill('input[name="label"]', 'New Topic');
await page.click('button:has-text("Create")');
```

#### Enable Connection Mode
```javascript
// Use keyboard shortcut
await page.keyboard.press('Control+C');

// Or click button
await page.click('button:has-text("Connection Mode")');
```

## Tips

1. **Use UI Mode for development**: `npm run test:e2e:ui`
2. **Generate selectors**: Use Playwright Inspector to record actions
3. **Add explicit waits**: D3 animations may need `waitForTimeout()`
4. **Test in multiple browsers**: Run against chromium, firefox, webkit
5. **Use descriptive test names**: Makes failures easier to understand

## Reports

After running tests, view the HTML report:
```bash
npx playwright show-report
```

## Debugging

When a test fails:
1. Check the screenshot in `test-results/`
2. View the trace file with `npx playwright show-trace`
3. Run in debug mode: `npm run test:e2e:debug`

## CI/CD

Tests are configured to run in CI with:
- 2 retries on failure
- Serial execution (not parallel)
- Automatic app startup via `webServer` config

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Selectors Guide](https://playwright.dev/docs/selectors)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
