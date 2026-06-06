import express from 'express';
import cors from 'cors';
import { authMiddleware } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { adminMiddleware } from './middleware/admin.js';
import agoraRoutes from './routes/agora.js';
import authRoutes from './routes/auth';
import walletRoutes from './routes/wallet';
import bookingRoutes from './routes/booking';
import rideRoutes from './routes/ride';
import paymentRoutes, { paystackWebhookHandler } from './routes/payment';
import kycRoutes from './routes/kyc';
import userRoutes from './routes/user';
import chatRoutes from './routes/chat';
import servicesRoutes from './routes/services';
import locationRoutes from './routes/location';
import adminRoutes from './routes/admin';
import vtpassAdmin from './routes/vtpassAdmin';
import configRoutes from './routes/config';
import './services/notification'; // Initialize Firebase Admin SDK on startup
export function createApp() {
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cors());
    app.get('/health', (_req, res) => {
        res.json({ status: 'ok', service: 'TravelMate API', timestamp: new Date().toISOString() });
    });
    // Public
    app.use('/api/auth', authRoutes);
    app.use('/api/config', configRoutes);
    // Webhook (no JWT; verified by Paystack signature)
    app.post('/api/payments/webhook/paystack', paystackWebhookHandler);
    // Agora token endpoint
    app.use('/api/agora', authMiddleware, agoraRoutes);
    app.use('/api/bookings', authMiddleware, bookingRoutes);
    app.use('/api/wallet', authMiddleware, walletRoutes);
    app.use('/api/rides', authMiddleware, rideRoutes);
    app.use('/api/payments', authMiddleware, paymentRoutes);
    app.use('/api/kyc', authMiddleware, kycRoutes);
    app.use('/api/user', authMiddleware, userRoutes);
    app.use('/api/chat', authMiddleware, chatRoutes);
    app.use('/api/services', authMiddleware, servicesRoutes);
    app.use('/api/location', authMiddleware, locationRoutes);
    app.use('/api/admin', authMiddleware, adminMiddleware, adminRoutes);
    app.use('/api/admin/vtpass', authMiddleware, adminMiddleware, vtpassAdmin);
    app.use(errorHandler);
    return app;
}
//# sourceMappingURL=app.js.map