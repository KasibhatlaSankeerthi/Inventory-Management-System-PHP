import app from '../src/app.js';
import { getPool } from '../src/db/pool.js';

const server = app.listen(0);
await new Promise((resolve) => server.once('listening', resolve));
const baseUrl = `http://127.0.0.1:${server.address().port}/api`;

async function postLogin(body) {
  const response = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return { status: response.status, body: await response.json() };
}

const cases = [
  { name: 'valid credentials', body: { email: 'admin@apple.com', password: 'admin' }, expect: 200 },
  { name: 'wrong password', body: { email: 'admin@apple.com', password: 'wrong' }, expect: 401 },
  { name: 'unknown email', body: { email: 'ghost@apple.com', password: 'admin' }, expect: 401 },
  { name: 'sql injection attempt', body: { email: "' OR '1'='1", password: 'x' }, expect: 401 },
  { name: 'missing fields', body: {}, expect: 401 },
];

const results = [];

try {
  for (const testCase of cases) {
    const { status, body } = await postLogin(testCase.body);
    results.push({
      case: testCase.name,
      status,
      expected: testCase.expect,
      passed: status === testCase.expect && !('password' in (body.user ?? {})),
      body,
    });
  }

  const ok = results.every((result) => result.passed);
  console.log(JSON.stringify({ ok, results }, null, 2));
  process.exitCode = ok ? 0 : 1;
} catch (error) {
  console.log(JSON.stringify({ ok: false, code: error.code || null, message: error.message }));
  process.exitCode = 1;
} finally {
  server.close();
  await getPool().end();
}
