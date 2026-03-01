import { Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthenticatedRequest } from '../types';
import type {
  CreateBookingBody,
  CancelBookingBody,
  PayBookingBody,
  RateBookingBody,
} from '../validators/bookings';

export async function createBooking(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const body = req.body as CreateBookingBody;
    const { data: ride, error: rideError } = await supabaseAdmin
      .from('rides')
      .select('*')
      .eq('id', body.rideId)
      .eq('status', 'active')
      .single();
    if (rideError || !ride) {
      res.status(404).json({ error: 'Ride not found' });
      return;
    }
    if ((ride.available_seats ?? 0) < body.seats) {
      res.status(400).json({ error: 'Not enough seats available' });
      return;
    }
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .insert({
        ride_id: body.rideId,
        rider_id: req.user.id,
        seats: body.seats,
        payment_method: body.paymentMethod,
        status: 'pending',
        total_amount: (ride.price ?? 0) * body.seats,
      })
      .select()
      .single();
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(201).json({
      booking,
      escrow: { status: 'pending', amount: booking.total_amount },
    });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getBooking(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const bookingId = req.params.bookingId;
    const { data: booking, error: bookError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();
    if (bookError || !booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }
    const { data: ride } = await supabaseAdmin.from('rides').select('*').eq('id', booking.ride_id).single();
    const driverId = ride?.driver_id;
    const { data: driver } = driverId
      ? await supabaseAdmin.from('profiles').select('*').eq('user_id', driverId).single()
      : { data: null };
    res.json({ booking, ride: ride ?? null, driver: driver ?? null });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getUserBookings(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.params.userId === 'me' ? req.user?.id : req.params.userId;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const { status, role, page } = req.query;
    const pageNum = Math.max(1, Number(page) || 1);
    const pageSize = 20;
    const from = (pageNum - 1) * pageSize;
    const to = pageNum * pageSize - 1;
    if (role === 'driver') {
      const { data: rides } = await supabaseAdmin.from('rides').select('id').eq('driver_id', userId);
      const rideIds = (rides ?? []).map((r: { id: string }) => r.id);
      if (rideIds.length === 0) {
        res.json({ bookings: [] });
        return;
      }
      let q = supabaseAdmin.from('bookings').select('*').in('ride_id', rideIds);
      if (status) q = q.eq('status', String(status));
      const { data: bookings, error } = await q.order('created_at', { ascending: false }).range(from, to);
      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.json({ bookings: bookings ?? [] });
      return;
    }
    let q = supabaseAdmin.from('bookings').select('*').eq('rider_id', userId);
    if (status) q = q.eq('status', String(status));
    const { data: bookings, error } = await q.order('created_at', { ascending: false }).range(from, to);
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.json({ bookings: bookings ?? [] });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function cancelBooking(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const bookingId = req.params.bookingId;
    const _body = req.body as CancelBookingBody;
    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();
    if (fetchError || !booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }
    if (booking.rider_id !== req.user.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    const { data: updated, error } = await supabaseAdmin
      .from('bookings')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', bookingId)
      .select()
      .single();
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.json({ booking: updated, refund: { status: 'pending' } });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function payBooking(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const bookingId = req.params.bookingId;
    const body = req.body as PayBookingBody;
    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();
    if (fetchError || !booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }
    res.json({
      payment: { id: bookingId, amount: body.amount, method: body.paymentMethod, status: 'completed' },
      escrow: { status: 'held', amount: body.amount },
    });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function completeBooking(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const bookingId = req.params.bookingId;
    const { error } = await supabaseAdmin
      .from('bookings')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', bookingId);
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.json({ success: true, release: { status: 'released' } });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function rateBooking(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const bookingId = req.params.bookingId;
    const body = req.body as RateBookingBody;
    const { data: rating, error } = await supabaseAdmin
      .from('ratings')
      .insert({
        booking_id: bookingId,
        user_id: req.user.id,
        rating: body.rating,
        review: body.review ?? null,
        role: body.role,
      })
      .select()
      .single();
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.json({ rating });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getReceipt(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const bookingId = req.params.bookingId;
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();
    if (error || !booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }
    res.json({
      receipt: {
        bookingId,
        amount: booking.total_amount,
        seats: booking.seats,
        status: booking.status,
      },
      transaction: { id: bookingId, type: 'booking', amount: booking.total_amount },
    });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function confirmPickup(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const bookingId = req.params.bookingId;
    const { error } = await supabaseAdmin
      .from('bookings')
      .update({ pickup_confirmed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', bookingId);
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.json({ status: 'pickup_confirmed' });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function confirmDropoff(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const bookingId = req.params.bookingId;
    const { error } = await supabaseAdmin
      .from('bookings')
      .update({
        dropoff_confirmed_at: new Date().toISOString(),
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.json({ status: 'dropoff_confirmed', completion: true });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
