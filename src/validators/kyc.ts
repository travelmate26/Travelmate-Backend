import { z } from 'zod';

export const submitKycSchema = z.object({
  idType: z.string().min(1),
  idNumber: z.string().min(1),
  idFront: z.string().min(1),
  idBack: z.string().min(1),
  selfie: z.string().min(1),
});

export const verifyAccountSchema = z.object({
  accountNumber: z.string().min(1),
  bankCode: z.string().min(1),
});

export const faceVerificationSchema = z.object({
  selfie: z.string().min(1),
  livenessData: z.record(z.unknown()).optional(),
});

export const verifyIdSchema = z.object({
  documentType: z.string().min(1),
  documentUrl: z.string().url(),
});

export const adminApproveSchema = z.object({
  notes: z.string().optional(),
});

export const adminRejectSchema = z.object({
  reason: z.string().min(1),
});

export type SubmitKycBody = z.infer<typeof submitKycSchema>;
export type VerifyAccountBody = z.infer<typeof verifyAccountSchema>;
export type FaceVerificationBody = z.infer<typeof faceVerificationSchema>;
export type VerifyIdBody = z.infer<typeof verifyIdSchema>;
export type AdminApproveBody = z.infer<typeof adminApproveSchema>;
export type AdminRejectBody = z.infer<typeof adminRejectSchema>;
