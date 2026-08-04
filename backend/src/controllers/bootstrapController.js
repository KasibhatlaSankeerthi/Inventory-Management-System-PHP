import { query } from '../db/pool.js';
import { createSession, deleteSession } from '../auth/sessionStore.js';

export async function getHealth(_req, res) {
  res.json({ status: 'ok' });
}

export async function login(req, res, next) {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!email || !password) {
      res.status(400).json({
        message: 'Email and password are required.',
      });
      return;
    }

    const users = await query(
      'SELECT id, email FROM user WHERE email = ? AND password = ? LIMIT 1',
      [email, password],
    );

    if (users.length === 0) {
      res.status(401).json({
        message: 'Invalid email or password.',
      });
      return;
    }

    const session = createSession(users[0]);

    res.json({
      message: 'Login successful.',
      token: session.token,
      user: users[0],
    });
  } catch (error) {
    next(error);
  }
}

export async function getSessionStatus(req, res) {
  res.json({
    user: req.auth.user,
  });
}

export async function logout(req, res) {
  deleteSession(req.auth.token);

  res.json({
    message: 'Logout successful.',
  });
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
