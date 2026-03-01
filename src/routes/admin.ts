import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updateUserStatusSchema, updateFeesSchema } from '../validators/admin';
import * as adminController from '../controllers/adminController';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/users', adminController.listUsers);
router.get('/users/:userId', adminController.getUserDetails);
router.put('/users/:userId/status', validate(updateUserStatusSchema), adminController.updateUserStatus);
router.get('/rides', adminController.listRides);
router.get('/bookings', adminController.listBookings);
router.get('/transactions', adminController.listTransactions);
router.get('/escrow', adminController.listEscrowIssues);
router.get('/kyc/pending', adminController.listPendingKyc);
router.get('/statistics', adminController.getStatistics);
router.post('/fees/update', validate(updateFeesSchema), adminController.updateFees);

export default router;
