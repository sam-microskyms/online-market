export type CategoryId = "fashion" | "home" | "beauty" | "phone" | "electronics";

export type ProductStatus = "live" | "pending" | "rejected" | "hidden";

export type SellerStatus = "active" | "pending" | "rejected";

export type Role = "customer" | "seller" | "admin";

export type PayMethod = "cod-demo" | "bkash-demo";

export interface Seller {
  id: string;
  name: string;
  area: string;
  blurb: string;
  status: SellerStatus;
  reviewNote: string;
}

export interface Product {
  id: string;
  sellerId: string;
  title: string;
  category: CategoryId;
  priceBdt: number;
  stock: number;
  status: ProductStatus;
  claim: string;
  description: string;
  details: string[];
  durationSec: number | null;
  poster: string;
  video: string | null;
  reviewNote: string;
}

export interface CartLine {
  productId: string;
  qty: number;
}

export interface OrderLine {
  productId: string;
  sellerId: string;
  title: string;
  qty: number;
  priceBdt: number;
}

export interface DemoOrder {
  id: string;
  createdAt: string;
  division: string;
  method: PayMethod;
  note: string;
  lines: OrderLine[];
  totalBdt: number;
  historical: boolean;
}

export interface DemoState {
  version: 1;
  role: Role;
  actingSellerId: string;
  sellers: Seller[];
  products: Product[];
  cart: CartLine[];
  orders: DemoOrder[];
  pinnedProductId: string;
}
