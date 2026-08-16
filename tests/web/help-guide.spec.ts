import { expect, test } from '@playwright/test';

test('current usage guide shortcuts, search and empty results work', async ({ page }) => {
  await page.goto('/yardim');

  await expect(page).toHaveTitle(/Kullanım Rehberi — Eventise/);
  await expect(page.getByRole('heading', { name: 'Eventise’ı adım adım kullanın' })).toBeVisible();
  await expect(page.getByText('Eventise 1.0 beta ile güncel')).toBeVisible();

  const publishingShortcut = page.getByRole('link', { name: /Yayın ve kayıtları yöneteceğim/ });
  await expect(publishingShortcut).toHaveAttribute('href', '#yayin-kayit');
  await publishingShortcut.click();
  await expect(page).toHaveURL(/#yayin-kayit$/);
  await expect(page.getByRole('heading', { name: '4. Yayın, görünürlük ve kayıtlar' })).toBeVisible();

  const search = page.getByRole('searchbox', { name: 'Nasıl yardımcı olabiliriz?' });
  await search.fill('QR kod');
  await expect(page.getByText(/ilgili yanıt bulundu/)).toBeVisible();
  await expect(page.getByText('Katılım teyidi nasıl yapılır?')).toBeVisible();

  await search.fill('eşleşmeyecek-deneme-ifadesi');
  await expect(page.getByText('Bu aramayla eşleşen bir yanıt bulamadık.')).toBeVisible();
  await page.getByRole('button', { name: 'Tüm rehberi göster' }).click();
  await expect(search).toHaveValue('');
});

test('usage guide stays within the viewport', async ({ page }) => {
  await page.goto('/yardim');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
