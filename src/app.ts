import express, { Request, Response } from "express";
import { globalErrorHandler } from "./common/middleware/globalErrorHandler";
import cookieParser from "cookie-parser";
import customerRouter from "./customer/customerRoute";
import couponRouter from "./coupon/couponRoute";

const app = express();
app.use(cookieParser());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Hello from order service service!" });
});

app.use("/api/customer", customerRouter);
app.use("/api/coupon", couponRouter)

app.use(globalErrorHandler);

export default app;
