import { query } from '../db/pool.js';
import { env } from '../config/env.js';
import jwt from 'jsonwebtoken';

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

export async function login(req, res, next) {
  try {
    const email = typeof req.body?.email === 'string' ? normalizeEmail(req.body.email) : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!email || !password) {
      res.status(400).json({
        error: 'Email and password are required.',
      });
      return;
    }

    if (!email.includes('@')) {
      res.status(400).json({
        error: 'A valid email address is required.',
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
        error: 'Invalid email or password.',
      });
      return;
    }

    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
      },
      env.jwtSecret,
      {
        expiresIn: env.jwtExpiresIn,
      },
    );

    res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
}
