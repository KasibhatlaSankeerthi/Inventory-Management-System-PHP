import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function requireAuth(req, res, next) {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader?.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Authentication is required.',
    });
    return;
  }

  const token = authorizationHeader.slice('Bearer '.length).trim();

  if (!token) {
    res.status(401).json({
      error: 'Authentication is required.',
    });
    return;
  }

  try {
    req.auth = jwt.verify(token, env.jwtSecret);
    next();
  } catch {
    res.status(401).json({
      error: 'Authentication is required.',
    });
  }
}
