import { NextFunction, Request, RequestHandler, Response } from "express";
import createHttpError from "http-errors";

export const asyncWrapper = (requestHandler: RequestHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => {
      if (err instanceof createHttpError.HttpError) {
        next(err);
      } else {
        next(createHttpError(500, "An unexpected error occurred"));
      }
    });
  };
};
