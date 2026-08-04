import { login } from '../src/controllers/authController.js';
import { query } from '../src/db/pool.js';

function makeRes() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      console.log(JSON.stringify({ statusCode: this.statusCode ?? 200, body: payload }));
      return this;
    },
  };
}

const next = (error) => {
  console.log(JSON.stringify({ error: error?.message || String(error) }));
  process.exitCode = 1;
};

console.log('--- missing password ---');
await login({ body: { email: 'someone@example.com' } }, makeRes(), next);

console.log('--- unknown email ---');
await login({ body: { email: 'does-not-exist@example.com', password: 'anything' } }, makeRes(), next);

const [existingUser] = await query('SELECT email, password FROM user ORDER BY id ASC LIMIT 1');

if (existingUser) {
  console.log('--- wrong password for known email ---');
  await login({ body: { email: existingUser.email, password: `${existingUser.password}-wrong` } }, makeRes(), next);

  console.log('--- correct credentials ---');
  await login({ body: { email: existingUser.email, password: existingUser.password } }, makeRes(), next);
} else {
  console.log(JSON.stringify({ warning: 'No rows in `user` table; skipped known-credential checks.' }));
}

process.exit(process.exitCode ?? 0);
