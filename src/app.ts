import express, { Request, Response } from "express";
import config from "config";
import cors from "cors"
import { globalErrorHandler } from "./common/middleware/globalErrorHandler";
import cookieParser from "cookie-parser";
import customerRouter from "./customer/customerRoute";
import couponRouter from "./coupon/couponRoute";
import orderRouter from "./orders/orderRouter";
import paymentRouter from "./payment/paymentRouter";

const app = express();
app.use(cookieParser());
app.use(express.json());

const ALLOWED_ORIGINS = config.get<string[]>("allowedOrigins") || [];
console.log("Allowed Origins:", ALLOWED_ORIGINS);
app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    credentials: true,
  }),
);

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Hello from order service service!" });
});

app.use("/api/customer", customerRouter);
app.use("/api/coupon", couponRouter);
app.use("/api/order", orderRouter);
app.use("/api/payment", paymentRouter);

app.use(globalErrorHandler);

export default app;
