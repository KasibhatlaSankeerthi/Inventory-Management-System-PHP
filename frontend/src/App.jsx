const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

const setupItems = [
  'React app scaffolded with Vite',
  'Environment template added for frontend API configuration',
  'Backend diagnostics endpoints available for MySQL verification',
];

export default function App() {
  return (
    <main className="app-shell">
      <section className="hero-card">
        <p className="eyebrow">DT-15 Project Setup</p>
        <h1>Inventory Management UI</h1>
        <p className="intro">
          The React frontend is ready for the authentication and product management
          migration work.
        </p>

        <div className="api-panel">
          <span className="api-label">Configured API base URL</span>
          <code>{apiBaseUrl}</code>
        </div>
      </section>

      <section className="status-card">
        <h2>Bootstrap Status</h2>
        <ul>
          {setupItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
