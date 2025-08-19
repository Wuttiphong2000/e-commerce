import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { AppError } from "../utils/error.js";

function extractToken(req) {
  const auth = req.headers.authorization || "";
  if (auth.startsWith("Bearer ")) return auth.substring(7);
  if (req.cookies?.token) return req.cookies.token;
  return null;
}

export const requireAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) return next(new AppError("กรุณาเข้าสู่ระบบ (no token)", 401));

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).lean();
    if (!user || user.isActive === false) {
      return next(new AppError("บัญชีผู้ใช้ไม่พร้อมใช้งาน", 401));
    }

    req.auth = { userId: String(user._id), role: user.role };
    req.user = user;
    next();
  } catch {
    return next(new AppError("โทเคนไม่ถูกต้องหรือหมดอายุ", 401));
  }
};

export const optionalAuth = async (req, _res, next) => {
  try {
    const token = extractToken(req);
    if (!token) return next();
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).lean();
    if (user && user.isActive !== false) {
      req.auth = { userId: String(user._id), role: user.role };
      req.user = user;
    }
  } catch {}
  next();
};

export const requireRole = (...roles) => (req, res, next) => {
  const role = req?.auth?.role;
  if (!role) return next(new AppError("กรุณาเข้าสู่ระบบ", 401));
  if (!roles.includes(role)) return next(new AppError("สิทธิ์ไม่เพียงพอ", 403));
  next();
};
