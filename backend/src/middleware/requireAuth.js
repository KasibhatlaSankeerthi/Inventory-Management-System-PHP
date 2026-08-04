import { getSession } from '../auth/sessionStore.js';

function getBearerToken(authorizationHeader) {
  if (typeof authorizationHeader !== 'string') {
    return '';
  }

  const [scheme, token] = authorizationHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return '';
  }

  return token.trim();
}

export function requireAuth(req, res, next) {
  const token = getBearerToken(req.headers.authorization);

  if (!token) {
    res.status(401).json({
      message: 'Authentication is required.',
    });
    return;
  }

  const session = getSession(token);

  if (!session) {
    res.status(401).json({
      message: 'Your session is invalid or has expired. Please sign in again.',
    });
    return;
  }

  req.auth = session;
  next();
}
