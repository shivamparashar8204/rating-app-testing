import express from 'express';
import cors from 'cors';
import pool from './config/database';
import authRoutes from './routes/auth';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', async (_req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      status: 'OK',
      database: 'Connected',
      timestamp: result.rows[0].now,
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

app.get('/api', (_req, res) => {
  res.json({ message: 'Rating App API is running' });
});

app.use('/api/auth', authRoutes);

export default app;
