// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Comprehensive tests for realignment and drag behavior
 * Tests focus on:
 * 1. No snap-back after realignment
 * 2. Natural drag behavior with physics
 * 3. No position shifts from modal state changes
 * 4. Stable initial load with saved positions
 */

test.describe('Realignment and Drag Behavior', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Wait for app to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Check if we need to load sample data
    const hasSampleButton = await page.locator('button:has-text("Load Sample")').count();
    if (hasSampleButton > 0) {
      await page.click('button:has-text("Load Sample")');
      await page.waitForTimeout(2000);
    }
  });

  test('should load without excessive node movement', async ({ page }) => {
    // Wait for simulation to settle
    await page.waitForTimeout(1000);
    
    // Get initial positions of first 3 nodes
    const initialPositions = await page.evaluate(() => {
      const nodes = document.querySelectorAll('g.node-group');
      return Array.from(nodes).slice(0, 3).map(node => {
        const transform = node.getAttribute('transform');
        const match = transform.match(/translate\(([\d.]+),\s*([\d.]+)\)/);
        return match ? { x: parseFloat(match[1]), y: parseFloat(match[2]) } : null;
      });
    });

    // Wait a bit more
    await page.waitForTimeout(1000);
    
    // Check positions haven't changed drastically
    const afterPositions = await page.evaluate(() => {
      const nodes = document.querySelectorAll('g.node-group');
      return Array.from(nodes).slice(0, 3).map(node => {
        const transform = node.getAttribute('transform');
        const match = transform.match(/translate\(([\d.]+),\s*([\d.]+)\)/);
        return match ? { x: parseFloat(match[1]), y: parseFloat(match[2]) } : null;
      });
    });

    // Movement should be minimal (less than 50px)
    for (let i = 0; i < initialPositions.length; i++) {
      if (initialPositions[i] && afterPositions[i]) {
        const dx = Math.abs(afterPositions[i].x - initialPositions[i].x);
        const dy = Math.abs(afterPositions[i].y - initialPositions[i].y);
        expect(dx).toBeLessThan(50);
        expect(dy).toBeLessThan(50);
      }
    }
  });

  test('should realign nodes without snap-back', async ({ page }) => {
    // Find the realign button (check multiple possible texts)
    const realignButton = page.locator('button').filter({ hasText: /Realign|Re-align|Organize/ }).first();
    const buttonExists = await realignButton.count();
    
    if (buttonExists === 0) {
      console.log('No realign button found, skipping test');
      return;
    }
    
    // Click realign button
    await realignButton.click();
    
    // Wait for realignment animation
    await page.waitForTimeout(3000);
    
    // Get positions after realignment settles
    const afterRealign = await page.evaluate(() => {
      const nodes = document.querySelectorAll('g.node-group');
      return Array.from(nodes).slice(0, 3).map(node => {
        const transform = node.getAttribute('transform');
        const match = transform.match(/translate\(([\d.]+),\s*([\d.]+)\)/);
        return match ? { x: parseFloat(match[1]), y: parseFloat(match[2]) } : null;
      });
    });

    // Wait additional time to check for snap-back
    await page.waitForTimeout(2000);
    
    const afterWait = await page.evaluate(() => {
      const nodes = document.querySelectorAll('g.node-group');
      return Array.from(nodes).slice(0, 3).map(node => {
        const transform = node.getAttribute('transform');
        const match = transform.match(/translate\(([\d.]+),\s*([\d.]+)\)/);
        return match ? { x: parseFloat(match[1]), y: parseFloat(match[2]) } : null;
      });
    });

    // Positions should remain stable (no snap-back)
    for (let i = 0; i < afterRealign.length; i++) {
      if (afterRealign[i] && afterWait[i]) {
        const dx = Math.abs(afterWait[i].x - afterRealign[i].x);
        const dy = Math.abs(afterWait[i].y - afterRealign[i].y);
        // Allow only minor settling movement (< 10px)
        expect(dx).toBeLessThan(10);
        expect(dy).toBeLessThan(10);
      }
    }
  });

  test('should drag node smoothly after realignment', async ({ page }) => {
    // Find the realign button
    const realignButton = page.locator('button').filter({ hasText: /Realign|Re-align|Organize/ }).first();
    const buttonExists = await realignButton.count();
    
    if (buttonExists === 0) return;
    
    // Realign first
    await realignButton.click();
    await page.waitForTimeout(3000);
    
    // Find a node to drag
    const nodeHandle = await page.locator('g.node-group').first();
    const box = await nodeHandle.boundingBox();
    
    if (!box) {
      throw new Error('Node not found');
    }

    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;
    
    // Get initial position
    const beforeDrag = await page.evaluate(() => {
      const node = document.querySelector('g.node-group');
      const transform = node.getAttribute('transform');
      const match = transform.match(/translate\(([\d.]+),\s*([\d.]+)\)/);
      return match ? { x: parseFloat(match[1]), y: parseFloat(match[2]) } : null;
    });

    // Drag the node
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 100, startY + 100, { steps: 10 });
    await page.mouse.up();
    
    // Wait for physics to settle
    await page.waitForTimeout(1000);
    
    // Get position after drag
    const afterDrag = await page.evaluate(() => {
      const node = document.querySelector('g.node-group');
      const transform = node.getAttribute('transform');
      const match = transform.match(/translate\(([\d.]+),\s*([\d.]+)\)/);
      return match ? { x: parseFloat(match[1]), y: parseFloat(match[2]) } : null;
    });

    // Node should have moved in the direction of drag
    expect(afterDrag.x).toBeGreaterThan(beforeDrag.x + 50);
    expect(afterDrag.y).toBeGreaterThan(beforeDrag.y + 50);
    
    // Wait and check for snap-back
    await page.waitForTimeout(2000);
    
    const afterWait = await page.evaluate(() => {
      const node = document.querySelector('g.node-group');
      const transform = node.getAttribute('transform');
      const match = transform.match(/translate\(([\d.]+),\s*([\d.]+)\)/);
      return match ? { x: parseFloat(match[1]), y: parseFloat(match[2]) } : null;
    });

    // Should not snap back significantly
    const dx = Math.abs(afterWait.x - afterDrag.x);
    const dy = Math.abs(afterWait.y - afterDrag.y);
    expect(dx).toBeLessThan(30); // Allow minor physics settling
    expect(dy).toBeLessThan(30);
  });

  test('should not shift positions when closing modals', async ({ page }) => {
    // Wait for initial load
    await page.waitForTimeout(2000);
    
    // Get positions before modal interaction
    const beforeModal = await page.evaluate(() => {
      const nodes = document.querySelectorAll('g.node-group');
      return Array.from(nodes).slice(0, 3).map(node => {
        const transform = node.getAttribute('transform');
        const match = transform.match(/translate\(([\d.]+),\s*([\d.]+)\)/);
        return match ? { x: parseFloat(match[1]), y: parseFloat(match[2]) } : null;
      });
    });

    // Open and close a node (if modal exists)
    const firstNode = await page.locator('g.node-group').first();
    await firstNode.dblclick();
    await page.waitForTimeout(500);
    
    // Try to close modal
    const escapePressed = await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    // Get positions after modal close
    const afterModal = await page.evaluate(() => {
      const nodes = document.querySelectorAll('g.node-group');
      return Array.from(nodes).slice(0, 3).map(node => {
        const transform = node.getAttribute('transform');
        const match = transform.match(/translate\(([\d.]+),\s*([\d.]+)\)/);
        return match ? { x: parseFloat(match[1]), y: parseFloat(match[2]) } : null;
      });
    });

    // Positions should be identical
    for (let i = 0; i < beforeModal.length; i++) {
      if (beforeModal[i] && afterModal[i]) {
        const dx = Math.abs(afterModal[i].x - beforeModal[i].x);
        const dy = Math.abs(afterModal[i].y - beforeModal[i].y);
        expect(dx).toBeLessThan(5); // Allow floating point precision
        expect(dy).toBeLessThan(5);
      }
    }
  });

  test('should have natural physics during drag', async ({ page }) => {
    // Wait for initial load
    await page.waitForTimeout(2000);
    
    // Find two adjacent nodes (if they exist)
    const allNodes = await page.locator('g.node-group').all();
    
    if (allNodes.length < 2) {
      console.log('Not enough nodes for physics test');
      return;
    }

    const firstNodeBox = await allNodes[0].boundingBox();
    
    if (!firstNodeBox) return;

    // Get positions of nearby nodes before drag
    const beforeDrag = await page.evaluate(() => {
      const nodes = document.querySelectorAll('g.node-group');
      return Array.from(nodes).slice(0, 5).map(node => {
        const transform = node.getAttribute('transform');
        const match = transform.match(/translate\(([\d.]+),\s*([\d.]+)\)/);
        return match ? { x: parseFloat(match[1]), y: parseFloat(match[2]) } : null;
      });
    });

    // Drag first node
    const startX = firstNodeBox.x + firstNodeBox.width / 2;
    const startY = firstNodeBox.y + firstNodeBox.height / 2;
    
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 150, startY + 150, { steps: 15 });
    
    // Check positions DURING drag (before releasing)
    const duringDrag = await page.evaluate(() => {
      const nodes = document.querySelectorAll('g.node-group');
      return Array.from(nodes).slice(0, 5).map(node => {
        const transform = node.getAttribute('transform');
        const match = transform.match(/translate\(([\d.]+),\s*([\d.]+)\)/);
        return match ? { x: parseFloat(match[1]), y: parseFloat(match[2]) } : null;
      });
    });
    
    await page.mouse.up();
    await page.waitForTimeout(500);

    // First node should have moved significantly
    if (beforeDrag[0] && duringDrag[0]) {
      const dx = Math.abs(duringDrag[0].x - beforeDrag[0].x);
      const dy = Math.abs(duringDrag[0].y - beforeDrag[0].y);
      expect(dx).toBeGreaterThan(100);
      expect(dy).toBeGreaterThan(100);
    }

    // Other nodes should have moved less (or not at all if not connected)
    // This tests that physics is working but not excessive
    for (let i = 1; i < Math.min(beforeDrag.length, 5); i++) {
      if (beforeDrag[i] && duringDrag[i]) {
        const dx = Math.abs(duringDrag[i].x - beforeDrag[i].x);
        const dy = Math.abs(duringDrag[i].y - beforeDrag[i].y);
        // Other nodes should move less than the dragged node
        expect(dx).toBeLessThan(200);
        expect(dy).toBeLessThan(200);
      }
    }
  });

  test('should handle rapid drag after realignment', async ({ page }) => {
    // Find the realign button
    const realignButton = page.locator('button').filter({ hasText: /Realign|Re-align|Organize/ }).first();
    const buttonExists = await realignButton.count();
    
    if (buttonExists === 0) return;
    
    // Realign
    await realignButton.click();
    
    // Wait only 1 second (not full settle time)
    await page.waitForTimeout(1000);
    
    // Immediately start dragging
    const nodeHandle = await page.locator('g.node-group').first();
    const box = await nodeHandle.boundingBox();
    
    if (!box) return;

    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;
    
    // Drag quickly
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 80, startY - 80, { steps: 5 });
    await page.mouse.up();
    
    // Get position immediately after drag
    const afterDrag = await page.evaluate(() => {
      const node = document.querySelector('g.node-group');
      const transform = node.getAttribute('transform');
      const match = transform.match(/translate\(([\d.]+),\s*([\d.]+)\)/);
      return match ? { x: parseFloat(match[1]), y: parseFloat(match[2]) } : null;
    });

    // Wait and check for snap-back
    await page.waitForTimeout(3000);
    
    const afterWait = await page.evaluate(() => {
      const node = document.querySelector('g.node-group');
      const transform = node.getAttribute('transform');
      const match = transform.match(/translate\(([\d.]+),\s*([\d.]+)\)/);
      return match ? { x: parseFloat(match[1]), y: parseFloat(match[2]) } : null;
    });

    // Should not snap back to pre-drag position
    const movement = Math.sqrt(
      Math.pow(afterWait.x - afterDrag.x, 2) + 
      Math.pow(afterWait.y - afterDrag.y, 2)
    );
    
    expect(movement).toBeLessThan(50); // Minor settling is ok
  });
});
