import User from "../models/User.js";
import bcrypt from "bcrypt";
import validator from "validator";
import { validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import Product from "../models/Product.js";
import { AppError, catchAsync } from "../utils/error.js";

const createToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const setAuthCookie = (res, token) => res.cookie("token", token, COOKIE_OPTS);

export const register = catchAsync(async (req, res) => {
  let { firstname, middlename, lastname, username, email, password } = req.body;
  username = (username || "").trim().toLowerCase();
  email = (email || "").trim().toLowerCase();

  if (!firstname || !lastname || !username || !email || !password)
    throw new AppError("กรุณากรอกข้อมูลให้ครบถ้วน", 400);
  if (!validator.isEmail(email))
    throw new AppError("กรุณาใส่ Email ให้ถูกต้อง", 400);
  if (password.length < 8)
    throw new AppError("รหัสผ่านควรมีอย่างน้อย 8 ตัวอักษร", 400);

  const [existsEmail, existsUsername] = await Promise.all([
    User.findOne({ email }),
    User.findOne({ username }),
  ]);
  if (existsEmail) throw new AppError("Email นี้มีผู้ใช้ไปแล้ว", 409);
  if (existsUsername) throw new AppError("Username นี้มีผู้ใช้ไปแล้ว", 409);

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({
    firstname,
    middlename,
    lastname,
    username,
    email,
    password: hashed,
  });

  const token = createToken(user._id);
  setAuthCookie(res, token);
  const { password: _p, ...safe } = user.toObject();
  res.json({ success: true, user: safe });
});

export const login = catchAsync(async (req, res) => {
  let { username, email, password } = req.body;
  username = (username || "").trim().toLowerCase();
  email = (email || "").trim().toLowerCase();

  if (!password || (!username && !email))
    throw new AppError("กรุณากรอกข้อมูลให้ครบถ้วน", 400);

  const user = await User.findOne({ $or: [{ username }, { email }] }).select(
    "+password"
  );
  if (!user) throw new AppError("ชื่อผู้ใช้หรืออีเมลไม่ถูกต้อง!", 400);

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new AppError("รหัสผ่านไม่ถูกต้อง!", 400);

  user.lastLogin = new Date();
  user.save().catch(() => {});

  const token = createToken(user._id);
  setAuthCookie(res, token);
  const { password: _p, ...safe } = user.toObject();
  res.json({ success: true, user: safe });
});

// DELETE /api/users/session
export const logout = catchAsync(async (req, res) => {
  res.clearCookie("token", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" });
  res.json({ success: true, message: "ออกจากระบบแล้ว" });
});

export const deleteUser = catchAsync(async (req, res) => {
  const { id } = req.body;
  if (!id) throw new AppError("ไม่พบ id ผู้ใช้", 400);
  await User.findByIdAndDelete(id);
  res.json({ success: true, message: "ลบสำเร็จ!" });
});

export const deleteMe = catchAsync(async (req, res) => {
  const userId = req?.auth?.userId;
  if (!userId) throw new AppError("กรุณาเข้าสู่ระบบ", 401);
  await User.findByIdAndDelete(userId);
  if (req.cookies?.token)
    res.clearCookie("token", { httpOnly: true, secure: true, sameSite: "lax" });
  res.json({ success: true, message: "ลบบัญชีของคุณเรียบร้อยแล้ว" });
});

// GET /api/users/cart
export const getMyCart = catchAsync(async (req, res) => {
  const user = await User.findById(req.auth.userId).lean();
  if (!user) throw new AppError("ไม่พบผู้ใช้", 404);
  res.json({ success: true, items: user.cartdata || [] });
});

// POST /api/users/cart
// body: { itemId, variantId?, quantity? }
export const addToCart = catchAsync(async (req, res) => {
  const { itemId, variantId, quantity = 1 } = req.body;
  if (!itemId) throw new AppError("ต้องระบุ itemId", 400);
  const qty = Math.max(1, Number(quantity));

  const product = await Product.findById(itemId).lean();
  if (!product || product.status !== "active")
    throw new AppError("ไม่พบสินค้าหรือไม่พร้อมขาย", 404);

  const user = await User.findById(req.auth.userId);
  if (!user) throw new AppError("ไม่พบผู้ใช้", 404);

  // ถ้ามีรายการเดิม (itemId + variantId ตรงกัน) ให้บวกจำนวน
  const existed = user.cartdata?.find(
    (it) =>
      String(it.itemId) === String(itemId) &&
      String(it.variantId || "") === String(variantId || "")
  );
  if (existed) {
    existed.quantity += qty;
  } else {
    user.cartdata.push({
      shopId: product.shopId,
      itemId: product._id,
      variantId: variantId || undefined,
      quantity: qty,
      productName: product.name,
      price: product.price,
      imagePublicId: product.images?.[0] || "",
    });
  }

  await user.save();
  res.status(201).json({ success: true, items: user.cartdata });
});

// PATCH /api/users/cart/:itemId
export const updateCartItem = catchAsync(async (req, res) => {
  const { itemId } = req.params;
  const qty = Number(req.body.quantity);
  if (!qty || qty < 1) throw new AppError("quantity ต้องมากกว่า 0", 400);

  const user = await User.findOneAndUpdate(
    { _id: req.auth.userId, "cartdata._id": itemId },
    { $set: { "cartdata.$.quantity": qty } },
    { new: true }
  ).lean();
  if (!user) throw new AppError("ไม่พบสินค้าในตะกร้า", 404);
  res.json({ success: true, items: user.cartdata });
});

// DELETE /api/users/cart/:itemId
export const removeCartItem = catchAsync(async (req, res) => {
  const { itemId } = req.params;
  const user = await User.findByIdAndUpdate(
    req.auth.userId,
    { $pull: { cartdata: { _id: itemId } } },
    { new: true }
  ).lean();
  if (!user) throw new AppError("ไม่พบผู้ใช้", 404);
  res.json({ success: true, items: user.cartdata });
});

function assertValid(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const msg = errors.array()[0]?.msg || "Invalid input";
    throw new AppError(msg, 422);
  }
}

// PATCH /api/users/me
export const updateMe = catchAsync(async (req, res) => {
  assertValid(req);
  const userId = req.auth.userId;

  const allowed = [
    "firstname",
    "middlename",
    "lastname",
    "phone",
    "profileImage",
  ];
  const $set = {};
  for (const k of allowed) if (k in req.body) $set[k] = req.body[k];

  const user = await User.findByIdAndUpdate(
    userId,
    { $set },
    { new: true }
  ).lean();
  if (!user) throw new AppError("ไม่พบผู้ใช้", 404);

  res.json({ success: true, user });
});

// PATCH /api/users/me/password
export const changePassword = catchAsync(async (req, res) => {
  assertValid(req);
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.auth.userId).select("+password");
  if (!user) throw new AppError("ไม่พบผู้ใช้", 404);

  const ok = await bcrypt.compare(currentPassword, user.password);
  if (!ok) throw new AppError("รหัสผ่านเดิมไม่ถูกต้อง", 400);

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  res.json({ success: true, message: "เปลี่ยนรหัสผ่านสำเร็จ" });
});

