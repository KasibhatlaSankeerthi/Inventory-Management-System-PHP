import { Navigate, Route, Routes } from 'react-router-dom';
import { isAuthenticated } from './auth';
import LoginPage from './pages/LoginPage';
import ProductsPage from './pages/ProductsPage';

function RequireAuth({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={isAuthenticated() ? '/products' : '/login'} replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/products"
        element={
          <RequireAuth>
            <ProductsPage />
          </RequireAuth>
        }
      />
    </Routes>
  );
}
