import { query } from '../db/pool.js';

export async function login(req, res, next) {
  const email = req.body?.email?.trim();
  const password = req.body?.password;

  if (!email || !password) {
    res.status(400).json({
      message: 'Email and password are required.',
    });
    return;
  }

  try {
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

    res.json({
      message: 'Login successful.',
      user: users[0],
    });
  } catch (error) {
    next(error);
  }
}
