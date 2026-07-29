import cors from 'cors';
import express from 'express';
import authRoutes from './routes/authRoutes.js';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import bootstrapRoutes from './routes/bootstrapRoutes.js';
import productRoutes from './routes/productRoutes.js';

const app = express();

app.use(
  cors({
    origin: env.clientOrigin,
  }),
);
app.use(express.json());

app.use('/api', bootstrapRoutes);
app.use('/api', authRoutes);
app.use('/api', productRoutes);

app.use(errorHandler);

export default app;
