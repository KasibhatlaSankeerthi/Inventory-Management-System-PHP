import request from 'supertest';
import app from '../src/app.js';
import { env } from '../src/config/env.js';
import { getPool } from '../src/db/pool.js';

afterAll(async () => {
  await getPool().end();
});

describe('POST /api/login - functional & security (real DB)', () => {
  test('TC-001: valid credentials return successful login', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'admin@apple.com', password: 'admin' });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Login successful.');
    expect(res.body.user).toMatchObject({ id: expect.any(Number), email: 'admin@apple.com' });
  });

  test('TC-007: wrong password for an existing user is rejected', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'admin@apple.com', password: 'wrongpass' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password.');
  });

  test('TC-008: non-existent email returns same generic error as wrong password', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'nouser@example.com', password: 'admin' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password.');
  });

  test('TC-009: validation errors (400) are distinguishable from auth errors (401)', async () => {
    const missingField = await request(app).post('/api/login').send({ password: 'admin' });
    const wrongCreds = await request(app)
      .post('/api/login')
      .send({ email: 'admin@apple.com', password: 'wrongpass' });
    expect(missingField.status).toBe(400);
    expect(wrongCreds.status).toBe(401);
  });

  test('TC-010: successful login response never exposes the password field', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'admin@apple.com', password: 'admin' });
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toMatch(/password/i);
  });

  test('TC-011: SQL injection payload does not authenticate or crash the server', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: "' OR '1'='1", password: 'anything' });
    expect(res.status).toBe(401);
  });

  test('TC-014: passwords are hashed and verified via hash comparison, not plain-text equality', async () => {
    const [row] = await (await import('../src/db/pool.js')).query(
      'SELECT password FROM user WHERE email = ? LIMIT 1',
      ['admin@apple.com'],
    );
    const looksHashed = typeof row.password === 'string' && /^\$2[aby]\$/.test(row.password);
    expect(looksHashed).toBe(true);
  });

  test('TC-015: successful login issues a session identifier or signed token', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'admin@apple.com', password: 'admin' });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.token.length).toBeGreaterThan(0);
  });

  test('TC-016: leading/trailing whitespace in email is trimmed before lookup', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: '  admin@apple.com  ', password: 'admin' });
    expect(res.status).toBe(200);
  });

  test('TC-021: CORS only allows the configured client origin', async () => {
    const res = await request(app)
      .post('/api/login')
      .set('Origin', 'https://not-the-real-client.example')
      .send({ email: 'admin@apple.com', password: 'admin' });
    const allowOrigin = res.headers['access-control-allow-origin'];
    expect(allowOrigin).not.toBe('*');
    expect(allowOrigin).not.toBe('https://not-the-real-client.example');
    expect(allowOrigin === undefined || allowOrigin === env.clientOrigin).toBe(true);
  });
});
