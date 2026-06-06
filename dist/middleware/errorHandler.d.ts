import { Request, Response, NextFunction } from 'express';
export interface ApiError extends Error {
    status?: number;
    code?: string;
}
export declare function errorHandler(err: ApiError, _req: Request, res: Response, _next: NextFunction): void;
//# sourceMappingURL=errorHandler.d.ts.map