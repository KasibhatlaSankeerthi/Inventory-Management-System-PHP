import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProductsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <main className="app-shell">
      <section className="hero-card">
        <div className="page-header">
          <div>
            <p className="eyebrow">Product Management</p>
            <h1>Products</h1>
            {user ? <p className="intro">Signed in as {user.email}</p> : null}
          </div>
          <button type="button" onClick={handleLogout}>
            Log out
          </button>
        </div>
        <p className="intro">Product list, add, edit, and delete are covered in the next story.</p>
      </section>
    </main>
  );
}
