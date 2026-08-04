import { useEffect, useState } from 'react';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001/api';
const authTokenStorageKey = 'ims.authToken';
const loginPath = '/';
const productPath = '/products';

function getStoredToken() {
  return window.localStorage.getItem(authTokenStorageKey) || '';
}

function setStoredToken(token) {
  if (token) {
    window.localStorage.setItem(authTokenStorageKey, token);
    return;
  }

  window.localStorage.removeItem(authTokenStorageKey);
}

async function readJson(response) {
  return response.json().catch(() => ({}));
}

function getPathname() {
  return window.location.pathname === productPath ? productPath : loginPath;
}

function navigate(pathname) {
  if (window.location.pathname !== pathname) {
    window.history.pushState({}, '', pathname);
  }
}

export default function App() {
  const [route, setRoute] = useState(getPathname);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [authToken, setAuthToken] = useState(getStoredToken);
  const [currentUser, setCurrentUser] = useState(null);
  const [productPreview, setProductPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRestoringSession, setIsRestoringSession] = useState(Boolean(getStoredToken()));
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handlePopState = () => {
      setRoute(getPathname());
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    if (route === productPath && !authToken && !isRestoringSession) {
      navigate(loginPath);
      setRoute(loginPath);
    }
  }, [authToken, isRestoringSession, route]);

  useEffect(() => {
    let isCancelled = false;

    async function restoreSession() {
      if (!authToken) {
        setCurrentUser(null);
        setProductPreview(null);
        setIsRestoringSession(false);
        return;
      }

      setIsRestoringSession(true);

      try {
        const response = await fetch(`${apiBaseUrl}/session`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        const data = await readJson(response);

        if (!response.ok) {
          throw new Error(data.message || 'Unable to restore your session.');
        }

        if (!isCancelled) {
          setCurrentUser(data.user);
        }
      } catch (error) {
        if (!isCancelled) {
          setStoredToken('');
          setAuthToken('');
          setCurrentUser(null);
          setProductPreview(null);
          setErrorMessage(error.message || 'Your session ended. Please sign in again.');
          navigate(loginPath);
          setRoute(loginPath);
        }
      } finally {
        if (!isCancelled) {
          setIsRestoringSession(false);
        }
      }
    }

    restoreSession();

    return () => {
      isCancelled = true;
    };
  }, [authToken]);

  useEffect(() => {
    let isCancelled = false;

    async function loadProtectedPreview() {
      if (route !== productPath || !authToken || !currentUser) {
        setProductPreview(null);
        setIsLoadingProducts(false);
        return;
      }

      setIsLoadingProducts(true);

      try {
        const response = await fetch(`${apiBaseUrl}/bootstrap/tables`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        const data = await readJson(response);

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load protected product data.');
        }

        if (!isCancelled) {
          setProductPreview(data.tables.product.sample);
          setErrorMessage('');
        }
      } catch (error) {
        if (!isCancelled) {
          setProductPreview(null);
          setErrorMessage(error.message || 'Unable to load protected product data.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingProducts(false);
        }
      }
    }

    loadProtectedPreview();

    return () => {
      isCancelled = true;
    };
  }, [authToken, currentUser, route]);

  async function handleSubmit(event) {
    event.preventDefault();
    const email = credentials.email.trim();
    const password = credentials.password;

    if (!email || !password) {
      setErrorMessage('Email and password are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await fetch(`${apiBaseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await readJson(response);

      if (!response.ok) {
        setErrorMessage(data.message || 'Login failed. Please try again.');
        return;
      }

      setStoredToken(data.token || '');
      setAuthToken(data.token || '');
      setCurrentUser(data.user);
      setCredentials({ email, password: '' });
      navigate(productPath);
      setRoute(productPath);
    } catch {
      setErrorMessage('Unable to reach the login service. Check that the backend is running.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setCredentials((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleLogout() {
    const tokenToClear = authToken;

    setStoredToken('');
    setAuthToken('');
    setCurrentUser(null);
    setProductPreview(null);
    setErrorMessage('');
    navigate(loginPath);
    setRoute(loginPath);

    if (!tokenToClear) {
      return;
    }

    try {
      await fetch(`${apiBaseUrl}/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenToClear}`,
        },
      });
    } catch {
      // The client state is already cleared, so logout can remain local if the request fails.
    }
  }

  if (route === productPath && isRestoringSession) {
    return (
      <main className="app-shell">
        <section className="status-card">
          <p className="eyebrow">DT-31 Protected Access</p>
          <h1>Restoring session</h1>
          <p className="intro">Checking your saved login before opening the product area.</p>
        </section>
      </main>
    );
  }

  if (route === productPath && authToken && currentUser) {
    return (
      <main className="app-shell">
        <section className="hero-card">
          <div className="card-header">
            <div>
              <p className="eyebrow">DT-31 Protected Access</p>
              <h1>Product Management Area</h1>
            </div>

            <button className="ghost-button" type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
          <p className="intro">
            Signed in as <strong>{currentUser.email}</strong>. This page is the
            protected post-login destination for the upcoming product management work.
          </p>

          <div className="api-panel">
            <span className="api-label">Current route</span>
            <code>{productPath}</code>
          </div>
        </section>

        <section className="status-card">
          <h2>Protected Product Preview</h2>
          <p className="intro">
            This sample product data is requested from a token-protected backend endpoint.
          </p>

          {isLoadingProducts ? <p>Loading protected data...</p> : null}

          {!isLoadingProducts && productPreview?.length ? (
            <div className="table-shell">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {productPreview.map((product) => (
                    <tr key={product.product_id}>
                      <td>{product.product_id}</td>
                      <td>{product.product_name}</td>
                      <td>{product.price}</td>
                      <td>{product.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {!isLoadingProducts && !productPreview?.length ? (
            <p className="muted-message">No protected product records were returned.</p>
          ) : null}

          {errorMessage ? <p className="form-message">{errorMessage}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell auth-shell">
      <section className="hero-card auth-hero">
        <p className="eyebrow">DT-31 Authentication Hardening</p>
        <h1>Inventory Login</h1>
        <p className="intro">
          Sign in with an existing user from the legacy inventory database to
          access the product management area.
        </p>

        <div className="api-panel">
          <span className="api-label">Configured API base URL</span>
          <code>{apiBaseUrl}</code>
        </div>
      </section>

      <section className="status-card auth-card">
        <h2>Sign In</h2>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <input
              autoComplete="email"
              name="email"
              type="email"
              value={credentials.email}
              onChange={handleChange}
              placeholder="admin@apple.com"
              required
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              autoComplete="current-password"
              name="password"
              type="password"
              value={credentials.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </label>

          {errorMessage ? <p className="form-message">{errorMessage}</p> : null}

          <button className="submit-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing In...' : 'Login'}
          </button>
        </form>
      </section>
    </main>
  );
}
