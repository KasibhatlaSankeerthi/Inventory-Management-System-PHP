import { Router } from 'express';
import { getBootstrapStatus, getHealth } from '../controllers/bootstrapController.js';

const router = Router();

router.get('/health', getHealth);
router.get('/bootstrap/tables', getBootstrapStatus);

export default router;
