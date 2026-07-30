import request from 'supertest';
import app from '../src/app.js';
import { getPool } from '../src/db/pool.js';

let token;

beforeAll(async () => {
  const res = await request(app).post('/api/login').send({ email: 'admin@apple.com', password: 'admin' });
  token = res.body.token;
});

afterAll(async () => {
  await getPool().end();
});

describe('Access control on /api/products (TC-017 .. TC-020)', () => {
  test('TC-017: unauthenticated request to a protected product endpoint is rejected', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(401);
  });

  test('TC-018: authenticated request with a valid token reaches product data', async () => {
    expect(typeof token).toBe('string');
    const res = await request(app).get('/api/products').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.products)).toBe(true);
  });

  test('TC-019: invalid or expired token on a protected endpoint is rejected', async () => {
    const res = await request(app).get('/api/products').set('Authorization', 'Bearer invalid-token');
    expect(res.status).toBe(401);
  });

  test('TC-020: auth middleware is applied consistently across all product verbs', async () => {
    const get = await request(app).get('/api/products');
    const post = await request(app).post('/api/products').send({});
    const put = await request(app).put('/api/products/1').send({});
    const del = await request(app).delete('/api/products/1');

    expect(get.status).toBe(401);
    expect(post.status).toBe(401);
    expect(put.status).toBe(401);
    expect(del.status).toBe(401);
  });
});
