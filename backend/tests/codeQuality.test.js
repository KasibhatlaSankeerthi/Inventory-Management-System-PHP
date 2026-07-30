import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import request from 'supertest';
import app from '../src/app.js';
import { getPool } from '../src/db/pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(__dirname, '../src');
const frontendSrcDir = path.resolve(__dirname, '../../frontend/src');

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

afterAll(async () => {
  await getPool().end();
});

describe('Code quality (TC-037 .. TC-040)', () => {
  test('TC-037: route files contain no inline SQL or business logic', () => {
    const routeFiles = ['authRoutes.js', 'productsRoutes.js', 'bootstrapRoutes.js'].map((f) =>
      path.join(srcDir, 'routes', f),
    );
    routeFiles.forEach((file) => {
      const source = readFileSync(file, 'utf8');
      expect(source).not.toMatch(/\b(SELECT|INSERT INTO|UPDATE|DELETE FROM)\b/i);
    });
  });

  test('TC-038: no hardcoded database credentials or secrets in source', () => {
    const envFile = readFileSync(path.join(srcDir, 'config/env.js'), 'utf8');
    // every DB setting must be sourced from process.env, not a literal credential
    expect(envFile).toMatch(/process\.env\.DB_HOST/);
    expect(envFile).toMatch(/process\.env\.DB_USER/);
    expect(envFile).toMatch(/process\.env\.DB_PASSWORD/);
    // guard against an actual literal password/user assigned outside of the process.env fallback chain
    expect(envFile).not.toMatch(/dbPassword:\s*['"][^'"]+['"]/);
  });

  test('TC-039: API error responses use a consistent JSON shape ({ message: string })', async () => {
    const badRequest = await request(app).post('/api/login').send({});
    const unauthorized = await request(app).get('/api/products');

    expect(typeof badRequest.body.message).toBe('string');
    expect(Object.keys(badRequest.body)).toEqual(['message']);

    expect(typeof unauthorized.body.message).toBe('string');
    expect(Object.keys(unauthorized.body)).toEqual(['message']);
  });

  test('TC-040: no leftover debug console statements in committed login-flow source', () => {
    const backendFiles = walk(srcDir).filter((f) => f.endsWith('.js') && !f.endsWith('server.js'));
    const frontendFiles = walk(frontendSrcDir).filter((f) => /\.(js|jsx)$/.test(f));

    const offenders = [...backendFiles, ...frontendFiles].filter((file) => {
      const source = readFileSync(file, 'utf8');
      return /console\.(log|debug)\(/.test(source);
    });

    expect(offenders).toEqual([]);
  });
});
