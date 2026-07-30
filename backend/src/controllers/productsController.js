import { query } from '../db/pool.js';

export async function listProducts(_req, res, next) {
  try {
    const products = await query(
      'SELECT product_id, product_name, price, quantity FROM product ORDER BY product_id ASC',
    );
    res.json({ products });
  } catch (error) {
    next(error);
  }
}

export async function createProduct(req, res, next) {
  const { product_name, price, quantity } = req.body ?? {};

  if (!product_name || price === undefined || quantity === undefined) {
    res.status(400).json({ message: 'product_name, price, and quantity are required.' });
    return;
  }

  try {
    const result = await query(
      'INSERT INTO product (product_name, price, quantity) VALUES (?, ?, ?)',
      [product_name, price, quantity],
    );
    res.status(201).json({ product_id: result.insertId, product_name, price, quantity });
  } catch (error) {
    next(error);
  }
}

export async function updateProduct(req, res, next) {
  const { id } = req.params;
  const { product_name, price, quantity } = req.body ?? {};

  if (!product_name || price === undefined || quantity === undefined) {
    res.status(400).json({ message: 'product_name, price, and quantity are required.' });
    return;
  }

  try {
    await query(
      'UPDATE product SET product_name = ?, price = ?, quantity = ? WHERE product_id = ?',
      [product_name, price, quantity, id],
    );
    res.json({ product_id: Number(id), product_name, price, quantity });
  } catch (error) {
    next(error);
  }
}

export async function deleteProduct(req, res, next) {
  const { id } = req.params;

  try {
    await query('DELETE FROM product WHERE product_id = ?', [id]);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
