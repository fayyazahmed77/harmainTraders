declare global {
    function route(...args: any[]): any;
}

export type LocationType = 'country' | 'state' | 'city' | 'area' | 'subarea';

export interface LocationNode {
    id: number;
    name: string;
    type: LocationType;
    code?: string | null;
    phone_code?: string | null;
    currency?: string | null;
    is_active: boolean;
    status?: string;
    latitude?: number | null;
    longitude?: number | null;
    
    // Parent references
    country_id?: number | null;
    province_id?: number | null;
    city_id?: number | null;
    area_id?: number | null;

    // Children counts
    provinces_count?: number;
    cities_count?: number;
    areas_count?: number;
    subareas_count?: number;

    created_at?: string;
}

export interface LocationStats {
    countries: number;
    states: number;
    cities: number;
    areas: number;
    subareas: number;
}

export interface SearchResultItem {
    type: LocationType;
    id: number;
    name: string;
    code?: string | null;
    is_active: boolean;
    path: string[];
    path_ids: {
        country?: number;
        state?: number;
        city?: number;
        area?: number;
        subarea?: number;
    };
}
