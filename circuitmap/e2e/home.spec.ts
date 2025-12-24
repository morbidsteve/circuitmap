import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test('displays the landing page correctly', async ({ page }) => {
    await page.goto('/')

    // Check main heading
    await expect(page.getByRole('heading', { name: 'CircuitMap' })).toBeVisible()

    // Check tagline
    await expect(page.getByText('Electrical Panel Mapping SaaS')).toBeVisible()
  })

  test('has correct page title', async ({ page }) => {
    await page.goto('/')

    // The page should have a title (set in layout.tsx)
    await expect(page).toHaveTitle(/CircuitMap/)
  })

  test('is responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Main content should still be visible
    await expect(page.getByRole('heading', { name: 'CircuitMap' })).toBeVisible()
    await expect(page.getByText('Electrical Panel Mapping SaaS')).toBeVisible()
  })
})
