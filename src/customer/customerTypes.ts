export interface Address {
  label: "Home" | "Work" | "Other"; // e.g. “Home” or “Work”
  text: string; // full address line
  city: string; // city name
  postalCode: string; // ZIP / PIN
  phone: string; // phone number
  isDefault: boolean; // mark your primary address
}

export interface Customer {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  addresses: Address[];
  createdAt: Date;
  updatedAt: Date;
}
export enum CustomerEvents {
  CUSTOMER_UPDATED = "CUSTOMER_UPDATE",
}