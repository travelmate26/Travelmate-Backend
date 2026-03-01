import { Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthenticatedRequest } from '../types';
import type { CreateRideBody, UpdateRideBody, CancelRideBody } from '../validators/rides';

export async function createRide(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const body = req.body as CreateRideBody;
    const { data: ride, error } = await supabaseAdmin
      .from('rides')
      .insert({
        driver_id: req.user.id,
        origin: body.origin,
        destination: body.destination,
        departure_time: body.departureTime,
        available_seats: body.availableSeats,
        price: body.price,
        vehicle_id: body.vehicleId,
        preferences: body.preferences ?? {},
        status: 'active',
      })
      .select()
      .single();
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(201).json({ ride });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getRides(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { origin, destination, date, seats } = req.query;
    let q = supabaseAdmin.from('rides').select('*').eq('status', 'active');
    if (origin) q = q.ilike('origin', String(origin));
    if (destination) q = q.ilike('destination', String(destination));
    if (date) q = q.gte('departure_time', String(date)).lt('departure_time', String(date) + 'T23:59:59');
    if (seats) q = q.gte('available_seats', Number(seats));
    const { data: rides, error } = await q.order('departure_time', { ascending: true });
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.json({ rides: rides ?? [] });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getRideById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const rideId = req.params.rideId;
    const { data: ride, error: rideError } = await supabaseAdmin
      .from('rides')
      .select('*')
      .eq('id', rideId)
      .single();
    if (rideError || !ride) {
      res.status(404).json({ error: 'Ride not found' });
      return;
    }
    const [driver, vehicle] = await Promise.all([
      supabaseAdmin.from('profiles').select('*').eq('user_id', ride.driver_id).single(),
      supabaseAdmin.from('vehicles').select('*').eq('id', ride.vehicle_id).single(),
    ]);
    res.json({
      ride,
      driver: driver.data ?? null,
      vehicle: vehicle.data ?? null,
    });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateRide(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const rideId = req.params.rideId;
    const body = req.body as UpdateRideBody;
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.origin !== undefined) updates.origin = body.origin;
    if (body.destination !== undefined) updates.destination = body.destination;
    if (body.departureTime !== undefined) updates.departure_time = body.departureTime;
    if (body.availableSeats !== undefined) updates.available_seats = body.availableSeats;
    if (body.price !== undefined) updates.price = body.price;
    if (body.vehicleId !== undefined) updates.vehicle_id = body.vehicleId;
    if (body.preferences !== undefined) updates.preferences = body.preferences;
    const { data: ride, error } = await supabaseAdmin
      .from('rides')
      .update(updates)
      .eq('id', rideId)
      .eq('driver_id', req.user.id)
      .select()
      .single();
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    if (!ride) {
      res.status(404).json({ error: 'Ride not found' });
      return;
    }
    res.json({ ride });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function cancelRide(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const rideId = req.params.rideId;
    const _body = req.body as CancelRideBody;
    const { error } = await supabaseAdmin
      .from('rides')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', rideId)
      .eq('driver_id', req.user.id);
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getDriverRides(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.params.userId === 'me' ? req.user?.id : req.params.userId;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const { status, page } = req.query;
    let q = supabaseAdmin.from('rides').select('*').eq('driver_id', userId);
    if (status) q = q.eq('status', String(status));
    q = q.order('departure_time', { ascending: false });
    const pageNum = Math.max(1, Number(page) || 1);
    const pageSize = 20;
    q = q.range((pageNum - 1) * pageSize, pageNum * pageSize - 1);
    const { data: rides, error } = await q;
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.json({ rides: rides ?? [] });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function searchRides(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { origin, dest, date, seats, maxPrice } = req.query;
    let q = supabaseAdmin.from('rides').select('*').eq('status', 'active');
    if (origin) q = q.ilike('origin', String(origin));
    if (dest) q = q.ilike('destination', String(dest));
    if (date) q = q.gte('departure_time', String(date)).lt('departure_time', String(date) + 'T23:59:59');
    if (seats) q = q.gte('available_seats', Number(seats));
    if (maxPrice) q = q.lte('price', Number(maxPrice));
    const { data: rides, error } = await q.order('departure_time', { ascending: true });
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.json({ rides: rides ?? [] });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function repostRide(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const rideId = req.params.rideId;
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('rides')
      .select('*')
      .eq('id', rideId)
      .eq('driver_id', req.user.id)
      .single();
    if (fetchError || !existing) {
      res.status(404).json({ error: 'Ride not found' });
      return;
    }
    const { origin, destination, departure_time, available_seats, price, vehicle_id, preferences } = existing;
    const { data: ride, error } = await supabaseAdmin
      .from('rides')
      .insert({
        driver_id: req.user.id,
        origin,
        destination,
        departure_time,
        available_seats,
        price,
        vehicle_id,
        preferences: preferences ?? {},
        status: 'active',
      })
      .select()
      .single();
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(201).json({ ride });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getRideBookings(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const rideId = req.params.rideId;
    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('ride_id', rideId);
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.json({ bookings: bookings ?? [] });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
