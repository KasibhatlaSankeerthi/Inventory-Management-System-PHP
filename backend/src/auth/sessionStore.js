import crypto from 'node:crypto';

const sessions = new Map();

export function createSession(user) {
  const token = crypto.randomBytes(24).toString('hex');

  sessions.set(token, {
    token,
    user: {
      id: user.id,
      email: user.email,
    },
    createdAt: Date.now(),
  });

  return sessions.get(token);
}

export function getSession(token) {
  return sessions.get(token) || null;
}

export function deleteSession(token) {
  sessions.delete(token);
}

export function clearSessions() {
  sessions.clear();
}
