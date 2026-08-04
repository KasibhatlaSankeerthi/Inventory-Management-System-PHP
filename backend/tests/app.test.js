import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import request from 'supertest';
import { beforeEach, describe, expect, jest, test } from '@jest/globals';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectoryPath = path.dirname(currentFilePath);
const projectRoot = path.resolve(currentDirectoryPath, '..');
const mockQuery = jest.fn();

jest.unstable_mockModule('../src/db/pool.js', () => ({
  query: mockQuery,
}));

const { default: app } = await import('../src/app.js');
const { createSession, clearSessions } = await import('../src/auth/sessionStore.js');

function readBackendFile(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
}

beforeEach(() => {
  mockQuery.mockReset();
  clearSessions();
});

describe('Backend test cases from Test-Cases.csv', () => {
  test('TC-001 Valid credentials return successful login', async () => {
    mockQuery.mockResolvedValueOnce([{ id: 1, email: 'admin@apple.com' }]);

    const response = await request(app).post('/api/login').send({
      email: 'admin@apple.com',
      password: 'admin',
    });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Login successful.');
    expect(response.body.user).toEqual({ id: 1, email: 'admin@apple.com' });
  });

  test('TC-002 Missing email field is rejected', async () => {
    const response = await request(app).post('/api/login').send({ password: 'admin' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Email and password are required.');
    expect(mockQuery).not.toHaveBeenCalled();
  });

  test('TC-003 Missing password field is rejected', async () => {
    const response = await request(app).post('/api/login').send({ email: 'admin@apple.com' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Email and password are required.');
  });

  test('TC-004 Both fields missing are rejected', async () => {
    const response = await request(app).post('/api/login').send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Email and password are required.');
  });

  test('TC-005 Empty-string fields are treated as missing', async () => {
    const response = await request(app).post('/api/login').send({ email: '', password: '' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Email and password are required.');
  });

  test('TC-006 Malformed email format is rejected before DB lookup', async () => {
    const response = await request(app).post('/api/login').send({
      email: 'notanemail',
      password: 'admin',
    });

    expect(response.status).toBe(400);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  test('TC-007 Wrong password for an existing user is rejected', async () => {
    mockQuery.mockResolvedValueOnce([]);

    const response = await request(app).post('/api/login').send({
      email: 'admin@apple.com',
      password: 'wrongpass',
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid email or password.');
  });

  test('TC-008 Non-existent email returns same generic error as wrong password', async () => {
    mockQuery.mockResolvedValueOnce([]);

    const response = await request(app).post('/api/login').send({
      email: 'nouser@example.com',
      password: 'admin',
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid email or password.');
  });

  test('TC-009 Validation errors are distinguishable from auth errors', async () => {
    mockQuery.mockResolvedValueOnce([]);

    const missingFields = await request(app).post('/api/login').send({ password: 'admin' });
    const wrongCredentials = await request(app).post('/api/login').send({
      email: 'admin@apple.com',
      password: 'wrongpass',
    });

    expect(missingFields.status).toBe(400);
    expect(wrongCredentials.status).toBe(401);
  });

  test('TC-010 Successful login response never exposes the password field', async () => {
    mockQuery.mockResolvedValueOnce([{ id: 1, email: 'admin@apple.com' }]);

    const response = await request(app).post('/api/login').send({
      email: 'admin@apple.com',
      password: 'admin',
    });

    expect(response.body.user).toEqual({ id: 1, email: 'admin@apple.com' });
    expect(response.text).not.toMatch(/password/i);
  });

  test('TC-011 SQL injection payloads do not authenticate or crash the server', async () => {
    mockQuery.mockResolvedValueOnce([]);

    const response = await request(app).post('/api/login').send({
      email: "' OR '1'='1",
      password: 'anything',
    });

    expect(response.status).toBe(401);
  });

  test('TC-012 Malformed JSON request body is handled gracefully', async () => {
    const response = await request(app)
      .post('/api/login')
      .set('Content-Type', 'application/json')
      .send('{"email":');

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);
    expect(response.text).not.toMatch(/SyntaxError|stack/i);
  });

  test('TC-013 Database outage returns a generic 503', async () => {
    const error = new Error('connect ECONNREFUSED');
    error.code = 'ECONNREFUSED';
    mockQuery.mockRejectedValueOnce(error);

    const response = await request(app).post('/api/login').send({
      email: 'admin@apple.com',
      password: 'admin',
    });

    expect(response.status).toBe(503);
    expect(response.body.message).toBe(
      'Database request failed. Verify the database server and backend environment settings.',
    );
  });

  test('TC-014 Passwords are not compared or stored as plain text', () => {
    const controllerSource = readBackendFile('src/controllers/bootstrapController.js');

    expect(controllerSource).toMatch(/bcrypt|argon|scrypt|compare/i);
    expect(controllerSource).not.toMatch(/WHERE email = \? AND password = \?/);
  });

  test('TC-015 Successful login issues a session identifier or token', async () => {
    mockQuery.mockResolvedValueOnce([{ id: 1, email: 'admin@apple.com' }]);

    const response = await request(app).post('/api/login').send({
      email: 'admin@apple.com',
      password: 'admin',
    });

    expect(response.status).toBe(200);
    expect(typeof response.body.token).toBe('string');
    expect(response.body.token.length).toBeGreaterThan(0);
  });

  test('TC-016 Leading and trailing whitespace in email is trimmed before lookup', async () => {
    mockQuery.mockResolvedValueOnce([{ id: 1, email: 'admin@apple.com' }]);

    const response = await request(app).post('/api/login').send({
      email: '  admin@apple.com  ',
      password: 'admin',
    });

    expect(response.status).toBe(200);
    expect(mockQuery).toHaveBeenCalledWith(expect.any(String), ['admin@apple.com', 'admin']);
  });

  test('TC-017 Unauthenticated request to a protected endpoint is rejected', async () => {
    const response = await request(app).get('/api/bootstrap/tables');

    expect(response.status).toBe(401);
  });

  test('TC-018 Authenticated request with a valid session reaches product data', async () => {
    const session = createSession({ id: 1, email: 'admin@apple.com' });
    mockQuery.mockResolvedValueOnce([{ id: 1, email: 'admin@apple.com' }]);
    mockQuery.mockResolvedValueOnce([
      { product_id: 1, product_name: 'Keyboard', price: '49.99', quantity: 4 },
    ]);

    const response = await request(app)
      .get('/api/bootstrap/tables')
      .set('Authorization', `Bearer ${session.token}`);

    expect(response.status).toBe(200);
    expect(response.body.tables.product.sample).toEqual([
      { product_id: 1, product_name: 'Keyboard', price: '49.99', quantity: 4 },
    ]);
  });

  test('TC-019 Invalid token on a protected endpoint is rejected', async () => {
    const response = await request(app)
      .get('/api/bootstrap/tables')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(401);
  });

  test('TC-020 Auth middleware is applied consistently across product endpoints', async () => {
    const checks = await Promise.all([
      request(app).get('/api/products'),
      request(app).post('/api/products').send({}),
      request(app).put('/api/products/1').send({}),
      request(app).delete('/api/products/1'),
    ]);

    for (const response of checks) {
      expect(response.status).toBe(401);
    }
  });

  test('TC-021 CORS only allows the configured client origin', async () => {
    const response = await request(app)
      .get('/api/health')
      .set('Origin', 'https://not-the-real-client.example');

    expect(response.headers['access-control-allow-origin']).not.toBe('*');
    expect(response.headers['access-control-allow-origin']).not.toBe(
      'https://not-the-real-client.example',
    );
  });

  test('TC-037 Route files contain no inline SQL or business logic', () => {
    const routeSource = readBackendFile('src/routes/bootstrapRoutes.js');

    expect(routeSource).not.toMatch(/SELECT|INSERT|UPDATE|DELETE/i);
    expect(routeSource).toMatch(/getHealth/);
    expect(routeSource).toMatch(/login/);
  });

  test('TC-038 No hardcoded database credentials or secrets in source', () => {
    const envSource = readBackendFile('src/config/env.js');

    expect(envSource).not.toMatch(/root/);
    expect(envSource).not.toMatch(/inventorymanagement/);
    expect(envSource).not.toMatch(/localhost/);
  });

  test('TC-039 API error responses use a consistent JSON shape', async () => {
    const dbError = new Error('connect ECONNREFUSED');
    dbError.code = 'ECONNREFUSED';
    mockQuery.mockRejectedValueOnce(dbError);

    const badRequest = await request(app).post('/api/login').send({});
    const unauthorized = await request(app).get('/api/bootstrap/tables');
    const unavailable = await request(app).post('/api/login').send({
      email: 'admin@apple.com',
      password: 'admin',
    });

    for (const response of [badRequest, unauthorized, unavailable]) {
      expect(typeof response.body.message).toBe('string');
    }
  });

  test('TC-040 No leftover debug or console statements in committed source', () => {
    const frontendSource = readBackendFile('../frontend/src/App.jsx');
    const backendSourceFiles = [
      'src/app.js',
      'src/server.js',
      'src/controllers/bootstrapController.js',
      'src/routes/bootstrapRoutes.js',
      'src/middleware/requireAuth.js',
      'src/middleware/errorHandler.js',
    ];

    expect(frontendSource).not.toMatch(/console\.(log|debug)/);

    for (const filePath of backendSourceFiles) {
      expect(readBackendFile(filePath)).not.toMatch(/console\.(log|debug)/);
    }
  });
});
