import { Router } from 'express';
import {
  createProduct,
  deleteProduct,
  listProducts,
  updateProduct,
} from '../controllers/productController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.use(requireAuth);
router.get('/products', listProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

export default router;
