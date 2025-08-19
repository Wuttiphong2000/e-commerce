import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import compression from "compression";
import hpp from "hpp";

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "พยายามเข้าสู่ระบบบ่อยเกินไป กรุณาลองใหม่ภายหลัง" },
});

export function applySecurity(app) {
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(hpp());
  app.use(compression());

  const allowList = (process.env.FRONTEND_URL || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  app.use(cors({
    origin: allowList.length ? allowList : true,
    credentials: true,
  }));

  if (process.env.NODE_ENV === "production") {
    app.use(rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 1000,
      standardHeaders: true,
      legacyHeaders: false,
    }));
  }
}
