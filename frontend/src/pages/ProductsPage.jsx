export default function ProductsPage({ user }) {
  return (
    <main className="app-shell">
      <section className="hero-card">
        <p className="eyebrow">DT-30 Product Page</p>
        <h1>Products</h1>
        <p className="intro">
          {user ? `Signed in as ${user.email}.` : 'Signed in.'} The product list table is
          delivered with the Product Management Migration work (DT-37).
        </p>
      </section>
    </main>
  );
}
