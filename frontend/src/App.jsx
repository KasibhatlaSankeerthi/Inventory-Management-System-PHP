import { useEffect, useState } from 'react';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
const authStorageKey = 'ims-auth-user';

function getCurrentPath() {
  return window.location.pathname === '/products' ? '/products' : '/login';
}

function readStoredUser() {
  try {
    const storedValue = window.localStorage.getItem(authStorageKey);
    return storedValue ? JSON.parse(storedValue) : null;
  } catch {
    window.localStorage.removeItem(authStorageKey);
    return null;
  }
}

function ProductTable({ products, isLoading, loadError, onLogout, userEmail }) {
  return (
    <main className="page-shell">
      <section className="panel panel-wide">
        <div className="panel-header">
          <div>
            <p className="eyebrow">DT-27 Authentication Migration</p>
            <h1>Product Management</h1>
            <p className="muted-text">Signed in as {userEmail}</p>
          </div>

          <button type="button" className="secondary-button" onClick={onLogout}>
            Log out
          </button>
        </div>

        {isLoading ? <p className="status-text">Loading products...</p> : null}
        {loadError ? <p className="error-text">{loadError}</p> : null}

        {!isLoading && !loadError ? (
          <div className="table-wrap">
            <table className="product-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.product_id}>
                    <td>{product.product_id}</td>
                    <td>{product.product_name}</td>
                    <td>{Number(product.price).toLocaleString()}</td>
                    <td>{product.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </main>
  );
}

export default function App() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [authUser, setAuthUser] = useState(readStoredUser);
  const [currentPath, setCurrentPath] = useState(getCurrentPath);
  const [products, setProducts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [productError, setProductError] = useState('');

  useEffect(() => {
    function syncPath() {
      setCurrentPath(getCurrentPath());
    }

    window.addEventListener('popstate', syncPath);

    return () => {
      window.removeEventListener('popstate', syncPath);
    };
  }, []);

  useEffect(() => {
    if (authUser && currentPath !== '/products') {
      window.history.replaceState({}, '', '/products');
      setCurrentPath('/products');
      return;
    }

    if (!authUser && currentPath !== '/login') {
      window.history.replaceState({}, '', '/login');
      setCurrentPath('/login');
    }
  }, [authUser, currentPath]);

  useEffect(() => {
    if (!authUser || currentPath !== '/products') {
      setProducts([]);
      setProductError('');
      return;
    }

    let isMounted = true;

    async function loadProducts() {
      setIsLoadingProducts(true);
      setProductError('');

      try {
        const response = await fetch(`${apiBaseUrl}/products`);
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.message || 'Unable to load products.');
        }

        if (isMounted) {
          setProducts(payload.products || []);
        }
      } catch (error) {
        if (isMounted) {
          setProductError(error.message || 'Unable to load products.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingProducts(false);
        }
      }
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, [authUser, currentPath]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || 'Login failed.');
      }

      window.localStorage.setItem(authStorageKey, JSON.stringify(payload.user));
      setAuthUser(payload.user);
      window.history.pushState({}, '', '/products');
      setCurrentPath('/products');
      setFormData({ email: '', password: '' });
    } catch (error) {
      setErrorMessage(error.message || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleLogout() {
    window.localStorage.removeItem(authStorageKey);
    setAuthUser(null);
    window.history.pushState({}, '', '/login');
    setCurrentPath('/login');
  }

  if (authUser && currentPath === '/products') {
    return (
      <ProductTable
        products={products}
        isLoading={isLoadingProducts}
        loadError={productError}
        onLogout={handleLogout}
        userEmail={authUser.email}
      />
    );
  }

  return (
    <main className="page-shell">
      <section className="panel login-panel">
        <p className="eyebrow">DT-27 Authentication Migration</p>
        <h1>Inventory Login</h1>
        <p className="muted-text">
          Sign in with your inventory account to access the product management area.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="field-group">
            <span>Email</span>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="admin@apple.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="field-group">
            <span>Password</span>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </label>

          {errorMessage ? <p className="error-text">{errorMessage}</p> : null}

          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="api-panel">
          <span className="api-label">Configured API base URL</span>
          <code>{apiBaseUrl}</code>
        </div>
      </section>
    </main>
  );
}
