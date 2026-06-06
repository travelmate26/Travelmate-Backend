export interface GeocodeResult {
    placeName: string;
    lng: number;
    lat: number;
}
export interface RouteResult {
    distance: number;
    duration: number;
    geometry: string;
}
/**
 * Autocomplete/Search a location using Mapbox Geocoding API.
 */
export declare function geocode(query: string): Promise<GeocodeResult[]>;
/**
 * Get route instructions (distance, duration, polyline) between two points.
 */
export declare function getDirections(fromLng: number, fromLat: number, toLng: number, toLat: number): Promise<RouteResult | null>;
//# sourceMappingURL=mapbox.d.ts.map