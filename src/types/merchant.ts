export interface ShippingAddress {
  firstName: string;
  lastName: string;
  phone: string;
  street: string;
  houseNumber: string;
  zip: string;
  city: string;
  state: string;
  country: string;
  birthday: string;
}

export interface BillingAddress extends ShippingAddress {
  email: string;
}

export interface CartProduct {
  name: string;
  // Net (pre-tax, pre-discount) price of ONE unit
  price: number;
  quantity: number;
  // Tax for the whole line (all units)
  taxAmount?: number;
  // Discount for the whole line (all units); zero or negative
  discountAmount?: number;
  // "SHIPPING" renders the line as the shipping row of the HPP cart summary
  type?: "SHIPPING";
}

export interface MerchantCart {
  products: CartProduct[];
  currency: string;
}
