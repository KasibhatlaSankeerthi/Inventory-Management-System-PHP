import { query } from '../db/pool.js';

export async function login(req, res, next) {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required.' });
      return;
    }

    const rows = await query('SELECT id, email FROM user WHERE email = ? AND password = ? LIMIT 1', [
      email,
      password,
    ]);

    if (rows.length === 0) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    const user = rows[0];
    res.status(200).json({ user: { id: user.id, email: user.email } });
  } catch (error) {
    next(error);
  }
}
