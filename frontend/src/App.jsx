import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
const authStorageKey = 'ims-auth-user';

function readStoredUser() {
  const storedValue = window.sessionStorage.getItem(authStorageKey);

  if (!storedValue) {
    return null;
  }

  try {
    return JSON.parse(storedValue);
  } catch {
    window.sessionStorage.removeItem(authStorageKey);
    return null;
  }
}

function ProductPage({ user, onLogout }) {
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
          <strong>{user.email}</strong>
        </div>

        <div className="product-panel">
          <span className="api-label">Next migration step</span>
          <p>Connect this page to the upcoming product APIs to render the live inventory table.</p>
        </div>
      </section>
    </main>
  );
}

function ProtectedProductRoute({ user, onLogout }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <ProductPage user={user} onLogout={onLogout} />;
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

          <form className="login-form" onSubmit={onSubmit}>
            <label className="field-group" htmlFor="email">
              <span>Email</span>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formState.email}
                onChange={onChange}
                placeholder="admin@apple.com"
                required
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
                required
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
  const [user, setUser] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setUser(readStoredUser());
  }, []);

  useEffect(() => {
    if (user) {
      navigate('/products', { replace: true });
    }
  }, [navigate, user]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormState((currentValue) => ({
      ...currentValue,
      [name]: value,
    }));

    if (errorMessage) {
      setErrorMessage('');
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
        setErrorMessage(payload.message || 'Login failed.');
        return;
      }

      window.sessionStorage.setItem(authStorageKey, JSON.stringify(payload.user));
      setUser(payload.user);
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
    setUser(null);
    setErrorMessage('');
    navigate('/login', { replace: true });
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? (
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
      <Route path="/products" element={<ProtectedProductRoute user={user} onLogout={handleLogout} />} />
      <Route path="*" element={<Navigate to={user ? '/products' : '/login'} replace />} />
    </Routes>
  );
}
