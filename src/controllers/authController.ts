import { Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthenticatedRequest } from '../types';
import type {
  SignupBody,
  SigninBody,
  RefreshBody,
  VerifyPhoneBody,
  VerifyOtpBody,
  ResetPasswordBody,
  ChangePasswordBody,
  SwitchRoleBody,
} from '../validators/auth';

const ROLES = ['rider', 'driver', 'admin'] as const;

/** Map Supabase auth errors to clearer API responses */
function authErrorResponse(message: string): { error: string; code?: string } {
  const msg = message.toLowerCase();
  if (msg.includes('invalid') && msg.includes('email')) {
    return {
      error: 'This email address was rejected. Try a different one (e.g. johndoe@gmail.com). Generic addresses like user@... are often blocked.',
      code: 'invalid_email',
    };
  }
  if (msg.includes('rate limit') && msg.includes('email')) {
    return {
      error: 'Email rate limit exceeded. Supabase allows only a few signup/password-reset emails per hour on the default plan. Wait an hour or configure custom SMTP in Supabase Dashboard → Auth → SMTP.',
      code: 'email_rate_limit',
    };
  }
  return { error: message };
}

async function getProfile(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) return null;
  return data;
}

async function ensureProfile(userId: string, email?: string, phone?: string, fullName?: string, role?: string) {
  let profile = await getProfile(userId);
  if (!profile) {
    const { data: inserted } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          user_id: userId,
          full_name: fullName ?? null,
          phone: phone ?? null,
          role: role ?? 'rider',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();
    profile = inserted;
  }
  return profile;
}

export async function signup(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { email, phone, password, role, fullName } = req.body as SignupBody;
    const auth = supabaseAdmin.auth;
    const admin = auth.admin;

    if (email) {
      const { data: createData, error: createError } = await admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, role: role ?? 'rider', phone: phone ?? null },
      });
      if (createError) {
        const errResponse = authErrorResponse(createError.message);
        res.status(errResponse.code === 'email_rate_limit' ? 429 : 400).json(errResponse);
        return;
      }
      const user = createData?.user;
      if (!user) {
        res.status(400).json({ error: 'Sign up failed' });
        return;
      }
      const { data: signInData, error: signInError } = await auth.signInWithPassword({ email, password });
      if (signInError || !signInData?.session) {
        const profile = await ensureProfile(user.id, email, phone ?? undefined, fullName ?? undefined, role);
        res.status(201).json({
          user: { id: user.id, email: user.email, role: profile?.role, fullName: profile?.full_name ?? null },
          token: null,
          refreshToken: null,
          profile: profile ?? undefined,
        });
        return;
      }
      const profile = await ensureProfile(user.id, email, phone ?? undefined, fullName ?? undefined, role);
      res.status(201).json({
        user: { id: user.id, email: user.email, role: profile?.role, fullName: profile?.full_name ?? null },
        token: signInData.session.access_token,
        refreshToken: signInData.session.refresh_token ?? null,
        profile: profile ?? undefined,
      });
      return;
    }

    if (phone) {
      const { data: createData, error: createError } = await admin.createUser({
        phone,
        password,
        phone_confirm: true,
        user_metadata: { full_name: fullName, role: role ?? 'rider' },
      });
      if (createError) {
        res.status(400).json({ error: createError.message });
        return;
      }
      const user = createData?.user;
      if (!user) {
        res.status(400).json({ error: 'Sign up failed' });
        return;
      }
      const { data: signInData, error: signInError } = await auth.signInWithPassword({ phone, password });
      if (signInError || !signInData?.session) {
        const profile = await ensureProfile(user.id, undefined, phone, fullName ?? undefined, role);
        res.status(201).json({
          user: { id: user.id, phone: user.phone, role: profile?.role, fullName: profile?.full_name ?? null },
          token: null,
          refreshToken: null,
          profile: profile ?? undefined,
        });
        return;
      }
      const profile = await ensureProfile(user.id, undefined, phone, fullName ?? undefined, role);
      res.status(201).json({
        user: { id: user.id, phone: user.phone, role: profile?.role, fullName: profile?.full_name ?? null },
        token: signInData.session.access_token,
        refreshToken: signInData.session.refresh_token ?? null,
        profile: profile ?? undefined,
      });
    }
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function signin(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { email, phone, password } = req.body as SigninBody;
    const auth = supabaseAdmin.auth;

    if (email) {
      const { data, error } = await auth.signInWithPassword({ email, password });
      if (error) {
        res.status(401).json({ error: error.message });
        return;
      }
      const profile = await getProfile(data.user.id) ?? await ensureProfile(data.user.id, email);
      res.json({
        user: { id: data.user.id, email: data.user.email, role: profile?.role, fullName: profile?.full_name ?? null },
        token: data.session?.access_token,
        refreshToken: data.session?.refresh_token,
        profile: profile ?? undefined,
      });
      return;
    }

    if (phone) {
      const { data, error } = await auth.signInWithPassword({ phone, password });
      if (error) {
        res.status(401).json({ error: error.message });
        return;
      }
      const profile = await getProfile(data.user.id) ?? await ensureProfile(data.user.id, undefined, phone);
      res.json({
        user: { id: data.user.id, phone: data.user.phone, role: profile?.role, fullName: profile?.full_name ?? null },
        token: data.session?.access_token,
        refreshToken: data.session?.refresh_token,
        profile: profile ?? undefined,
      });
    }
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function signout(req: AuthenticatedRequest, res: Response): Promise<void> {
  const token = req.body?.token ?? req.accessToken;
  if (token) {
    await supabaseAdmin.auth.admin.signOut(token);
  }
  res.json({ success: true });
}

export async function refresh(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { refreshToken } = req.body as RefreshBody;
    const { data, error } = await supabaseAdmin.auth.refreshSession({ refresh_token: refreshToken });
    if (error) {
      res.status(401).json({ error: error.message });
      return;
    }
    res.json({
      token: data.session?.access_token,
      refreshToken: data.session?.refresh_token,
    });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function me(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const profile = await getProfile(req.user.id);
    const kycStatus = profile?.kyc_status ?? 'pending';
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email ?? null,
        phone: req.user.phone ?? null,
        role: profile?.role ?? null,
        fullName: profile?.full_name ?? null,
      },
      profile: profile ?? null,
      kycStatus,
    });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

