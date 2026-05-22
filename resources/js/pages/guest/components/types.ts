export interface Item {
    id: number;
    title: string;
    code: string;
    company: string;
    packing_qty: number;
    packing_size: number;
    price: number;
    price_carton: number;
    price_piece: number;
    price_loose_carton: number;
    image: string | null;
    images?: string[];
    category_id: number;
    company_image?: string | null;
}

export interface CartItem extends Item {
    qty_carton: number;
    qty_pcs: number;
}

export interface Cart {
    [key: number]: CartItem;
}

export interface Category {
    id: number;
    name: string;
    image?: string;
    image_url?: string;
}
