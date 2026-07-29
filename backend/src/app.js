import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import bootstrapRoutes from './routes/bootstrapRoutes.js';

const app = express();

app.use(
  cors({
    origin: env.clientOrigin,
  }),
);
app.use(express.json());

app.use('/api', authRoutes);
app.use('/api', bootstrapRoutes);

app.use(errorHandler);

export default app;
