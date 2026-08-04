import { useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  function handleLoginSuccess(authenticatedUser) {
    setUser(authenticatedUser);
    // replace: true keeps the submitted login form out of session history.
    navigate('/products', { replace: true });
  }

  function handleSignOut() {
    setUser(null);
    navigate('/login', { replace: true });
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
      <Route
        path="/products"
        element={<ProductsPage user={user} onSignOut={handleSignOut} />}
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