// GET /api/users/me/addresses
export const getAddresses = catchAsync(async (req, res) => {
  const user = await User.findById(req.auth.userId).lean();
  if (!user) throw new AppError("ไม่พบผู้ใช้", 404);
  res.json({ success: true, addresses: user.addresses || [] });
});

// POST /api/users/me/addresses
export const addAddress = catchAsync(async (req, res) => {
  assertValid(req);
  const user = await User.findById(req.auth.userId);
  if (!user) throw new AppError("ไม่พบผู้ใช้", 404);

  const address = {
    street: req.body.street,
    city: req.body.city,
    state: req.body.state || "",
    zip: req.body.zip || "",
    country: req.body.country,
    isDefault: !!req.body.isDefault,
  };

  if (!Array.isArray(user.addresses)) user.addresses = [];
  if (address.isDefault) {
    user.addresses.forEach((a) => (a.isDefault = false));
  }
  user.addresses.push(address);
  await user.save();

  res.status(201).json({ success: true, addresses: user.addresses });
});

// PATCH /api/users/me/addresses/:idx
export const updateAddress = catchAsync(async (req, res) => {
  assertValid(req);
  const idx = Number(req.params.idx);
  const user = await User.findById(req.auth.userId);
  if (!user) throw new AppError("ไม่พบผู้ใช้", 404);
  if (!user.addresses?.[idx]) throw new AppError("ไม่พบบันทึกที่อยู่", 404);

  const up = req.body;
  Object.assign(user.addresses[idx], up);

  // ถ้าตั้ง default ให้ตัวนี้ ต้องเคลียร์ตัวอื่น
  if (up.isDefault === true) {
    user.addresses.forEach((a, i) => (a.isDefault = i === idx));
  }
  await user.save();
  res.json({ success: true, addresses: user.addresses });
});

// PATCH /api/users/me/addresses/:idx/default
export const setDefaultAddress = catchAsync(async (req, res) => {
  const idx = Number(req.params.idx);
  const user = await User.findById(req.auth.userId);
  if (!user) throw new AppError("ไม่พบผู้ใช้", 404);
  if (!user.addresses?.[idx]) throw new AppError("ไม่พบบันทึกที่อยู่", 404);

  user.addresses.forEach((a, i) => (a.isDefault = i === idx));
  await user.save();
  res.json({ success: true, addresses: user.addresses });
});

// DELETE /api/users/me/addresses/:idx
export const deleteAddress = catchAsync(async (req, res) => {
  const idx = Number(req.params.idx);
  const user = await User.findById(req.auth.userId);
  if (!user) throw new AppError("ไม่พบผู้ใช้", 404);
  if (!user.addresses?.[idx]) throw new AppError("ไม่พบบันทึกที่อยู่", 404);

  // ลบรายการออก
  const removed = user.addresses.splice(idx, 1)[0];

  // ถ้าลบที่อยู่ default ออก และยังเหลือที่อยู่ ให้ตั้งอันแรกเป็น default
  if (removed?.isDefault && user.addresses.length > 0) {
    user.addresses.forEach((a, i) => (a.isDefault = i === 0));
  }

  await user.save();
  res.json({ success: true, addresses: user.addresses });
});

// PATCH /api/users/me/avatar
export const uploadAvatar = catchAsync(async (req, res) => {
  if (!req.file?.path) throw new AppError("กรุณาอัปโหลดไฟล์ (field: image)", 400);

  const user = await User.findByIdAndUpdate(
    req.auth.userId,
    {
      $set: {
        profileImageUrl: req.file.path,
        profileImagePublicId: req.file.filename,
      },
    },
    { new: true }
  ).lean();

  if (!user) throw new AppError("ไม่พบผู้ใช้", 404);
  res.json({ success: true, user });
});

