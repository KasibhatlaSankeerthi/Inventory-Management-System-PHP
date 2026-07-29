import { query } from '../db/pool.js';

export async function getProducts(_req, res, next) {
  try {
    const products = await query(
      'SELECT product_id, product_name, price, quantity FROM product ORDER BY product_id ASC',
    );

    res.json({
      products,
    });
  } catch (error) {
    next(error);
  }
}
