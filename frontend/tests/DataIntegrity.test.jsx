import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProductsPage from '../src/pages/ProductsPage';
import { AuthProvider } from '../src/context/AuthContext';

function jsonResponse(status, body) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

beforeEach(() => {
  window.localStorage.setItem('ims_auth_token', 'jwt-token');
  global.fetch = jest.fn(() => jsonResponse(200, { user: { id: 1, email: 'admin@apple.com' } }));
});

afterEach(() => {
  jest.restoreAllMocks();
  window.localStorage.clear();
});

describe('Data integrity (TC-041)', () => {
  test('TC-041: product data shown after login matches backend data', async () => {
    global.fetch = jest.fn((url) => {
      if (String(url).includes('/products')) {
        return jsonResponse(200, {
          products: [{ product_id: 1, product_name: 'iPhone 14', price: 100000, quantity: 990 }],
        });
      }
      return jsonResponse(200, { user: { id: 1, email: 'admin@apple.com' } });
    });

    render(
      <MemoryRouter initialEntries={['/products']}>
        <AuthProvider>
          <ProductsPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText(/product management/i)).toBeInTheDocument());

    // Expected per API and Data Mapping: the product table fetched from GET /api/products
    // should be rendered on this page. ProductsPage does not yet fetch or render it.
    await waitFor(() => {
      expect(screen.getByText('iPhone 14')).toBeInTheDocument();
    });
  });
});
