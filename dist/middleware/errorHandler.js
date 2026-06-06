import { config } from '../config';
export function errorHandler(err, _req, res, _next) {
    const status = err.status ?? 500;
    const message = err.message ?? 'Internal server error';
    console.error(`[Error] ${status}: ${message}`, err);
    res.status(status).json({
        error: {
            status,
            message,
            code: err.code ?? 'INTERNAL_ERROR',
            ...(config.isDev && { details: err.stack }),
        },
    });
}
//# sourceMappingURL=errorHandler.js.map