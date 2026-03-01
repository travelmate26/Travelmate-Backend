import { Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthenticatedRequest } from '../types';
import type {
  SubmitKycBody,
  VerifyAccountBody,
  FaceVerificationBody,
  VerifyIdBody,
  AdminApproveBody,
  AdminRejectBody,
} from '../validators/kyc';

export async function submitKyc(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const body = req.body as SubmitKycBody;
    await supabaseAdmin.from('kyc_documents').upsert({
      user_id: req.user.id,
      id_type: body.idType,
      id_number: body.idNumber,
      id_front_url: body.idFront,
      id_back_url: body.idBack,
      selfie_url: body.selfie,
      status: 'pending',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    await supabaseAdmin.from('profiles').update({
      kyc_status: 'pending',
      updated_at: new Date().toISOString(),
    }).eq('user_id', req.user.id);
    res.status(200).json({ status: 'pending' });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getKycStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('kyc_status')
      .eq('user_id', req.user.id)
      .single();
    const { data: docs } = await supabaseAdmin
      .from('kyc_documents')
      .select('*')
      .eq('user_id', req.user.id);
    const status = profile?.kyc_status ?? null;
    res.json({
      status,
      reason: null,
      documents: docs ?? [],
    });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function verifyAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const body = req.body as VerifyAccountBody;
    // Placeholder: integrate with Paystack/Flutterwave resolve account
    res.json({
      accountName: 'Account Name',
      bankName: 'Bank Name',
    });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function listBanks(_req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    // Placeholder: return static list or fetch from Paystack/Flutterwave
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

export async function faceVerification(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const _body = req.body as FaceVerificationBody;
    res.json({ status: 'pending' });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function verifyId(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const _body = req.body as VerifyIdBody;
    res.json({ verified: true });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function adminListPending(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { data: pending, error } = await supabaseAdmin
      .from('kyc_documents')
      .select('*, profiles(full_name, user_id)')
      .eq('status', 'pending');
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.json({ pending: pending ?? [] });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function adminApprove(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.params.userId;
    const body = req.body as AdminApproveBody;
    await supabaseAdmin.from('kyc_documents').update({
      status: 'verified',
      admin_notes: body.notes,
      updated_at: new Date().toISOString(),
    }).eq('user_id', userId);
    await supabaseAdmin.from('profiles').update({
      kyc_status: 'verified',
      updated_at: new Date().toISOString(),
    }).eq('user_id', userId);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function adminReject(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.params.userId;
    const body = req.body as AdminRejectBody;
    await supabaseAdmin.from('kyc_documents').update({
      status: 'rejected',
      rejection_reason: body.reason,
      updated_at: new Date().toISOString(),
    }).eq('user_id', userId);
    await supabaseAdmin.from('profiles').update({
      kyc_status: 'rejected',
      updated_at: new Date().toISOString(),
    }).eq('user_id', userId);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
