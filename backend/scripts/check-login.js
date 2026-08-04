import { postLogin } from '../src/controllers/authController.js';
import { getPool } from '../src/db/pool.js';

function createRes(label, expectedStatus) {
  return {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      // Only the returned user may leak credentials; the error copy legitimately
      // contains the word "password".
      const passwordLeaked = payload?.user != null && 'password' in payload.user;
      const ok = this.statusCode === expectedStatus && !passwordLeaked;

      if (!ok) {
        process.exitCode = 1;
      }

      console.log(
        JSON.stringify({
          case: label,
          ok,
          expectedStatus,
          statusCode: this.statusCode,
          passwordLeaked,
          body: payload,
        }),
      );

      return this;
    },
  };
}

const cases = [
  ['valid-credentials', { email: 'admin@apple.com', password: 'admin' }, 200],
  ['wrong-password', { email: 'admin@apple.com', password: 'nope' }, 401],
  ['unknown-email', { email: 'nobody@apple.com', password: 'admin' }, 401],
  ['missing-password', { email: 'admin@apple.com' }, 400],
  ['missing-both', {}, 400],
  ['no-body', undefined, 400],
  ["sql-injection-attempt", { email: "admin@apple.com' OR '1'='1", password: "x' OR '1'='1" }, 401],
];

for (const [label, body, expectedStatus] of cases) {
  await postLogin({ body }, createRes(label, expectedStatus), (error) => {
    process.exitCode = 1;
    console.log(
      JSON.stringify({
        case: label,
        ok: false,
        error: error.code || error.message,
      }),
    );
  });
}

await getPool().end();
