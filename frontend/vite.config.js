import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    // The backend CORS allowlist pins CLIENT_ORIGIN to http://localhost:5173, so a
    // silent port bump would break every request. Fail loudly instead.
    port: 5173,
    strictPort: true,
  },
});
