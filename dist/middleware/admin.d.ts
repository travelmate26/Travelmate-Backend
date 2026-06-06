import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
/**
 * Middleware to ensure the authenticated user is an admin.
 * Must be used AFTER authMiddleware.
 */
export declare function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=admin.d.ts.map