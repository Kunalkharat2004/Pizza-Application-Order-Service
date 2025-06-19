import {Response} from "express";
import { Request } from "express-jwt";
import { Logger } from "winston";
import { CustomerService } from "./customerService";
import createHttpError from "http-errors";


export class Customer {
  constructor(
    private readonly customerService: CustomerService,
    private readonly logger: Logger,
  ) {}

  getCustomer = async (req: Request, res: Response) => {
    const { sub: userId, firstName, lastName, email } = req.auth;

    this.logger.info("Customer Info", {
      userId,
      firstName,
      lastName,
      email,
    });

      const customer = await this.customerService.getCustomerService({
      userId,
      firstName,
      lastName,
      email,
    });
    if (!customer) {
      throw createHttpError(500, "Failed to retrieve customer data");
    }

    this.logger.info("Customer retrieved successfully", customer._id);
    res.status(201).json(customer);
  }
}