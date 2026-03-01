import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  submitKycSchema,
  verifyAccountSchema,
  faceVerificationSchema,
  verifyIdSchema,
  adminApproveSchema,
  adminRejectSchema,
} from '../validators/kyc';
import * as kycController from '../controllers/kycController';

const router = Router();

router.post('/submit', requireAuth, validate(submitKycSchema), kycController.submitKyc);
router.get('/status', requireAuth, kycController.getKycStatus);
router.post('/verify-account', validate(verifyAccountSchema), kycController.verifyAccount);
router.get('/banks', kycController.listBanks);
router.post('/face-verification', requireAuth, validate(faceVerificationSchema), kycController.faceVerification);
router.post('/verify-id', requireAuth, validate(verifyIdSchema), kycController.verifyId);

router.get('/admin/pending', requireAuth, requireAdmin, kycController.adminListPending);
router.post('/admin/approve/:userId', requireAuth, requireAdmin, validate(adminApproveSchema), kycController.adminApprove);
router.post('/admin/reject/:userId', requireAuth, requireAdmin, validate(adminRejectSchema), kycController.adminReject);

export default router;
