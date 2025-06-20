import { Router } from "express";
import { Customer } from "./customerController";
import authenticate from "../common/middleware/authenticate";
import logger from "../config/logger";
import { CustomerService } from "./customerService";
import { asyncWrapper } from "../utils";
import { handleValidationErrors } from "../common/middleware/validate-schema";
import { customerAddressValidator } from "./customerValidator";
const router = Router();

const customerService = new CustomerService();
const customerController = new Customer(customerService, logger);

router.get("/", authenticate, asyncWrapper(customerController.getCustomer));

router.patch(
    "/addresses/:id",
    customerAddressValidator,
    handleValidationErrors,
    authenticate,
    asyncWrapper(customerController.updateAddress));

export default router;
