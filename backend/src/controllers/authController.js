import { query } from '../db/pool.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function login(req, res, next) {
  const email = req.body?.email?.trim?.() || '';
  const password = req.body?.password || '';

  if (!email || !password) {
    res.status(400).json({
      message: 'Email and password are required.',
    });
    return;
  }

  if (!emailPattern.test(email)) {
    res.status(400).json({
      message: 'Email must be a valid email address.',
    });
    return;
  }

  try {
    const users = await query('SELECT id, email, password FROM user WHERE email = ? LIMIT 1', [email]);
    const user = users[0];

    if (!user || user.password !== password) {
      res.status(401).json({
        message: 'Invalid email or password.',
      });
      return;
    }

    res.status(200).json({
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
