import { query } from '../db/pool.js';

export async function listProducts(_req, res, next) {
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

export async function createProduct(req, res, next) {
  try {
    const productName = typeof req.body?.product_name === 'string' ? req.body.product_name.trim() : '';
    const price = Number(req.body?.price);
    const quantity = Number(req.body?.quantity);

    const result = await query(
      'INSERT INTO product (product_name, price, quantity) VALUES (?, ?, ?)',
      [productName, price, quantity],
    );

    res.status(201).json({
      product: {
        product_id: result.insertId,
        product_name: productName,
        price,
        quantity,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProduct(req, res, next) {
  try {
    const productId = Number(req.params.id);
    const productName = typeof req.body?.product_name === 'string' ? req.body.product_name.trim() : '';
    const price = Number(req.body?.price);
    const quantity = Number(req.body?.quantity);

    const result = await query(
      'UPDATE product SET product_name = ?, price = ?, quantity = ? WHERE product_id = ?',
      [productName, price, quantity, productId],
    );

    if (result.affectedRows === 0) {
      res.status(404).json({
        error: 'Product not found.',
      });
      return;
    }

    res.json({
      product: {
        product_id: productId,
        product_name: productName,
        price,
        quantity,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteProduct(req, res, next) {
  try {
    const productId = Number(req.params.id);
    const result = await query('DELETE FROM product WHERE product_id = ?', [productId]);

    if (result.affectedRows === 0) {
      res.status(404).json({
        error: 'Product not found.',
      });
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
