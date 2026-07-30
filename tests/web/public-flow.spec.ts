import { expect, test, type Page } from '@playwright/test';

async function expectAuthContentToFit(page: Page) {
  const overflow = await page.locator('.auth-shell').evaluate((shell) => {
    const viewportWidth = document.documentElement.clientWidth;
    const visibleElements = Array.from(
      shell.querySelectorAll<HTMLElement>(
        '.auth-card, .auth-card h2, .auth-card p, .auth-card a, .auth-card button, .auth-card input',
      ),
    ).filter((element) => {
      const style = getComputedStyle(element);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });

    return visibleElements
      .map((element) => {
        const bounds = element.getBoundingClientRect();
        return {
          element: element.tagName,
          text: element.textContent?.trim().slice(0, 80) ?? '',
          left: bounds.left,
          right: bounds.right,
          scrollWidth: element.scrollWidth,
          clientWidth: element.clientWidth,
          viewportWidth,
        };
      })
      .filter((item) =>
        item.left < -1 ||
        item.right > item.viewportWidth + 1 ||
        item.scrollWidth > item.clientWidth + 1,
      );
  });

  expect(overflow).toEqual([]);
}

test('public shell exposes working account entry points', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Eventise/i);

  await page.goto('/register');
  await expect(page.getByRole('heading', { name: /Nasıl devam edelim/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /STK olarak katıl/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Etkinliklere katıl/i })).toBeVisible();

  await page.goto('/login');
  await expect(page.getByLabel(/e-posta/i)).toBeVisible();
  await expect(page.getByLabel(/şifre/i)).toBeVisible();
});

test('unauthenticated protected routes return to login on desktop and mobile', async ({ page }) => {
  await page.goto('/participant');
  await expect(page).toHaveURL(/\/login$/);

  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login$/);
});

test('registration and login content fits the active viewport', async ({ page }) => {
  await page.goto('/register');
  await expectAuthContentToFit(page);

  await page.goto('/login');
  await expectAuthContentToFit(page);
});
