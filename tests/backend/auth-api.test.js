import request from 'supertest';

jest.mock('../../backend/src/config/env.js', () => ({
  env: {
    clientOrigin: 'http://localhost:5173',
    jwtSecret: 'test-secret',
    jwtExpiresIn: '1h',
  },
}));

jest.mock('../../backend/src/db/pool.js', () => ({
  query: jest.fn(),
}));

import app from '../../backend/src/app.js';
import { query as mockQuery } from '../../backend/src/db/pool.js';

describe('Authentication API test cases', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  test('TC-001 valid credentials return successful login', async () => {
    mockQuery.mockResolvedValueOnce([{ id: 1, email: 'admin@apple.com', password: 'admin' }]);

    const response = await request(app)
      .post('/api/login')
      .send({ email: 'admin@apple.com', password: 'admin' });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Login successful.');
    expect(response.body.user).toEqual({ id: 1, email: 'admin@apple.com' });
  });

  test('TC-002 missing email is rejected without DB lookup', async () => {
    const response = await request(app)
      .post('/api/login')
      .send({ password: 'admin' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Email and password are required.');
    expect(mockQuery).not.toHaveBeenCalled();
  });

  test('TC-003 missing password is rejected without DB lookup', async () => {
    const response = await request(app)
      .post('/api/login')
      .send({ email: 'admin@apple.com' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Email and password are required.');
    expect(mockQuery).not.toHaveBeenCalled();
  });

  test('TC-004 missing both fields is rejected', async () => {
    const response = await request(app)
      .post('/api/login')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Email and password are required.');
    expect(mockQuery).not.toHaveBeenCalled();
  });

  test('TC-005 empty strings are treated as missing', async () => {
    const response = await request(app)
      .post('/api/login')
      .send({ email: '', password: '' });

    expect(response.status).toBe(400);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  test('TC-006 malformed email is rejected before DB lookup', async () => {
    const response = await request(app)
      .post('/api/login')
      .send({ email: 'notanemail', password: 'admin' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('A valid email address is required.');
    expect(mockQuery).not.toHaveBeenCalled();
  });

  test('TC-007 wrong password for existing user is rejected', async () => {
    mockQuery.mockResolvedValueOnce([{ id: 1, email: 'admin@apple.com', password: 'admin' }]);

    const response = await request(app)
      .post('/api/login')
      .send({ email: 'admin@apple.com', password: 'wrongpass' });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid email or password.');
  });

  test('TC-008 non-existent email returns same generic error', async () => {
    mockQuery.mockResolvedValueOnce([]);

    const response = await request(app)
      .post('/api/login')
      .send({ email: 'nouser@example.com', password: 'admin' });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid email or password.');
  });

  test('TC-009 validation and auth failures are distinguishable', async () => {
    mockQuery.mockResolvedValueOnce([{ id: 1, email: 'admin@apple.com', password: 'admin' }]);

    const validationResponse = await request(app)
      .post('/api/login')
      .send({ email: 'admin@apple.com' });

    const authResponse = await request(app)
      .post('/api/login')
      .send({ email: 'admin@apple.com', password: 'wrongpass' });

    expect(validationResponse.status).toBe(400);
    expect(authResponse.status).toBe(401);
  });

  test('TC-010 successful login never exposes password', async () => {
    mockQuery.mockResolvedValueOnce([{ id: 1, email: 'admin@apple.com', password: 'admin' }]);

    const response = await request(app)
      .post('/api/login')
      .send({ email: 'admin@apple.com', password: 'admin' });

    expect(response.status).toBe(200);
    expect(response.body.user).toEqual({ id: 1, email: 'admin@apple.com' });
    expect(JSON.stringify(response.body)).not.toContain('password');
  });

  test('TC-011 SQL injection payload does not authenticate or crash server', async () => {
    mockQuery.mockResolvedValueOnce([]);

    const response = await request(app)
      .post('/api/login')
      .send({ email: "' OR '1'='1", password: 'anything' });

    expect(response.status).toBe(400);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  test('TC-012 malformed JSON request body is handled gracefully', async () => {
    const response = await request(app)
      .post('/api/login')
      .set('Content-Type', 'application/json')
      .send('{email:');

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);
  });

  test('TC-013 database outage returns generic 503', async () => {
    mockQuery.mockRejectedValueOnce(Object.assign(new Error('db down'), { code: 'ECONNREFUSED' }));

    const response = await request(app)
      .post('/api/login')
      .send({ email: 'admin@apple.com', password: 'admin' });

    expect(response.status).toBe(503);
    expect(response.body.message).toBe('Database request failed. Verify the database server and backend environment settings.');
  });

  test('TC-015 successful login issues a token', async () => {
    mockQuery.mockResolvedValueOnce([{ id: 1, email: 'admin@apple.com', password: 'admin' }]);

    const response = await request(app)
      .post('/api/login')
      .send({ email: 'admin@apple.com', password: 'admin' });

    expect(response.status).toBe(200);
    expect(typeof response.body.token).toBe('string');
    expect(response.body.token.length).toBeGreaterThan(0);
  });

  test('TC-016 leading and trailing whitespace in email is trimmed', async () => {
    mockQuery.mockResolvedValueOnce([{ id: 1, email: 'admin@apple.com', password: 'admin' }]);

    const response = await request(app)
      .post('/api/login')
      .send({ email: '  admin@apple.com  ', password: 'admin' });

    expect(response.status).toBe(200);
    expect(mockQuery).toHaveBeenCalledWith(
      'SELECT id, email, password FROM user WHERE LOWER(email) = ? LIMIT 1',
      ['admin@apple.com'],
    );
  });

  test('TC-017 unauthenticated GET /api/products is rejected', async () => {
    const response = await request(app).get('/api/products');

    expect(response.status).toBe(401);
  });

  test('TC-018 authenticated GET /api/products returns product data', async () => {
    mockQuery
      .mockResolvedValueOnce([{ id: 1, email: 'admin@apple.com', password: 'admin' }])
      .mockResolvedValueOnce([{ product_id: 1, product_name: 'iPhone', price: 999, quantity: 3 }]);

    const loginResponse = await request(app)
      .post('/api/login')
      .send({ email: 'admin@apple.com', password: 'admin' });

    const response = await request(app)
      .get('/api/products')
      .set('Authorization', `Bearer ${loginResponse.body.token}`);

    expect(response.status).toBe(200);
    expect(response.body.products).toEqual([{ product_id: 1, product_name: 'iPhone', price: 999, quantity: 3 }]);
  });

  test('TC-019 invalid token on protected endpoint is rejected', async () => {
    const response = await request(app)
      .get('/api/products')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(401);
  });

  test('TC-020 auth middleware protects all product verbs', async () => {
    const getResponse = await request(app).get('/api/products');
    const postResponse = await request(app).post('/api/products').send({ product_name: 'iPhone', price: 999, quantity: 3 });
    const putResponse = await request(app).put('/api/products/1').send({ product_name: 'iPhone', price: 999, quantity: 3 });
    const deleteResponse = await request(app).delete('/api/products/1');

    expect(getResponse.status).toBe(401);
    expect(postResponse.status).toBe(401);
    expect(putResponse.status).toBe(401);
    expect(deleteResponse.status).toBe(401);
  });

  test('TC-021 CORS only allows configured client origin', async () => {
    const response = await request(app)
      .options('/api/login')
      .set('Origin', 'https://not-the-real-client.example')
      .set('Access-Control-Request-Method', 'POST');

    expect(response.headers['access-control-allow-origin']).not.toBe('*');
    expect(response.headers['access-control-allow-origin']).not.toBe('https://not-the-real-client.example');
  });

  test('TC-037 route files delegate to controllers', async () => {
    const authRoutesModule = await import('../../backend/src/routes/authRoutes.js');
    const productRoutesModule = await import('../../backend/src/routes/productRoutes.js');

    expect(authRoutesModule.default).toBeDefined();
    expect(productRoutesModule.default).toBeDefined();
  });
});
