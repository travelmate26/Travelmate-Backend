import { Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthenticatedRequest } from '../types';
import type { BuyAirtimeBody, BuyDataBody, PayElectricityBody, VerifyMeterBody } from '../validators/bills';

export async function listServices(_req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const airtime = [{ id: 'mtn', name: 'MTN' }, { id: 'airtel', name: 'Airtel' }, { id: 'glo', name: 'Glo' }, { id: '9mobile', name: '9mobile' }];
    const data = [...airtime];
    const electricity = [{ id: 'eko', name: 'Eko Electric' }, { id: 'ikedc', name: 'IKEDC' }, { id: 'kaedco', name: 'KAEDCO' }];
    res.json({ airtime, data, electricity });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function listProviders(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { service } = req.query;
    const providers = service
      ? [{ id: String(service), name: String(service) }]
      : [{ id: 'mtn', name: 'MTN' }, { id: 'airtel', name: 'Airtel' }, { id: 'glo', name: 'Glo' }];
    res.json({ providers });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function buyAirtime(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const body = req.body as BuyAirtimeBody;
    const { data: transaction, error } = await supabaseAdmin
      .from('bill_transactions')
      .insert({
        user_id: req.user.id,
        type: 'airtime',
        phone: body.phone,
        network: body.network,
        amount: body.amount,
        status: 'pending',
        metadata: {},
      })
      .select()
      .single();
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(201).json({ transaction, status: 'pending' });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function buyData(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const body = req.body as BuyDataBody;
    const { data: transaction, error } = await supabaseAdmin
      .from('bill_transactions')
      .insert({
        user_id: req.user.id,
        type: 'data',
        phone: body.phone,
        network: body.network,
        amount: body.amount,
        status: 'pending',
        metadata: { plan: body.plan },
      })
      .select()
      .single();
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(201).json({ transaction, status: 'pending' });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function payElectricity(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const body = req.body as PayElectricityBody;
    const { data: transaction, error } = await supabaseAdmin
      .from('bill_transactions')
      .insert({
        user_id: req.user.id,
        type: 'electricity',
        amount: body.amount,
        status: 'pending',
        metadata: { meterNumber: body.meterNumber, provider: body.provider, meterType: body.meterType },
      })
      .select()
      .single();
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(201).json({ transaction, status: 'pending' });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getDataPlans(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { network } = req.query;
    const plans = network
      ? [{ id: `${network}-1gb`, name: '1GB', amount: 500 }, { id: `${network}-2gb`, name: '2GB', amount: 1000 }]
      : [{ id: '1gb', name: '1GB', amount: 500 }, { id: '2gb', name: '2GB', amount: 1000 }, { id: '5gb', name: '5GB', amount: 2000 }];
    res.json({ plans });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getBillHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.params.userId === 'me' ? req.user?.id : req.params.userId;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const { data: bills, error } = await supabaseAdmin
      .from('bill_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.json({ bills: bills ?? [] });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function verifyMeter(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const body = req.body as VerifyMeterBody;
    res.json({
      customerName: 'Customer Name',
      address: 'Meter Address',
    });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
