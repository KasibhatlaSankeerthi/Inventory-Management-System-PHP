import { useNavigate } from 'react-router-dom';
import { clearToken } from '../auth';

export default function ProductsPage() {
  const navigate = useNavigate();

  function handleLogout() {
    clearToken();
    navigate('/login', { replace: true });
  }

  return (
    <main className="app-shell">
      <section className="hero-card">
        <p className="eyebrow">DT-30 Post-login redirect</p>
        <h1>Products</h1>
        <p className="intro">
          You are signed in. The full product listing arrives with the Product Management
          Migration story.
        </p>
        <button type="button" onClick={handleLogout}>
          Log out
        </button>
      </section>
    </main>
  );
}