// In-memory OTP store (use Redis/DB in production)
const otpStore = new Map<string, { otp: string; expires: number }>();
const OTP_TTL_MS = 5 * 60 * 1000;

function generateOtp(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export async function verifyPhone(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { phone } = req.body as VerifyPhoneBody;
    const otp = generateOtp();
    otpStore.set(phone, { otp, expires: Date.now() + OTP_TTL_MS });
    // In production: send OTP via SMS (Twilio, etc.)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV] OTP for ${phone}: ${otp}`);
    }
    res.json({ message: 'OTP sent successfully' });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function verifyOtp(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { phone, otp } = req.body as VerifyOtpBody;
    const stored = otpStore.get(phone);
    if (!stored || stored.expires < Date.now()) {
      res.status(400).json({ error: 'OTP expired or invalid' });
      return;
    }
    if (stored.otp !== otp) {
      res.status(400).json({ error: 'Invalid OTP' });
      return;
    }
    otpStore.delete(phone);
    res.json({ verified: true });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function resetPassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { email } = req.body as ResetPasswordBody;
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: process.env.RESET_PASSWORD_REDIRECT_URL ?? undefined,
    });
    if (error) {
      const errResponse = authErrorResponse(error.message);
      res.status(errResponse.code === 'email_rate_limit' ? 429 : 400).json(errResponse);
      return;
    }
    res.json({ message: 'Password reset email sent' });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const { oldPassword, newPassword } = req.body as ChangePasswordBody;
    const auth = supabaseAdmin.auth;

    let signInRes: Awaited<ReturnType<typeof auth.signInWithPassword>>;
    if (req.user.email) {
      signInRes = await auth.signInWithPassword({ email: req.user.email, password: oldPassword });
    } else if (req.user.phone) {
      signInRes = await auth.signInWithPassword({ phone: req.user.phone, password: oldPassword });
    } else {
      res.status(400).json({ error: 'User has no email or phone' });
      return;
    }

    if (signInRes.error || !signInRes.data?.user) {
      res.status(400).json({ error: 'Current password is incorrect' });
      return;
    }
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(signInRes.data.user.id, {
      password: newPassword,
    });
    if (updateError) {
      res.status(400).json({ error: (updateError as Error).message });
      return;
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function switchRole(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const { role } = req.body as SwitchRoleBody;
    if (!ROLES.includes(role)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('user_id', req.user.id)
      .select()
      .single();
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.json({
      user: { id: req.user.id, email: req.user.email ?? null, phone: req.user.phone ?? null, role, fullName: profile?.full_name ?? null },
      profile: profile ?? undefined,
    });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
