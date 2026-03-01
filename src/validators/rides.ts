import { z } from 'zod';

export const createRideSchema = z.object({
  origin: z.string().min(1),
  destination: z.string().min(1),
  departureTime: z.string().datetime().or(z.string().min(1)),
  availableSeats: z.number().int().min(1),
  price: z.number().min(0),
  vehicleId: z.string().min(1),
  preferences: z.record(z.unknown()).optional(),
});

export const updateRideSchema = createRideSchema.partial();

export const cancelRideSchema = z.object({
  reason: z.string().optional(),
});

export type CreateRideBody = z.infer<typeof createRideSchema>;
export type UpdateRideBody = z.infer<typeof updateRideSchema>;
export type CancelRideBody = z.infer<typeof cancelRideSchema>;
