import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
const authStorageKey = 'ims-auth-session';

function readStoredSession() {
  const storedValue = window.sessionStorage.getItem(authStorageKey);

  if (!storedValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(storedValue);

    if (!parsedValue?.token || !parsedValue?.user) {
      window.sessionStorage.removeItem(authStorageKey);
      return null;
    }

    return parsedValue;
  } catch {
    window.sessionStorage.removeItem(authStorageKey);
    return null;
  }
}

function ProductPage({ authSession, onLogout, productsError }) {
  return (
    <main className="page-shell product-shell">
      <section className="product-card">
        <div className="product-header">
          <div>
            <p className="eyebrow">Product Management</p>
            <h1>Product List</h1>
            <p className="supporting-copy">
              Authentication is now wired into the React migration. CRUD pages can build on this authenticated entry point.
            </p>
          </div>

          <button type="button" className="secondary-button" onClick={onLogout}>
            Log out
          </button>
        </div>

        <div className="product-panel">
          <span className="api-label">Signed in as</span>
          <strong>{authSession.user.email}</strong>
        </div>

        {productsError ? <p className="form-error">{productsError}</p> : null}
      </section>
    </main>
  );
}

function ProtectedProductRoute({ authSession, onLogout, productsError }) {
  if (!authSession) {
    return <Navigate to="/login" replace state={{ authError: 'Please sign in to access products.' }} />;
  }

  return <ProductPage authSession={authSession} onLogout={onLogout} productsError={productsError} />;
}

function LoginPage({
  apiBaseUrl,
  errorMessage,
  formState,
  isSubmitting,
  onChange,
  onSubmit,
}) {
  return (
    <main className="page-shell">
      <section className="login-layout">
        <div className="brand-panel">
          <p className="eyebrow">DT-27 Authentication Migration</p>
          <h1>Inventory Management System</h1>
          <p className="supporting-copy">
            Sign in to access the product management area and continue the React and Node.js migration.
          </p>

          <div className="api-panel">
            <span className="api-label">Configured API base URL</span>
            <code>{apiBaseUrl}</code>
          </div>
        </div>

        <section className="form-card" aria-label="Login form">
          <h2>Login</h2>
          <p className="form-copy">Use the same email and password stored in the existing `user` table.</p>

          <form className="login-form" onSubmit={onSubmit} noValidate>
            <label className="field-group" htmlFor="email">
              <span>Email</span>
              <input
                id="email"
                name="email"
                type="text"
                autoComplete="email"
                value={formState.email}
                onChange={onChange}
                placeholder="admin@apple.com"
              />
            </label>

            <label className="field-group" htmlFor="password">
              <span>Password</span>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={formState.password}
                onChange={onChange}
                placeholder="Enter your password"
              />
            </label>

            {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}

export default function App() {
  const [formState, setFormState] = useState({ email: '', password: '' });
  const [authSession, setAuthSession] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productsError, setProductsError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setAuthSession(readStoredSession());
  }, []);

  useEffect(() => {
    if (authSession) {
      navigate('/products', { replace: true });
    }
  }, [authSession, navigate]);

  useEffect(() => {
    const routeAuthError = location.state?.authError;

    if (location.pathname === '/login' && routeAuthError) {
      setErrorMessage(routeAuthError);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    let isActive = true;

    async function loadProducts() {
      if (!authSession?.token) {
        setProductsError('');
        return;
      }

      setProductsError('');

      try {
        const response = await fetch(`${apiBaseUrl}/products`, {
          headers: {
            Authorization: `Bearer ${authSession.token}`,
          },
        });

        if (response.status === 401) {
          if (!isActive) {
            return;
          }

          window.sessionStorage.removeItem(authStorageKey);
          setAuthSession(null);
          setProductsError('Your session has expired. Please sign in again.');
          navigate('/login', { replace: true });
          return;
        }

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));

          if (!isActive) {
            return;
          }

          setProductsError(payload.error || payload.message || 'Unable to load product data.');
        }
      } catch {
        if (!isActive) {
          return;
        }

        setProductsError('Unable to load product data. Check that the API server is running.');
      }
    }

    loadProducts();

    return () => {
      isActive = false;
    };
  }, [apiBaseUrl, authSession, navigate]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormState((currentValue) => ({
      ...currentValue,
      [name]: value,
    }));

    if (errorMessage) {
      setErrorMessage('');
    }

    if (productsError) {
      setProductsError('');
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await fetch(`${apiBaseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formState.email,
          password: formState.password,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setErrorMessage(payload.error || payload.message || 'Login failed.');
        return;
      }

      const nextAuthSession = {
        token: payload.token,
        user: payload.user,
      };

      window.sessionStorage.setItem(authStorageKey, JSON.stringify(nextAuthSession));
      setAuthSession(nextAuthSession);
      setProductsError('');
      setFormState({ email: '', password: '' });
      navigate('/products', { replace: true });
    } catch {
      setErrorMessage('Unable to reach the backend. Check that the API server is running.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleLogout() {
    window.sessionStorage.removeItem(authStorageKey);
    setAuthSession(null);
    setErrorMessage('');
    setProductsError('');
    navigate('/login', { replace: true });
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          authSession ? (
            <Navigate to="/products" replace />
          ) : (
            <LoginPage
              apiBaseUrl={apiBaseUrl}
              errorMessage={errorMessage}
              formState={formState}
              isSubmitting={isSubmitting}
              onChange={handleChange}
              onSubmit={handleSubmit}
            />
          )
        }
      />
      <Route
        path="/products"
        element={
          <ProtectedProductRoute
            authSession={authSession}
            onLogout={handleLogout}
            productsError={productsError}
          />
        }
      />
      <Route path="*" element={<Navigate to={authSession ? '/products' : '/login'} replace />} />
    </Routes>
  );
}
