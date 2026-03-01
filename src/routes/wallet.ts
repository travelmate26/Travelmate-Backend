import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  fundWalletSchema,
  verifyPaymentSchema,
  withdrawWalletSchema,
  transferWalletSchema,
  freezeWalletSchema,
} from '../validators/wallet';
import * as walletController from '../controllers/walletController';

const router = Router();

router.get('/banks', walletController.listBanks);
router.post('/fund', requireAuth, validate(fundWalletSchema), walletController.fundWallet);
router.post('/verify-payment', requireAuth, validate(verifyPaymentSchema), walletController.verifyPayment);
router.post('/withdraw', requireAuth, validate(withdrawWalletSchema), walletController.withdrawWallet);
router.post('/transfer', requireAuth, validate(transferWalletSchema), walletController.transferWallet);
router.get('/:userId/transactions', requireAuth, walletController.getTransactions);
router.get('/:userId/statistics', requireAuth, walletController.getStatistics);
router.post('/:userId/freeze', requireAuth, validate(freezeWalletSchema), walletController.freezeWallet);
router.post('/:userId/unfreeze', requireAuth, walletController.unfreezeWallet);
router.get('/:userId', requireAuth, walletController.getWallet);

export default router;
