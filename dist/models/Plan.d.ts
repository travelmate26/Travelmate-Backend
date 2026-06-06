export interface Plan {
    id: string;
    service: string;
    name: string;
    variation_code: string;
    price: number;
    apiType?: 'vtpass' | 'bardetech';
    network?: string;
    mode?: 'sandbox' | 'live';
    volume?: string;
    validity?: string;
    planType?: string;
    sellingPrice?: number;
    apiPrice?: number;
    cashbackType?: 'fixed' | 'percentage';
    cashbackValue?: number;
    externalId?: string;
    isSaved?: boolean;
}
//# sourceMappingURL=Plan.d.ts.map