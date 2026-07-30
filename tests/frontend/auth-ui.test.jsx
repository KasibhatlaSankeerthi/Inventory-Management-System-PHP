/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import App from '../../frontend/src/App.jsx';

function renderApp(initialEntries = ['/login']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <App />
    </MemoryRouter>,
  );
}

function mockFetchSequence(...responses) {
  global.fetch = jest.fn();

  responses.forEach((response) => {
    global.fetch.mockResolvedValueOnce({
      ok: response.ok,
      status: response.status,
      json: async () => response.body,
    });
  });
}

describe('Authentication UI test cases', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('TC-022 login page renders required fields and controls', () => {
    renderApp();

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  test('TC-023 password field masks input', () => {
    renderApp();

    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
  });

  test('TC-025 valid login redirects user to the product page', async () => {
    mockFetchSequence(
      {
        ok: true,
        status: 200,
        body: {
          message: 'Login successful.',
          token: 'valid-token',
          user: { id: 1, email: 'admin@apple.com' },
        },
      },
      {
        ok: true,
        status: 200,
        body: { products: [] },
      },
    );

    renderApp();

    fireEvent.change(screen.getByLabelText('Email'), { target: { name: 'email', value: 'admin@apple.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { name: 'password', value: 'admin' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.getByText('Product List')).toBeInTheDocument();
    });
  });

  test('TC-026 invalid credentials show inline error without navigation', async () => {
    mockFetchSequence({
      ok: false,
      status: 401,
      body: { error: 'Invalid email or password.' },
    });

    renderApp();

    fireEvent.change(screen.getByLabelText('Email'), { target: { name: 'email', value: 'admin@apple.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { name: 'password', value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password.')).toBeInTheDocument();
    });

    expect(screen.queryByText('Product List')).not.toBeInTheDocument();
  });

  test('TC-027 backend unreachable shows distinct network error message', async () => {
    global.fetch.mockRejectedValueOnce(new Error('network down'));

    renderApp();

    fireEvent.change(screen.getByLabelText('Email'), { target: { name: 'email', value: 'admin@apple.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { name: 'password', value: 'admin' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.getByText('Unable to reach the backend. Check that the API server is running.')).toBeInTheDocument();
    });
  });

  test('TC-028 submit control shows loading state and prevents double submit', async () => {
    let resolveLogin;
    global.fetch.mockImplementationOnce(
      () => new Promise((resolve) => { resolveLogin = resolve; }),
    );

    renderApp();

    fireEvent.change(screen.getByLabelText('Email'), { target: { name: 'email', value: 'admin@apple.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { name: 'password', value: 'admin' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(screen.getByRole('button', { name: 'Signing in...' })).toBeDisabled();

    resolveLogin({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Invalid email or password.' }),
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    });
  });

  test('TC-029 previous error clears on a new submit attempt', async () => {
    mockFetchSequence(
      {
        ok: false,
        status: 401,
        body: { error: 'Invalid email or password.' },
      },
      {
        ok: true,
        status: 200,
        body: {
          message: 'Login successful.',
          token: 'valid-token',
          user: { id: 1, email: 'admin@apple.com' },
        },
      },
      {
        ok: true,
        status: 200,
        body: { products: [] },
      },
    );

    renderApp();

    fireEvent.change(screen.getByLabelText('Email'), { target: { name: 'email', value: 'admin@apple.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { name: 'password', value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password.')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Password'), { target: { name: 'password', value: 'admin' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.queryByText('Invalid email or password.')).not.toBeInTheDocument();
    });
  });

  test('TC-030 login form does not ship with real credentials pre-filled', () => {
    renderApp();

    expect(screen.getByLabelText('Email')).toHaveValue('');
    expect(screen.getByLabelText('Password')).toHaveValue('');
  });

  test('TC-031 successful login auto-redirects without manual navigation', async () => {
    mockFetchSequence(
      {
        ok: true,
        status: 200,
        body: {
          message: 'Login successful.',
          token: 'valid-token',
          user: { id: 1, email: 'admin@apple.com' },
        },
      },
      {
        ok: true,
        status: 200,
        body: { products: [] },
      },
    );

    renderApp();

    fireEvent.change(screen.getByLabelText('Email'), { target: { name: 'email', value: 'admin@apple.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { name: 'password', value: 'admin' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.getByText('Signed in as')).toBeInTheDocument();
    });
  });

  test('TC-032 authenticated user visiting /login is redirected to /products', async () => {
    window.sessionStorage.setItem('ims-auth-session', JSON.stringify({
      token: 'valid-token',
      user: { id: 1, email: 'admin@apple.com' },
    }));

    mockFetchSequence({
      ok: true,
      status: 200,
      body: { products: [] },
    });

    renderApp(['/login']);

    await waitFor(() => {
      expect(screen.getByText('Product List')).toBeInTheDocument();
    });
  });

  test('TC-033 unauthenticated user cannot reach /products directly', async () => {
    renderApp(['/products']);

    await waitFor(() => {
      expect(screen.getByText('Please sign in to access products.')).toBeInTheDocument();
    });
  });

  test('TC-034 authenticated session survives full page refresh', async () => {
    window.sessionStorage.setItem('ims-auth-session', JSON.stringify({
      token: 'valid-token',
      user: { id: 1, email: 'admin@apple.com' },
    }));

    mockFetchSequence({
      ok: true,
      status: 200,
      body: { products: [] },
    });

    renderApp(['/products']);

    await waitFor(() => {
      expect(screen.getByText('Product List')).toBeInTheDocument();
    });
  });

  test('TC-035 logout clears session and blocks further product access', async () => {
    window.sessionStorage.setItem('ims-auth-session', JSON.stringify({
      token: 'valid-token',
      user: { id: 1, email: 'admin@apple.com' },
    }));

    mockFetchSequence({
      ok: true,
      status: 200,
      body: { products: [] },
    });

    renderApp(['/products']);

    await waitFor(() => {
      expect(screen.getByText('Product List')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Log out' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    });

    expect(window.sessionStorage.getItem('ims-auth-session')).toBeNull();
  });

  test('TC-036 unknown route falls back based on unauthenticated state', async () => {
    renderApp(['/does-not-exist']);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    });
  });
});
