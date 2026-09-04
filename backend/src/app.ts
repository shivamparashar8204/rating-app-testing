import express from 'express';
import cors from 'cors';
import pool from './config/database';
import authRoutes from './routes/auth';
import storeOwnerRoutes from './routes/storeOwner';
import customerRoutes from './routes/customer';
import adminRoutes from './routes/admin';

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim());

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? allowedOrigins : true,
  credentials: true,
}));
app.use(express.json());

app.get('/health', async (_req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS now');
    const row = result.rows[0];
    res.json({
      status: 'OK',
      database: 'Connected',
      timestamp: row.now,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      status: 'ERROR',
      database: 'Disconnected',
      error: message,
    });
  }
});

app.get('/', (_req, res) => {
  res.json({
    name: 'Rating App API',
    message: 'This is the backend API. The frontend runs separately.',
    endpoints: ['/api', '/api/auth', '/api/customer', '/api/store-owner', '/api/admin', '/health'],
  });
});

app.get('/api', (_req, res) => {
  res.json({ message: 'Rating App API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/store-owner', storeOwnerRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/admin', adminRoutes);

export default app;
