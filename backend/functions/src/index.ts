import * as functions from 'firebase-functions';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth';
import storeOwnerRoutes from './routes/storeOwner';
import customerRoutes from './routes/customer';
import adminRoutes from './routes/admin';

const app = express();

app.use(helmet());

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '10kb' }));

app.get('/health', (_req: express.Request, res: express.Response) => {
  res.json({ status: 'OK', service: 'Firebase Cloud Functions' });
});

app.get('/api', (_req: express.Request, res: express.Response) => {
  res.json({ message: 'Rating App API is running (Firebase)' });
});

app.use('/api/auth', authRoutes);
app.use('/api/store-owner', storeOwnerRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/admin', adminRoutes);

export const api = functions.https.onRequest(app);
