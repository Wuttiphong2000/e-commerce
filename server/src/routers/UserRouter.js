import express from "express";
import {
  register,
  login,
  deleteUser,
  deleteMe,
  getMyCart,
  addToCart,
  updateMe,
  changePassword,
  getAddresses,
  addAddress,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
  uploadAvatar,
} from "../controllers/userController.js";
import { requireAuth, optionalAuth, requireRole } from "../middleware/auth.js";
import { loginLimiter } from "../security.js";
import upload from "../middleware/upload.js";
import { body, param } from "express-validator";

const userRouter = express.Router();

userRouter.post("/register", register);
userRouter.post("/login", loginLimiter, login);

userRouter.get("/me", requireAuth, (req, res) =>
  res.json({ success: true, user: req.user })
);

userRouter.delete("/", requireAuth, requireRole("admin"), deleteUser);
userRouter.delete("/me", requireAuth, deleteMe);

userRouter.get("/ping", optionalAuth, (req, res) => {
  res.json({ success: true, auth: req.auth ?? null, message: "pong" });
});

userRouter.get("/cart", requireAuth, getMyCart);
userRouter.post("/cart", requireAuth, addToCart);

// โปรไฟล์
userRouter.patch(
  "/me",
  requireAuth,
  [
    body("firstname").optional().isString().isLength({ min: 1 }),
    body("lastname").optional().isString().isLength({ min: 1 }),
    body("middlename").optional().isString(),
    body("phone").optional().isString(),
    body("profileImage")
      .optional()
      .isURL()
      .withMessage("profileImage ต้องเป็น URL"),
  ],
  updateMe
);

userRouter.patch(
  "/me/password",
  requireAuth,
  [
    body("currentPassword").isString().notEmpty(),
    body("newPassword")
      .isStrongPassword({ minLength: 8 })
      .withMessage("รหัสผ่านใหม่ไม่แข็งแรง"),
  ],
  changePassword
);

// ที่อยู่
userRouter.get("/me/addresses", requireAuth, getAddresses);

userRouter.post(
  "/me/addresses",
  requireAuth,
  [
    body("street").isString().notEmpty(),
    body("city").isString().notEmpty(),
    body("state").optional().isString(),
    body("zip").optional().isString(),
    body("country").isString().notEmpty(),
    body("isDefault").optional().isBoolean(),
  ],
  addAddress
);

userRouter.patch(
  "/me/addresses/:idx",
  requireAuth,
  [
    param("idx").isInt({ min: 0 }),
    body("street").optional().isString(),
    body("city").optional().isString(),
    body("state").optional().isString(),
    body("zip").optional().isString(),
    body("country").optional().isString(),
    body("isDefault").optional().isBoolean(),
  ],
  updateAddress
);

userRouter.patch(
  "/me/addresses/:idx/default",
  requireAuth,
  [param("idx").isInt({ min: 0 })],
  setDefaultAddress
);

userRouter.delete(
  "/me/addresses/:idx",
  requireAuth,
  [param("idx").isInt({ min: 0 })],
  deleteAddress
);

// อัปโหลด avatar (อัปขึ้น cloudinary โฟลเดอร์ avatars)
userRouter.patch(
  "/me/avatar",
  requireAuth,
  upload.single("image"),
  uploadAvatar
);

export default userRouter;
