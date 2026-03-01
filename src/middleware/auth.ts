import { Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthenticatedRequest } from '../types';

/**
 * Extracts Bearer token from Authorization header or body.token and
 * verifies with Supabase. Attaches user and accessToken to request.
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token =
    (req.headers.authorization?.replace(/^Bearer\s+/i, '') as string) ||
    (req.body?.token as string);

  if (!token) {
    res.status(401).json({ error: 'Missing or invalid token' });
    return;
  }

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  req.user = user;
  req.accessToken = token;
  next();
}

/**
 * Optional auth: if token present and valid, attach user; otherwise continue.
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token =
    req.headers.authorization?.replace(/^Bearer\s+/i, '') ||
    (req.body?.token as string);

  if (!token) {
    next();
    return;
  }

  const {
    data: { user },
  } = await supabaseAdmin.auth.getUser(token);

  if (user) {
    req.user = user;
    req.accessToken = token;
  }
  next();
}

/**
 * Requires authenticated user with admin role (from profiles).
 */
export async function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('user_id', req.user.id)
    .single();
  if (error || !profile || profile.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}
