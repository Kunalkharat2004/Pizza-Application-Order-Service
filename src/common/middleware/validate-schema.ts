import { validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";
import createHttpError from "http-errors";

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(createHttpError(400, errors.array()[0].msg as string));
  }
  next();
};
