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

// Enhanced CORS configuration with wildcard support
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      // Check if origin matches any allowed pattern
      const isAllowed = ALLOWED_ORIGINS.some(allowedOrigin => {
        if (allowedOrigin.includes('*')) {
          // Convert wildcard pattern to regex
          const regex = new RegExp(allowedOrigin.replace(/\*/g, '.*'));
          return regex.test(origin);
        }
        return allowedOrigin === origin;
      });
      
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }),
);

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Hello from order service service!." });
});

app.use("/api/customer", customerRouter);
app.use("/api/coupon", couponRouter);
app.use("/api/order", orderRouter);
app.use("/api/payment", paymentRouter);

app.use(globalErrorHandler);

export default app;