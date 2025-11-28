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
  number: string;
  birthday: string;
}

export interface BillingAddress extends ShippingAddress {
  email: string;
}

export interface CartProduct {
  name: string;
  price: number;
  quantity: number;
}

export interface MerchantCart {
  products: CartProduct[];
  currency: string;
}
