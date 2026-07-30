import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { query } from '../db/pool.js';

export async function login(req, res, next) {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required.' });
    return;
  }

  try {
    const users = await query('SELECT id, email FROM user WHERE email = ? AND password = ? LIMIT 1', [
      email,
      password,
    ]);

    if (users.length === 0) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    const user = users[0];
    const token = jwt.sign({ sub: user.id, email: user.email }, env.jwtSecret, {
      expiresIn: env.jwtExpiresIn,
    });

    res.json({ token, user });
  } catch (error) {
    next(error);
  }
}
