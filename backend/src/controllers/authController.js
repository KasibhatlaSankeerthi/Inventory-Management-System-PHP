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
    const users = await query('SELECT id, email, password FROM user WHERE email = ? LIMIT 1', [email]);
    const user = users[0];

    if (!user || user.password !== password) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    const token = jwt.sign({ sub: user.id, email: user.email }, env.jwtSecret, {
      expiresIn: env.jwtExpiresIn,
    });

    res.json({
      token,
      user: { id: user.id, email: user.email },
    });
  } catch (error) {
    next(error);
  }
}

export async function getCurrentUser(req, res) {
  res.json({ user: req.user });
}
