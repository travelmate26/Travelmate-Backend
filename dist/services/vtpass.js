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
import axios from 'axios';
import { getVtpassConfig } from '../config';
import { supabase } from './supabase';
import { getStoredVtpassMode } from './vtpassConfig';
// ─── Helpers ──────────────────────────────────────────────────────────────────
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
export function generateRequestId() {
    // Get current time in Africa/Lagos timezone (UTC+1)
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    // First 12 chars: YYYYMMDDHHII (year+month+day+hour+minute)
    const datePrefix = `${year}${month}${day}${hour}${min}`; // exactly 12 digits
    // Append random alphanumeric suffix for uniqueness
    const suffix = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `${datePrefix}${suffix}`;
}
/** Map human-friendly network names to VTpass serviceID for airtime */
export const AIRTIME_SERVICE_IDS = {
    mtn: 'mtn',
    airtel: 'airtel',
    glo: 'glo',
    '9mobile': 'etisalat',
    etisalat: 'etisalat',
};
/** Map human-friendly network names to VTpass serviceID for data */
export const DATA_SERVICE_IDS = {
    mtn: 'mtn-data',
    airtel: 'airtel-data',
    glo: 'glo-data',
    '9mobile': 'etisalat-data',
    etisalat: 'etisalat-data',
};
// ─── Client Factory ───────────────────────────────────────────────────────────
/**
 * Build an Axios client pointed at the right VTpass base URL with correct auth headers.
 * - POST requests use: api-key + secret-key
 * - GET  requests use: api-key + public-key
 * Mode is read from the DB (admin toggle) or falls back to .env
 */
async function getVtpassPostClient(modeOverride) {
    const effectiveMode = modeOverride || (await getStoredVtpassMode());
    const cfg = getVtpassConfig(effectiveMode);
    console.log(`[VTpass] mode=${effectiveMode} baseURL=${cfg.baseUrl}`);
    return axios.create({
        baseURL: cfg.baseUrl,
        headers: {
            'api-key': cfg.apiKey,
            'secret-key': cfg.secretKey,
            'Content-Type': 'application/json',
        },
        timeout: 30000,
    });
}
async function getVtpassGetClient(modeOverride) {
    const effectiveMode = modeOverride || (await getStoredVtpassMode());
    const cfg = getVtpassConfig(effectiveMode);
    return axios.create({
        baseURL: cfg.baseUrl,
        headers: {
            'api-key': cfg.apiKey,
            'public-key': cfg.publicKey,
        },
        timeout: 30000,
    });
}
// ─── Electricity services list ────────────────────────────────────────────────
const ELECTRICITY_SERVICES = [
    'ikeja-electric', 'eko-electric', 'abuja-electric', 'kano-electric', 'phed',
    'eedc', 'kedco', 'ibedc', 'jos-electric', 'kaduna-electric', 'benin-electric',
    'aba-electric', 'yola-electric'
];
// ─── API Methods ──────────────────────────────────────────────────────────────
/**
 * Buy airtime for any Nigerian network.
 *
 * Endpoint: POST /pay
 * Payload : { request_id, serviceID, amount, phone }
 */
export async function buyAirtime(params) {
    const client = await getVtpassPostClient();
    const payload = {
        request_id: params.requestId,
        serviceID: params.serviceId,
        amount: params.amount,
        phone: params.phone,
    };
    console.log('[VTpass] buyAirtime payload:', payload);
    const { data } = await client.post('/pay', payload);
    console.log('[VTpass] buyAirtime response:', data);
    return data;
}
/**
 * Buy a data bundle.
 *
 * Endpoint: POST /pay
 * Payload : { request_id, serviceID, billersCode, variation_code, amount, phone }
 */
export async function buyData(params) {
    const client = await getVtpassPostClient();
    const payload = {
        request_id: params.requestId,
        serviceID: params.serviceId,
        billersCode: params.phone,
        variation_code: params.variationCode,
        amount: params.amount,
        phone: params.phone,
    };
    console.log('[VTpass] buyData payload:', payload);
    const { data } = await client.post('/pay', payload);
    console.log('[VTpass] buyData response:', data);
    return data;
}
/**
 * Pay a bill (electricity, cable TV, water, etc.).
 *
 * Endpoint: POST /pay
 */
export async function payBill(params) {
    // Electricity services can have their own mode override stored separately
    let modeOverride;
    if (ELECTRICITY_SERVICES.includes(params.serviceId)) {
        try {
            const { data } = await supabase
                .from('app_settings')
                .select('value')
                .eq('key', 'VTPASS_ELECTRICITY_MODE')
                .single();
            if (data?.value)
                modeOverride = data.value;
        }
        catch (_e) { /* use global mode */ }
    }
    const client = await getVtpassPostClient(modeOverride);
    const payload = {
        request_id: params.requestId,
        serviceID: params.serviceId,
        billersCode: params.billersCode,
        amount: params.amount,
        phone: params.phone,
    };
    if (params.variationCode) {
        payload.variation_code = params.variationCode;
    }
    // Only DSTV and GOtv support subscription_type ('change' | 'renew').
    // StarTimes and Showmax do NOT use this field.
    const tvServicesWithSubType = ['dstv', 'gotv'];
    if (tvServicesWithSubType.includes(params.serviceId)) {
        payload.subscription_type = params.subscriptionType || 'change';
    }
    console.log('[VTpass] payBill payload:', payload);
    const { data } = await client.post('/pay', payload);
    console.log('[VTpass] payBill response:', data);
    return data;
}
/**
 * Get available service variations/plans for a given serviceID.
 * e.g. all data bundles for 'mtn-data', all DSTV bouquets, etc.
 *
 * Endpoint: GET /service-variations?serviceID=...
 * Auth    : api-key + public-key
 */
export async function getServiceVariations(serviceId) {
    const client = await getVtpassGetClient();
    const { data } = await client.get(`/service-variations?serviceID=${serviceId}`);
    return data?.content?.varations ?? [];
}
/**
 * Verify a biller code before payment (e.g. meter number, smartcard number).
 *
 * Endpoint: POST /merchant-verify
 */
export async function verifyBillerCode(params) {
    let modeOverride;
    if (ELECTRICITY_SERVICES.includes(params.serviceId)) {
        try {
            const { data } = await supabase
                .from('app_settings')
                .select('value')
                .eq('key', 'VTPASS_ELECTRICITY_MODE')
                .single();
            if (data?.value)
                modeOverride = data.value;
        }
        catch (_e) { /* use global mode */ }
    }
    const client = await getVtpassPostClient(modeOverride);
    const { data } = await client.post('/merchant-verify', {
        serviceID: params.serviceId,
        billersCode: params.billersCode,
        type: params.type,
    });
    return data?.content ?? {};
}
//# sourceMappingURL=vtpass.js.map