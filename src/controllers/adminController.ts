import { Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthenticatedRequest } from '../types';
import type { UpdateUserStatusBody, UpdateFeesBody } from '../validators/admin';

export async function listUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.json({ users: profiles ?? [] });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getUserDetails(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.params.userId;
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error || !profile) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user: profile });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateUserStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.params.userId;
    const body = req.body as UpdateUserStatusBody;
    const { data: user, error } = await supabaseAdmin
      .from('profiles')
      .update({ status: body.status, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single();
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.json({ user });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function listRides(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { data: rides, error } = await supabaseAdmin
      .from('rides')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.json({ rides: rides ?? [] });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function listBookings(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.json({ bookings: bookings ?? [] });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function listTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { data: transactions, error } = await supabaseAdmin
      .from('wallet_transactions')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.json({ transactions: transactions ?? [] });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function listEscrowIssues(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { data: disputes, error } = await supabaseAdmin
      .from('escrow_disputes')
      .select('*, escrows(*)')
      .eq('status', 'open')
      .order('created_at', { ascending: false });
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.json({ escrow: disputes ?? [] });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function listPendingKyc(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { data: pending, error } = await supabaseAdmin
      .from('kyc_documents')
      .select('*, profiles(full_name, user_id)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.json({ pending: pending ?? [] });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getStatistics(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const [users, rides, bookings] = await Promise.all([
      supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('rides').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('bookings').select('id', { count: 'exact', head: true }),
    ]);
    res.json({
      users: users.count ?? 0,
      rides: rides.count ?? 0,
      bookings: bookings.count ?? 0,
    });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateFees(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const body = req.body as UpdateFeesBody;
    await supabaseAdmin.from('platform_settings').upsert(
      {
        key: 'fees',
        value: { bookingFeePercent: body.bookingFeePercent, platformFeePercent: body.platformFeePercent },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
