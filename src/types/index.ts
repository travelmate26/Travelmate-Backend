import { Request } from 'express';
import { User as SupabaseUser } from '@supabase/supabase-js';

export type UserRole = 'rider' | 'driver' | 'admin';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  kyc_status: 'pending' | 'verified' | 'rejected' | null;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface Vehicle {
  id: string;
  user_id: string;
  make: string;
  model: string;
  year: number;
  color: string | null;
  plate: string | null;
  capacity: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface AuthUser {
  id: string;
  email?: string;
  phone?: string;
  role?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: SupabaseUser;
  accessToken?: string;
}

export interface KycStatus {
  status: 'pending' | 'verified' | 'rejected';
  verifiedAt?: string;
}
