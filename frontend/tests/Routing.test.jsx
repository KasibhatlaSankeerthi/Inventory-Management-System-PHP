import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import App from '../src/App';
import { AuthProvider } from '../src/context/AuthContext';

function jsonResponse(status, body) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

function NavigateTo({ to }) {
  const navigate = useNavigate();
  return (
    <button type="button" data-testid={`goto-${to}`} onClick={() => navigate(to)}>
      goto {to}
    </button>
  );
}

function renderApp(initialEntries) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        <NavigateTo to="/products" />
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  global.fetch = jest.fn(() => jsonResponse(200, { user: { id: 1, email: 'admin@apple.com' } }));
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Session & routing (TC-031 .. TC-036)', () => {
  test('TC-031: successful login auto-redirects without manual navigation', async () => {
    global.fetch = jest.fn((url) => {
      if (String(url).endsWith('/login')) {
        return jsonResponse(200, { token: 'jwt-token', user: { id: 1, email: 'admin@apple.com' } });
      }
      return jsonResponse(200, { user: { id: 1, email: 'admin@apple.com' } });
    });

    renderApp(['/login']);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'admin@apple.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'admin' } });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => expect(screen.getByText(/product management/i)).toBeInTheDocument());
  });

  test('TC-032: already-authenticated user visiting /login is redirected to /products', async () => {
    window.localStorage.setItem('ims_auth_token', 'jwt-token');
    renderApp(['/login']);

    await waitFor(() => expect(screen.getByText(/product management/i)).toBeInTheDocument());
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
  });

  test('TC-033: unauthenticated user cannot reach /products via direct URL', async () => {
    renderApp(['/products']);

    await waitFor(() => expect(screen.getByLabelText(/email/i)).toBeInTheDocument());
    expect(screen.queryByText(/product management/i)).not.toBeInTheDocument();
  });

  test('TC-034: authenticated session survives a full page refresh (token persisted)', async () => {
    window.localStorage.setItem('ims_auth_token', 'jwt-token');
    // A fresh render with a pre-existing token simulates the post-refresh app boot.
    renderApp(['/products']);

    await waitFor(() => expect(screen.getByText(/product management/i)).toBeInTheDocument());
  });

  test('TC-035: logout clears session and blocks further product access', async () => {
    window.localStorage.setItem('ims_auth_token', 'jwt-token');
    renderApp(['/products']);

    await waitFor(() => expect(screen.getByText(/product management/i)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /log out/i }));

    await waitFor(() => expect(screen.getByLabelText(/email/i)).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('goto-/products'));

    await waitFor(() => expect(screen.getByLabelText(/email/i)).toBeInTheDocument());
    expect(screen.queryByText(/product management/i)).not.toBeInTheDocument();
  });

  test('TC-036: unknown route falls back to /products (authenticated) or /login (unauthenticated)', async () => {
    renderApp(['/does-not-exist']);
    await waitFor(() => expect(screen.getByLabelText(/email/i)).toBeInTheDocument());
  });

  test('TC-036b: unknown route falls back to /products for an authenticated user', async () => {
    window.localStorage.setItem('ims_auth_token', 'jwt-token');
    renderApp(['/does-not-exist']);
    await waitFor(() => expect(screen.getByText(/product management/i)).toBeInTheDocument());
  });
});
