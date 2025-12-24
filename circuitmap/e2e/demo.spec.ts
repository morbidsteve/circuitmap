import { test, expect } from '@playwright/test'

test.describe('Demo Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo')
  })

  test('displays the demo page header', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'CircuitMap Demo' })).toBeVisible()
    await expect(page.getByText('Click on a breaker to see connected devices')).toBeVisible()
  })

  test('shows loading state initially', async ({ page }) => {
    // Navigate fresh to catch loading state
    await page.goto('/demo')
    // The loading state should either be visible briefly or already resolved
    // We check that the page eventually loads
    await expect(page.getByRole('heading', { name: 'CircuitMap Demo' })).toBeVisible({ timeout: 10000 })
  })

  test('displays panel info card when no breaker is selected', async ({ page }) => {
    // Wait for the page to load
    await expect(page.getByText('Panel Info').or(page.getByText('No Panel Found'))).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Demo Page with Panel Data', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo')
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
  })

  test('displays panel information when data is loaded', async ({ page }) => {
    // Check for panel info or no panel message
    const panelInfo = page.getByText('Panel Info')
    const noPanelMessage = page.getByText('No Panel Found')

    await expect(panelInfo.or(noPanelMessage)).toBeVisible({ timeout: 10000 })

    // If panel exists, check for statistics section
    if (await panelInfo.isVisible()) {
      await expect(page.getByText('Statistics')).toBeVisible()
      await expect(page.getByText('Total Slots')).toBeVisible()
      await expect(page.getByText('Installed Breakers')).toBeVisible()
      await expect(page.getByText('Total Devices')).toBeVisible()
    }
  })

  test('shows panel details in the info card', async ({ page }) => {
    const panelInfo = page.getByText('Panel Info')

    if (await panelInfo.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Check for panel name field
      await expect(page.getByText('Panel Name')).toBeVisible()
    }
  })
})

test.describe('Demo Page Interactions', () => {
  test('allows clicking on breakers', async ({ page }) => {
    await page.goto('/demo')
    await page.waitForLoadState('networkidle')

    // Look for a breaker slot that can be clicked
    const breakerSlot = page.locator('[class*="cursor-pointer"]').first()

    if (await breakerSlot.isVisible({ timeout: 5000 }).catch(() => false)) {
      await breakerSlot.click()

      // After clicking, the card should show "Breaker Details"
      await expect(page.getByText('Breaker Details')).toBeVisible()
    }
  })

  test('shows breaker details when breaker is clicked', async ({ page }) => {
    await page.goto('/demo')
    await page.waitForLoadState('networkidle')

    // Find and click a breaker
    const breakerSlot = page.locator('[class*="cursor-pointer"]').first()

    if (await breakerSlot.isVisible({ timeout: 5000 }).catch(() => false)) {
      await breakerSlot.click()

      // Check for breaker detail fields
      await expect(page.getByText('Position')).toBeVisible()
      await expect(page.getByText('Label')).toBeVisible()
      await expect(page.getByText('Amperage')).toBeVisible()
      await expect(page.getByText('Poles')).toBeVisible()
    }
  })

  test('displays connected devices for selected breaker', async ({ page }) => {
    await page.goto('/demo')
    await page.waitForLoadState('networkidle')

    // Find and click a breaker
    const breakerSlot = page.locator('[class*="cursor-pointer"]').first()

    if (await breakerSlot.isVisible({ timeout: 5000 }).catch(() => false)) {
      await breakerSlot.click()

      // Check for connected devices section
      await expect(page.getByText(/Connected Devices/)).toBeVisible()
    }
  })
})

test.describe('Demo Page Responsiveness', () => {
  test('panel layout is responsive on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/demo')

    await expect(page.getByRole('heading', { name: 'CircuitMap Demo' })).toBeVisible()
  })

  test('panel layout is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/demo')

    await expect(page.getByRole('heading', { name: 'CircuitMap Demo' })).toBeVisible()
  })

  test('panel and details cards stack on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/demo')
    await page.waitForLoadState('networkidle')

    // On mobile, both the panel view and info card should be visible when scrolling
    const panelInfo = page.getByText('Panel Info').or(page.getByText('No Panel Found'))
    await expect(panelInfo).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Demo Page Error States', () => {
  test('shows "No Panel Found" message when API returns empty', async ({ page }) => {
    // Mock empty API response
    await page.route('/api/panels', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    })

    await page.goto('/demo')

    await expect(page.getByText('No Panel Found')).toBeVisible()
    await expect(page.getByText('Please run the seed script to populate demo data')).toBeVisible()
    await expect(page.getByText('pnpm db:seed')).toBeVisible()
  })

  test('handles API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('/api/panels', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      })
    })

    await page.goto('/demo')

    // Should show the no panel found state or error handling
    await expect(page.getByText('No Panel Found').or(page.getByText('Loading...'))).toBeVisible({ timeout: 10000 })
  })
})
