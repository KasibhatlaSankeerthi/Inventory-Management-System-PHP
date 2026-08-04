import { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ProductsPage from './pages/ProductsPage';

function LoginRoute({ onAuthenticated }) {
  const navigate = useNavigate();

  function handleLoginSuccess(user) {
    onAuthenticated(user);
    navigate('/products', { replace: true });
  }

  return <LoginPage onLoginSuccess={handleLoginSuccess} />;
}

export default function App() {
  const [user, setUser] = useState(null);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginRoute onAuthenticated={setUser} />} />
        <Route path="/products" element={<ProductsPage user={user} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
