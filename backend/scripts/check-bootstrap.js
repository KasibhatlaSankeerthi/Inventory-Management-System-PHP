import { query } from '../src/db/pool.js';

try {
  const [users, products] = await Promise.all([
    query('SELECT id, email FROM user ORDER BY id ASC LIMIT 1'),
    query('SELECT product_id, product_name FROM product ORDER BY product_id ASC LIMIT 1'),
  ]);

  console.log(
    JSON.stringify({
      ok: true,
      users,
      products,
    }),
  );
} catch (error) {
  console.log(
    JSON.stringify({
      ok: false,
      code: error.code || null,
      message: error.message,
    }),
  );
  process.exitCode = 1;
}
