import { Plan } from '../models/Plan';
/**
 * Fetch Bardetech data plans from the remote API.
 * The API key is required and should be provided via config.bardetech.apiKey.
 * The base URL comes from config.bardetech.baseUrl.
 */
export declare function fetchBardetechPlansFromApi(): Promise<Plan[]>;
/**
 * Load Bardetech data plans. Prefer the remote API when the API key is configured.
 * Falls back to the local JSON file for development environments without credentials.
 */
export declare function getBardetechPlans(): Promise<Plan[]>;
/**
 * Purchase a Bardetech data bundle.
 */
export declare function purchaseBardetechData(params: {
    networkId: number | string;
    planId: string;
    mobileNumber: string;
    portedNumber?: boolean;
    requestId?: string;
}): Promise<any>;
//# sourceMappingURL=bardetech.d.ts.map