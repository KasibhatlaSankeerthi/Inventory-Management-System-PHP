import { query } from '../db/pool.js';

export async function getHealth(_req, res) {
  res.json({ status: 'ok' });
}

export async function getBootstrapStatus(_req, res, next) {
  try {
    const [users, products] = await Promise.all([
      query('SELECT id, email FROM user ORDER BY id ASC LIMIT 5'),
      query('SELECT product_id, product_name, price, quantity FROM product ORDER BY product_id ASC LIMIT 5'),
    ]);

    res.json({
      status: 'ok',
      tables: {
        user: {
          count: users.length,
          sample: users,
        },
        product: {
          count: products.length,
          sample: products,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}
