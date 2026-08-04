import { Router } from 'express';
import {
  getBootstrapStatus,
  getHealth,
  getSessionStatus,
  login,
  logout,
} from '../controllers/bootstrapController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.get('/health', getHealth);
router.post('/login', login);
router.get('/session', requireAuth, getSessionStatus);
router.post('/logout', requireAuth, logout);
router.get('/bootstrap/tables', requireAuth, getBootstrapStatus);

export default router;
