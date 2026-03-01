import { Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthenticatedRequest } from '../types';
import type {
  FundWalletBody,
  VerifyPaymentBody,
  WithdrawWalletBody,
  TransferWalletBody,
  FreezeWalletBody,
} from '../validators/wallet';

export async function getWallet(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.params.userId === 'me' ? req.user?.id : req.params.userId;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const { data: wallet, error } = await supabaseAdmin
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error && error.code !== 'PGRST116') {
      res.status(400).json({ error: error.message });
      return;
    }
    const balance = wallet?.balance ?? 0;
    res.json({
      balance,
      currency: wallet?.currency ?? 'NGN',
      status: wallet?.status ?? 'active',
    });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.params.userId === 'me' ? req.user?.id : req.params.userId;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const { type, status, from, to, page } = req.query;
    const pageNum = Math.max(1, Number(page) || 1);
    const pageSize = 20;
    let q = supabaseAdmin.from('wallet_transactions').select('*', { count: 'exact' }).eq('user_id', userId);
    if (type) q = q.eq('type', String(type));
    if (status) q = q.eq('status', String(status));
    if (from) q = q.gte('created_at', String(from));
    if (to) q = q.lte('created_at', String(to));
    q = q.order('created_at', { ascending: false }).range((pageNum - 1) * pageSize, pageNum * pageSize - 1);
    const { data: transactions, error, count } = await q;
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.json({ transactions: transactions ?? [], total: count ?? 0 });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function fundWallet(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const body = req.body as FundWalletBody;
    const reference = `fund_${req.user.id}_${Date.now()}`;
    res.json({
      paymentUrl: `https://pay.example.com?amount=${body.amount}&ref=${reference}`,
      reference,
    });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function verifyPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const body = req.body as VerifyPaymentBody;
    const { data: wallet } = await supabaseAdmin
      .from('wallets')
      .select('balance')
      .eq('user_id', req.user.id)
      .single();
    const balance = wallet?.balance ?? 0;
    res.json({
      success: true,
      amount: 0,
      balance,
    });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function withdrawWallet(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const body = req.body as WithdrawWalletBody;
    const { data: transaction, error } = await supabaseAdmin
      .from('wallet_transactions')
      .insert({
        user_id: req.user.id,
        type: 'withdrawal',
        amount: -body.amount,
        status: 'pending',
        metadata: { bankCode: body.bankCode, accountNumber: body.accountNumber },
      })
      .select()
      .single();
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.json({ transaction, status: 'pending' });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function listBanks(_req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const banks = [
      { code: '058', name: 'GTBank' },
      { code: '011', name: 'First Bank' },
      { code: '033', name: 'United Bank for Africa' },
    ];
    res.json({ banks });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function transferWallet(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const body = req.body as TransferWalletBody;
    const { data: transaction, error } = await supabaseAdmin
      .from('wallet_transactions')
      .insert({
        user_id: req.user.id,
        type: 'transfer_out',
        amount: -body.amount,
        status: 'completed',
        metadata: { toUserId: body.toUserId, note: body.note },
      })
      .select()
      .single();
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.json({ transaction });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getStatistics(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.params.userId === 'me' ? req.user?.id : req.params.userId;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const { period } = req.query;
    res.json({
      income: 0,
      expenses: 0,
      chart: [],
      period: period ?? 'month',
    });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function freezeWallet(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.params.userId === 'me' ? req.user?.id : req.params.userId;
    if (!req.user || req.user.id !== userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    const _body = req.body as FreezeWalletBody;
    await supabaseAdmin.from('wallets').update({ status: 'frozen', updated_at: new Date().toISOString() }).eq('user_id', userId);
    res.json({ status: 'frozen' });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function unfreezeWallet(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.params.userId === 'me' ? req.user?.id : req.params.userId;
    if (!req.user || req.user.id !== userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    await supabaseAdmin.from('wallets').update({ status: 'active', updated_at: new Date().toISOString() }).eq('user_id', userId);
    res.json({ status: 'active' });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
