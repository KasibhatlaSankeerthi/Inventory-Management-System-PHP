import { Router } from 'express';
import { getBootstrapStatus, getHealth, login } from '../controllers/bootstrapController.js';

const router = Router();

router.get('/health', getHealth);
router.get('/bootstrap/tables', getBootstrapStatus);
router.post('/login', login);

export default router;
