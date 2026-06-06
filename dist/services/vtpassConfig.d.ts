/**
 * Retrieves the stored VTpass mode from app_settings.
 * Returns 'live' or 'sandbox'. Falls back to env config if not set.
 */
export declare function getStoredVtpassMode(): Promise<string>;
/**
 * Persists the VTpass mode ("live" | "sandbox") in app_settings.
 */
export declare function setStoredVtpassMode(mode: string): Promise<void>;
//# sourceMappingURL=vtpassConfig.d.ts.map