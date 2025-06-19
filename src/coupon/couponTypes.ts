export interface Coupon {
  title: string;
  code: string;
  discount: number; // in percentage
  validTill: Date;
  tenantId: string;
  createdAt?: Date;
  updatedAt?: Date;
}
