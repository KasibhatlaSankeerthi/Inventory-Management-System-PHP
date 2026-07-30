import { query } from '../db/pool.js';

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

export async function login(req, res, next) {
  try {
    const email = typeof req.body?.email === 'string' ? normalizeEmail(req.body.email) : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!email || !password) {
      res.status(400).json({
        message: 'Email and password are required.',
      });
      return;
    }

    const users = await query(
      'SELECT id, email, password FROM user WHERE LOWER(email) = ? LIMIT 1',
      [email],
    );

    const user = users[0];

    if (!user || user.password !== password) {
      res.status(401).json({
        message: 'Invalid email or password.',
      });
      return;
    }

    res.json({
      message: 'Login successful.',
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
}
