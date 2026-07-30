import { useEffect, useState } from 'react';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
const loginPath = '/';
const productPath = '/products';

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
  const [currentUser, setCurrentUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    if (route === productPath && !currentUser) {
      navigate(loginPath);
      setRoute(loginPath);
    }
  }, [currentUser, route]);

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
        body: JSON.stringify(credentials),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrorMessage(data.message || 'Login failed. Please try again.');
        return;
      }

      setCurrentUser(data.user);
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

  if (route === productPath && currentUser) {
    return (
      <main className="app-shell">
        <section className="hero-card">
          <p className="eyebrow">DT-30 Authentication Redirect</p>
          <h1>Product Management Area</h1>
          <p className="intro">
            Signed in as <strong>{currentUser.email}</strong>. This page is the
            post-login destination for the upcoming product management work.
          </p>

          <div className="api-panel">
            <span className="api-label">Current route</span>
            <code>{productPath}</code>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell auth-shell">
      <section className="hero-card auth-hero">
        <p className="eyebrow">DT-27 Authentication Migration</p>
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
