import { expect, test } from '@playwright/test';

const sampleProducts = [
  { product_id: 1, product_name: 'Keyboard', price: '49.99', quantity: 4 },
  { product_id: 2, product_name: 'Mouse', price: '19.99', quantity: 10 },
];

async function mockSuccessfulLogin(page) {
  await page.route('**/api/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        message: 'Login successful.',
        token: 'token-123',
        user: { id: 1, email: 'admin@apple.com' },
      }),
    });
  });

  await page.route('**/api/bootstrap/tables', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'ok',
        tables: {
          product: {
            count: sampleProducts.length,
            sample: sampleProducts,
          },
        },
      }),
    });
  });

  await page.route('**/api/session', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: { id: 1, email: 'admin@apple.com' },
      }),
    });
  });

  await page.route('**/api/logout', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Logout successful.' }),
    });
  });
}

async function fillLoginForm(page, password = 'admin') {
  await page.getByLabel('Email').fill('admin@apple.com');
  await page.getByLabel('Password').fill(password);
}

test.describe('Frontend test cases from Test-Cases.csv', () => {
  test('TC-022 Login page renders required fields and controls', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });

  test('TC-023 Password field masks input', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByLabel('Password')).toHaveAttribute('type', 'password');
  });

  test('TC-024 Empty form submission is blocked client-side', async ({ page }) => {
    let loginRequests = 0;
    await page.route('**/api/login', async (route) => {
      loginRequests += 1;
      await route.abort();
    });

    await page.goto('/');
    await page.getByRole('button', { name: 'Login' }).click();

    const emailIsInvalid = await page.getByLabel('Email').evaluate((element) => !element.checkValidity());
    expect(emailIsInvalid).toBe(true);
    expect(loginRequests).toBe(0);
  });

  test('TC-025 Valid login redirects user to the product page', async ({ page }) => {
    await mockSuccessfulLogin(page);
    await page.goto('/login');
    await fillLoginForm(page);
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page).toHaveURL(/\/products$/);
    await expect(page.getByRole('heading', { name: 'Product Management Area' })).toBeVisible();
  });

  test('TC-026 Invalid credentials show an inline error without navigating away', async ({ page }) => {
    await page.route('**/api/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Invalid email or password.' }),
      });
    });

    await page.goto('/login');
    await fillLoginForm(page, 'wrongpass');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText('Invalid email or password.')).toBeVisible();
  });

  test('TC-027 Backend unreachable shows a distinct network-error message', async ({ page }) => {
    await page.route('**/api/login', async (route) => {
      await route.abort('failed');
    });

    await page.goto('/');
    await fillLoginForm(page);
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(
      page.getByText('Unable to reach the backend. Check the API server and try again.'),
    ).toBeVisible();
  });

  test('TC-028 Submit control shows a loading state and prevents double-submit', async ({ page }) => {
    let loginRequests = 0;
    let resolveLogin;
    const loginFinished = new Promise((resolve) => {
      resolveLogin = resolve;
    });

    await page.route('**/api/login', async (route) => {
      loginRequests += 1;
      await loginFinished;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Login successful.',
          token: 'token-123',
          user: { id: 1, email: 'admin@apple.com' },
        }),
      });
    });

    await page.route('**/api/bootstrap/tables', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'ok',
          tables: { product: { count: 0, sample: [] } },
        }),
      });
    });

    await page.goto('/');
    await fillLoginForm(page);
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.getByRole('button', { name: 'Signing In...' })).toBeDisabled();
    await page.getByRole('button', { name: 'Signing In...' }).click({ force: true });
    expect(loginRequests).toBe(1);

    resolveLogin();
    await expect(page).toHaveURL(/\/products$/);
  });

  test('TC-029 Previous error message clears on a new submit attempt', async ({ page }) => {
    let attempt = 0;

    await page.route('**/api/login', async (route) => {
      attempt += 1;

      if (attempt === 1) {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Invalid email or password.' }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Login successful.',
          token: 'token-123',
          user: { id: 1, email: 'admin@apple.com' },
        }),
      });
    });

    await page.route('**/api/bootstrap/tables', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'ok',
          tables: { product: { count: sampleProducts.length, sample: sampleProducts } },
        }),
      });
    });

    await page.goto('/');
    await fillLoginForm(page, 'wrongpass');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByText('Invalid email or password.')).toBeVisible();

    await fillLoginForm(page, 'admin');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByText('Invalid email or password.')).toBeHidden();
    await expect(page).toHaveURL(/\/products$/);
  });

  test('TC-030 Login form does not ship with real credentials pre-filled', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByLabel('Email')).toHaveValue('');
    await expect(page.getByLabel('Password')).toHaveValue('');
  });

  test('TC-031 Successful login auto-redirects without manual navigation', async ({ page }) => {
    await mockSuccessfulLogin(page);
    await page.goto('/');
    await fillLoginForm(page);
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page).toHaveURL(/\/products$/);
  });

  test('TC-032 Already-authenticated user visiting /login is redirected to /products', async ({ page }) => {
    await mockSuccessfulLogin(page);
    await page.addInitScript(() => {
      window.localStorage.setItem('ims.authToken', 'token-123');
    });

    await page.goto('/login');

    await expect(page).toHaveURL(/\/products$/);
  });

  test('TC-033 Unauthenticated user cannot reach /products via direct URL', async ({ page }) => {
    await page.goto('/products');

    await expect(page).toHaveURL(/\/login$/);
  });

  test('TC-034 Authenticated session survives a full page refresh', async ({ page }) => {
    await mockSuccessfulLogin(page);
    await page.addInitScript(() => {
      window.localStorage.setItem('ims.authToken', 'token-123');
    });

    await page.goto('/products');
    await expect(page).toHaveURL(/\/products$/);
    await page.reload();
    await expect(page).toHaveURL(/\/products$/);
    await expect(page.getByRole('heading', { name: 'Product Management Area' })).toBeVisible();
  });

  test('TC-035 Logout clears session and blocks further product access', async ({ page }) => {
    await mockSuccessfulLogin(page);
    await page.addInitScript(() => {
      window.localStorage.setItem('ims.authToken', 'token-123');
    });

    await page.goto('/products');
    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.goto('/products');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('TC-036 Unknown route falls back based on auth state', async ({ page }) => {
    await page.goto('/does-not-exist');

    await expect(page).toHaveURL(/\/login$/);
  });

  test('TC-041 Product data shown after login matches backend data', async ({ page }) => {
    await mockSuccessfulLogin(page);
    await page.goto('/');
    await fillLoginForm(page);
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.locator('tbody tr')).toHaveCount(2);
    await expect(page.locator('tbody tr').nth(0)).toContainText('1');
    await expect(page.locator('tbody tr').nth(0)).toContainText('Keyboard');
    await expect(page.locator('tbody tr').nth(0)).toContainText('49.99');
    await expect(page.locator('tbody tr').nth(0)).toContainText('4');
    await expect(page.locator('tbody tr').nth(1)).toContainText('2');
    await expect(page.locator('tbody tr').nth(1)).toContainText('Mouse');
    await expect(page.locator('tbody tr').nth(1)).toContainText('19.99');
    await expect(page.locator('tbody tr').nth(1)).toContainText('10');
  });
});
