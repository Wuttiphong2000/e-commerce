import mongoose from "mongoose";
import multer from "multer";
import { AppError } from "../utils/error.js";

export function notFoundHandler(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

export function errorHandler(err, req, res, _next) {
  const isProd = process.env.NODE_ENV === "production";
  let status = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = Object.values(err.errors)[0]?.message || "Validation error";
  }
  if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }
  if (err?.code === 11000) {
    status = 409;
    const fields = Object.keys(err.keyPattern || {});
    message = `Duplicate value for: ${fields.join(", ")}`;
  }
  if (err instanceof multer.MulterError) {
    status = 400;
    message = `Upload error: ${err.message}`;
  }
  if (err.name === "JsonWebTokenError") {
    status = 401;
    message = "โทเคนไม่ถูกต้อง";
  }
  if (err.name === "TokenExpiredError") {
    status = 401;
    message = "โทเคนหมดอายุ";
  }
  if (err instanceof AppError) {
    status = err.statusCode;
  }

  if (!isProd) console.error("❌ ERROR:", err);
  else console.error("❌ ERROR:", { message: err.message, status, name: err.name });

  return res.status(status).json({
    success: false,
    message,
    ...(isProd ? {} : { error: err.name, stack: err.stack }),
  });
}
