import { NextFunction, Request, Response } from "express";
import { Prisma } from "../../generated/prisma/client";

const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let statusCode = 500;
  let errorMessage = "Internal Server Error";
  let errorDetails = null;

  if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    errorMessage = "Validation Error";
    errorDetails = err.message;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        statusCode = 409;
        errorMessage = "Conflict: Unique constraint failed";
        errorDetails = err.message;
        break;
      case "P2025":
        statusCode = 404;
        errorMessage = "Not Found: Record not found";
        errorDetails = err.message;
        break;
      default:
        statusCode = 400;
        errorMessage = "Bad Request";
        errorDetails = err.message;
        break;
    }
  } else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    statusCode = 500;
    errorMessage = "Internal Server Error";
    errorDetails = err.message;
  } else if (err instanceof Prisma.PrismaClientInitializationError) {
    statusCode = 500;
    errorMessage = "Internal Server Error: Initialization Error";
    errorDetails = err.message;
  } else if (err instanceof Prisma.PrismaClientRustPanicError) {
    statusCode = 500;
    errorMessage = "Internal Server Error: Rust Panic";
    errorDetails = err.message;
  } else if (err instanceof Error) {
    errorMessage = err.message || "Internal Server Error";
  }

  res.status(statusCode).json({
    success: false,
    message: errorMessage,
    error: errorDetails,
  });
};

export default errorHandler;
