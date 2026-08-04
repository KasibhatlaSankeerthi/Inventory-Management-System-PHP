import { Link } from 'react-router-dom';

export default function ProductsPage({ user, onSignOut }) {
  // Login state is held in memory only until token handling lands, so a refresh or a
  // direct visit to /products arrives here without a user. Route protection is a
  // separate story; this branch just keeps the page from reading a missing user.
  if (!user) {
    return (
      <main className="app-shell">
        <section className="hero-card">
          <h1>Products</h1>
          <p className="intro">You are not signed in.</p>
          <Link className="primary-link" to="/login">
            Go to sign in
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="hero-card">
        <p className="eyebrow">Signed in as {user.email}</p>
        <h1>Products</h1>
        <p className="intro">
          You now have access to the product management area.
        </p>

        <p className="empty-state">
          The product list, along with add, edit, and delete actions, arrives in a
          later story.
        </p>
      </section>

      <section className="status-card">
        <button className="primary-button" type="button" onClick={onSignOut}>
          Sign out
        </button>
      </section>
    </main>
  );
}
