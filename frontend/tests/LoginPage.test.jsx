import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import LoginPage from '../src/pages/LoginPage';
import ProductsPage from '../src/pages/ProductsPage';
import { AuthProvider } from '../src/context/AuthContext';

function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/products" element={<ProductsPage />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

function jsonResponse(status, body) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

beforeEach(() => {
  window.localStorage.clear();
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Login UI (TC-022 .. TC-030)', () => {
  test('TC-022: login page renders required fields and controls', () => {
    renderLoginPage();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  test('TC-023: password field masks input', () => {
    renderLoginPage();
    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('TC-024: empty form submission is blocked client-side (no network request sent)', () => {
    renderLoginPage();
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('TC-025: valid login redirects user to the product page', async () => {
    global.fetch.mockImplementation((url) => {
      if (String(url).endsWith('/login')) {
        return jsonResponse(200, { token: 'jwt-token', user: { id: 1, email: 'admin@apple.com' } });
      }
      return jsonResponse(200, { user: { id: 1, email: 'admin@apple.com' } });
    });

    renderLoginPage();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'admin@apple.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'admin' } });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(screen.getByText(/product management/i)).toBeInTheDocument();
    });
  });

  test('TC-026: invalid credentials show an inline error without navigating away', async () => {
    global.fetch.mockImplementation(() => jsonResponse(401, { message: 'Invalid email or password.' }));

    renderLoginPage();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'admin@apple.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  test('TC-027: backend unreachable shows a distinct network-error message', async () => {
    global.fetch.mockImplementation(() => Promise.reject(new TypeError('Failed to fetch')));

    renderLoginPage();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'admin@apple.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'admin' } });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Unable to reach the backend. Check the API server and try again.'),
      ).toBeInTheDocument();
    });
  });

  test('TC-028: submit control shows a loading state and prevents double-submit', async () => {
    let resolveFetch;
    global.fetch.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = () => resolve({ ok: true, status: 200, json: () => Promise.resolve({ token: 't', user: {} }) });
        }),
    );

    renderLoginPage();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'admin@apple.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'admin' } });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(screen.getByText('Signing In...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();

    resolveFetch();
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
  });

  test('TC-029: previous error message clears on a new submit attempt', async () => {
    global.fetch.mockImplementationOnce(() => jsonResponse(401, { message: 'Invalid email or password.' }));

    renderLoginPage();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'admin@apple.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });

    global.fetch.mockImplementationOnce(() =>
      jsonResponse(200, { token: 't', user: { id: 1, email: 'admin@apple.com' } }),
    );
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'admin' } });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(screen.queryByText(/invalid email or password/i)).not.toBeInTheDocument();
    });
  });

  test('TC-030: login form does not ship with real credentials pre-filled', () => {
    renderLoginPage();
    expect(screen.getByLabelText(/email/i)).toHaveValue('');
    expect(screen.getByLabelText(/password/i)).toHaveValue('');
  });
});
