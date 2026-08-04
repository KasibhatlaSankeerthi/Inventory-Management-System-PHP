import { query } from '../db/pool.js';

export async function login(req, res, next) {
  try {
    const { email, password } = req.body ?? {};

    const users = await query(
      'SELECT id, email, password FROM user WHERE email = ? LIMIT 1',
      [email ?? null],
    );

    const user = users[0];

    if (!user || user.password !== password) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
}
