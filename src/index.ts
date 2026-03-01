import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { supabaseAdmin } from './config/supabase';
import authRoutes from './routes/auth';
import profileRoutes from './routes/profile';
import kycRoutes from './routes/kyc';
import ridesRoutes from './routes/rides';
import bookingsRoutes from './routes/bookings';
import walletRoutes from './routes/wallet';
import escrowRoutes from './routes/escrow';
import paymentsRoutes from './routes/payments';
import webhooksRoutes from './routes/webhooks';
import chatsRoutes from './routes/chats';
import notificationsRoutes from './routes/notifications';
import trackingRoutes from './routes/tracking';
import emergencyRoutes from './routes/emergency';
import searchChatterRoutes from './routes/searchChatter';
import routeFeedRoutes from './routes/routeFeed';
import billsRoutes from './routes/bills';
import ratingsRoutes from './routes/ratings';
import adminRoutes from './routes/admin';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/kyc', kycRoutes);
app.use('/rides', ridesRoutes);
app.use('/bookings', bookingsRoutes);
app.use('/wallet', walletRoutes);
app.use('/escrow', escrowRoutes);
app.use('/payments', paymentsRoutes);
app.use('/webhooks', webhooksRoutes);
app.use('/chats', chatsRoutes);
app.use('/notifications', notificationsRoutes);
app.use('/tracking', trackingRoutes);
app.use('/emergency', emergencyRoutes);
app.use('/search-chatter', searchChatterRoutes);
app.use('/route-feed', routeFeedRoutes);
app.use('/bills', billsRoutes);
app.use('/ratings', ratingsRoutes);
app.use('/admin', adminRoutes);

app.get('/health', async (_req, res) => {
  try {
    const { error } = await supabaseAdmin.from('profiles').select('id').limit(1).maybeSingle();
    if (error) {
      const hint =
        error.code === '42P01'
          ? 'Run supabase/schema.sql in Supabase SQL Editor to create the profiles table.'
          : 'Check your Supabase project URL and service role key in .env';
      res.status(503).json({ status: 'degraded', error: error.message, hint });
      return;
    }
    res.json({ status: 'ok', database: 'connected' });
  } catch (e) {
    res.status(503).json({
      status: 'error',
      error: e instanceof Error ? e.message : 'Supabase connection failed',
      hint: 'Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env',
    });
  }
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: GET http://localhost:${PORT}/health`);
});
