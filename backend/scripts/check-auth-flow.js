import app from '../src/app.js';
import { getPool } from '../src/db/pool.js';

const server = app.listen(0, async () => {
  const { port } = server.address();

  try {
    const loginResponse = await fetch(`http://127.0.0.1:${port}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@apple.com',
        password: 'admin',
      }),
    });

    const loginPayload = await loginResponse.json();

    const productsResponse = await fetch(`http://127.0.0.1:${port}/api/products`);
    const productsPayload = await productsResponse.json();

    console.log(
      JSON.stringify({
        loginStatus: loginResponse.status,
        loginPayload,
        productsStatus: productsResponse.status,
        productsCount: productsPayload.products?.length || 0,
      }),
    );
  } catch (error) {
    console.log(
      JSON.stringify({
        ok: false,
        message: error.message,
      }),
    );
    process.exitCode = 1;
  } finally {
    server.close();
    await getPool().end();
  }
});
