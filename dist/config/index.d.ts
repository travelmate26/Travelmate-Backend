import 'dotenv/config';
export declare const config: {
    readonly port: number;
    readonly nodeEnv: string;
    readonly isDev: boolean;
    readonly jwt: {
        readonly secret: string;
        readonly expiresInDays: 7;
    };
    readonly registrationSecret: string;
    readonly google: {
        readonly clientId: string;
    };
    readonly supabase: {
        readonly url: string;
        readonly serviceRoleKey: string;
    };
    readonly paystack: {
        readonly secretKey: string;
        readonly baseUrl: "https://api.paystack.co";
    };
    readonly twilio: {
        readonly accountSid: string;
        readonly authToken: string;
        readonly fromNumber: string;
    };
    readonly appUrl: string;
    readonly vtpass: {
        readonly apiKey: string;
        readonly secretKey: string;
        readonly publicKey: string;
        readonly sandboxBaseUrl: string;
        readonly liveBaseUrl: string;
        readonly mode: string;
    };
    readonly bardetech: {
        readonly baseUrl: string;
        readonly apiKey: string;
        readonly secretKey: string;
    };
    readonly mapbox: {
        readonly accessToken: string;
    };
    readonly agora: {
        readonly appId: string;
        readonly appCertificate: string;
    };
    readonly firebase: {
        readonly projectId: string;
        readonly clientEmail: string;
        readonly privateKey: string;
    };
};
export type Config = typeof config;
/**
 * Returns VTPass configuration based on the selected mode (sandbox or live).
 * Can optionally override the mode (e.g. for electricity-specific mode).
 */
export declare function getVtpassConfig(modeOverride?: string): {
    baseUrl: string;
    apiKey: string;
    secretKey: string;
    publicKey: string;
};
//# sourceMappingURL=index.d.ts.map