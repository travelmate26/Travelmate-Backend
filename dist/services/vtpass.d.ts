/**
 * VTpass API Service
 * Docs: https://www.vtpass.com/documentation/api/
 *
 * Auth for POST requests: `api-key` + `secret-key` headers
 * Auth for GET  requests: `api-key` + `public-key` headers
 *
 * Supported:
 *  - Airtime (MTN, Airtel, Glo, 9mobile)
 *  - Data bundles
 *  - Bills (DSTV, PHCN/electricity, water, etc.)
 */
export interface VTpassResponse {
    code: string;
    response_description: string;
    requestId: string;
    amount: string;
    transaction_date?: {
        date: string;
    };
    purchased_code?: string;
    content?: {
        transactions?: {
            status: string;
            product_name: string;
            unique_element: string;
            unit_price: number;
            quantity: number;
            service_verification: null | string;
            channel: string;
            commission: number;
            total_amount: number;
            discount: null | string;
            type: string;
            email: string;
            phone: string;
            name: null | string;
            convinience_fee: string;
            amount: string;
            platform: string;
            method: string;
            transactionId: string;
        };
    };
}
export interface ServiceVariation {
    variation_code: string;
    name: string;
    variation_amount: string;
    fixedPrice: string;
}
/**
 * Generate a unique VTpass Request ID.
 *
 * Rules (from VTpass docs):
 *  - MUST BE 12 CHARACTERS OR MORE
 *  - FIRST 12 CHARACTERS MUST BE NUMERIC
 *  - FIRST 12 CHARACTERS MUST BE TODAY'S DATE in YYYYMMDDHHII format
 *  - Date and Time must be in Africa/Lagos Timezone (GMT+1)
 *
 * Example: "202202071830YUs83meikd"
 */
export declare function generateRequestId(): string;
/** Map human-friendly network names to VTpass serviceID for airtime */
export declare const AIRTIME_SERVICE_IDS: Record<string, string>;
/** Map human-friendly network names to VTpass serviceID for data */
export declare const DATA_SERVICE_IDS: Record<string, string>;
/**
 * Buy airtime for any Nigerian network.
 *
 * Endpoint: POST /pay
 * Payload : { request_id, serviceID, amount, phone }
 */
export declare function buyAirtime(params: {
    serviceId: string;
    phone: string;
    amount: number;
    requestId: string;
}): Promise<VTpassResponse>;
/**
 * Buy a data bundle.
 *
 * Endpoint: POST /pay
 * Payload : { request_id, serviceID, billersCode, variation_code, amount, phone }
 */
export declare function buyData(params: {
    serviceId: string;
    variationCode: string;
    phone: string;
    amount: number;
    requestId: string;
}): Promise<VTpassResponse>;
/**
 * Pay a bill (electricity, cable TV, water, etc.).
 *
 * Endpoint: POST /pay
 */
export declare function payBill(params: {
    serviceId: string;
    variationCode?: string;
    billersCode: string;
    amount: number;
    phone: string;
    requestId: string;
    subscriptionType?: string;
}): Promise<VTpassResponse>;
/**
 * Get available service variations/plans for a given serviceID.
 * e.g. all data bundles for 'mtn-data', all DSTV bouquets, etc.
 *
 * Endpoint: GET /service-variations?serviceID=...
 * Auth    : api-key + public-key
 */
export declare function getServiceVariations(serviceId: string): Promise<ServiceVariation[]>;
/**
 * Verify a biller code before payment (e.g. meter number, smartcard number).
 *
 * Endpoint: POST /merchant-verify
 */
export declare function verifyBillerCode(params: {
    serviceId: string;
    billersCode: string;
    type?: string;
}): Promise<{
    name?: string;
    address?: string;
    [key: string]: unknown;
}>;
//# sourceMappingURL=vtpass.d.ts.map