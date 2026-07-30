import { jest } from '@jest/globals';

const mockQuery = jest.fn();

jest.unstable_mockModule('../src/db/pool.js', () => ({
  query: mockQuery,
  getPool: jest.fn(),
}));

const { default: app } = await import('../src/app.js');
const request = (await import('supertest')).default;

beforeEach(() => {
  mockQuery.mockReset();
});

describe('POST /api/login - input validation (TC-002 .. TC-006, TC-012, TC-013)', () => {
  test('TC-002: missing email field is rejected with 400 and no DB query', async () => {
    const res = await request(app).post('/api/login').send({ password: 'admin' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Email and password are required.');
    expect(mockQuery).not.toHaveBeenCalled();
  });

  test('TC-003: missing password field is rejected with 400 and no DB query', async () => {
    const res = await request(app).post('/api/login').send({ email: 'admin@apple.com' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Email and password are required.');
    expect(mockQuery).not.toHaveBeenCalled();
  });

  test('TC-004: both fields missing are rejected with 400', async () => {
    const res = await request(app).post('/api/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Email and password are required.');
    expect(mockQuery).not.toHaveBeenCalled();
  });

  test('TC-005: empty-string fields are treated as missing', async () => {
    const res = await request(app).post('/api/login').send({ email: '', password: '' });
    expect(res.status).toBe(400);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  test('TC-006: malformed email format is rejected before DB lookup', async () => {
    const res = await request(app).post('/api/login').send({ email: 'notanemail', password: 'admin' });
    expect(res.status).toBe(400);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  test('TC-012: malformed JSON request body is handled gracefully (not an unhandled exception)', async () => {
    const res = await request(app)
      .post('/api/login')
      .set('Content-Type', 'application/json')
      .send('{email: (unquoted)');
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  test('TC-013: database outage returns 503 with a generic message, no stack trace leaked', async () => {
    const dbError = new Error('connect ECONNREFUSED 127.0.0.1:3306');
    dbError.code = 'ECONNREFUSED';
    mockQuery.mockRejectedValueOnce(dbError);

    const res = await request(app).post('/api/login').send({ email: 'admin@apple.com', password: 'admin' });
    expect(res.status).toBe(503);
    expect(res.body.message).toBe(
      'Database request failed. Verify the database server and backend environment settings.',
    );
    expect(JSON.stringify(res.body)).not.toMatch(/ECONNREFUSED|at Object|node_modules/);
  });
});
