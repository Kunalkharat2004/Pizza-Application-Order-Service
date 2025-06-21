import { Request } from "express";

export type AuthCookie = {
  accessToken: string;
};

export interface AuthRequest extends Request {
  auth: {
    sub: string;
    role: string;
    id?: string;
    tenantId: string;
  };
}

  export interface IPaginateOptions {
    page: number;
    limit: number;
  }
