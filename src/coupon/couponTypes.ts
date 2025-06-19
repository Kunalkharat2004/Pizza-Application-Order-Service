export interface Coupon {
    title: string;
    code: string;
    discount: number; // in percentage
    expirationDate: Date;
    tenantId: string;
    createdAt?: Date; 
    updatedAt?: Date; 
}