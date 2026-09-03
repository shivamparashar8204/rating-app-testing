import * as functions from 'firebase-functions';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import storeOwnerRoutes from './routes/storeOwner';
import customerRoutes from './routes/customer';
import adminRoutes from './routes/admin';

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

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
