import Seller from "../models/Shop.js";
import User from "../models/User.js";
import { AppError, catchAsync } from "../utils/error.js";

/** ผู้ใช้สมัครเปิดร้าน -> pending (บังคับกรอกที่อยู่ร้าน) */
export const createShop = catchAsync(async (req, res) => {
  const ownerUserId = req?.auth?.userId;
  if (!ownerUserId) throw new AppError("กรุณาเข้าสู่ระบบ", 401);

  const { name, slug, description } = req.body;

  // รับที่อยู่ได้ 2 แบบ: shipFromAddress{} หรือฟิลด์แบนๆ
  const sfa = req.body.shipFromAddress || {};
  const street = (sfa.street ?? req.body.street ?? "").trim();
  const city = (sfa.city ?? req.body.city ?? "").trim();
  const state = (sfa.state ?? req.body.state ?? "").trim();
  const zip = (sfa.zip ?? req.body.zip ?? "").trim();
  const country = (sfa.country ?? req.body.country ?? "").trim();

  if (!name || !slug) throw new AppError("กรุณาระบุ name และ slug", 400);
  if (!street || !city || !country) {
    throw new AppError(
      "กรุณากรอกที่อยู่ร้านให้ครบอย่างน้อย street, city, country",
      400
    );
  }

  // ผู้ใช้มีร้านรออนุมัติ/มีอยู่แล้ว ห้ามสร้างซ้ำ
  const existsShopOfUser = await Seller.findOne({ ownerUserId });
  if (existsShopOfUser)
    throw new AppError("คุณมีร้านแล้ว หรืออยู่ระหว่างรออนุมัติ", 409);

  const normalizedSlug = slug.trim().toLowerCase();
  const existsSlug = await Seller.findOne({ slug: normalizedSlug });
  if (existsSlug) throw new AppError("slug นี้ถูกใช้แล้ว", 409);

  const shop = await Seller.create({
    name: name.trim(),
    slug: normalizedSlug,
    ownerUserId,
    status: "pending",
    kycStatus: "submitted",
    kycReason: "",
    kycUpdatedAt: new Date(),
    description: description || "",
    shipFromAddress: { street, city, state, zip, country, isDefault: true },
    pickupLocations: [{ street, city, state, zip, country, isDefault: true }], // ใส่จุดรับของที่ที่เดียวกันให้ด้วย (ถ้าไม่ต้องการ ลบได้)
  });

  res.status(201).json({ success: true, shop });
});

/** ดูร้านของฉัน */
export const getMyShop = catchAsync(async (req, res) => {
  const ownerUserId = req?.auth?.userId;
  if (!ownerUserId) throw new AppError("กรุณาเข้าสู่ระบบ", 401);

  const shop = await Seller.findOne({ ownerUserId });
  if (!shop) throw new AppError("ยังไม่มีร้าน", 404);

  res.json({ success: true, shop });
});

// ====== อัปเดตข้อมูลร้านพื้นฐาน ======
export const updateMyShop = catchAsync(async (req, res) => {
  const ownerUserId = req.auth.userId;

  // ฟิลด์พื้นฐานที่อนุญาตให้แก้
  const allowed = [
    "name",
    "description",
    "tags",
    "categoriesMain",
    "chatAutoReply",
  ];
  const $set = {};
  for (const k of allowed) if (k in req.body) $set[k] = req.body[k];

  const shop = await Seller.findOneAndUpdate(
    { ownerUserId, status: { $ne: "closed" } },
    { $set },
    { new: true }
  );
  if (!shop) throw new AppError("ไม่พบร้านหรือร้านถูกปิด", 404);
  res.json({ success: true, shop });
});

// ====== ที่อยู่หลัก (shipFromAddress) ======
export const updateShopAddress = catchAsync(async (req, res) => {
  const ownerUserId = req.auth.userId;
  const {
    street = "",
    city = "",
    state = "",
    zip = "",
    country = "",
  } = req.body;
  if (!street || !city || !country) {
    throw new AppError("กรุณากรอกอย่างน้อย street, city, country", 400);
  }

  const shop = await Seller.findOneAndUpdate(
    { ownerUserId },
    {
      $set: {
        shipFromAddress: { street, city, state, zip, country, isDefault: true },
      },
    },
    { new: true }
  );
  if (!shop) throw new AppError("ไม่พบร้าน", 404);
  res.json({ success: true, shop });
});

// ====== จุดรับสินค้า (pickupLocations) ======
export const addPickupLocation = catchAsync(async (req, res) => {
  const ownerUserId = req.auth.userId;
  const {
    street = "",
    city = "",
    state = "",
    zip = "",
    country = "",
    isDefault = false,
  } = req.body;
  if (!street || !city || !country)
    throw new AppError("ต้องมี street, city, country", 400);

  const shop = await Seller.findOne({ ownerUserId });
  if (!shop) throw new AppError("ไม่พบร้าน", 404);

  if (!Array.isArray(shop.pickupLocations)) shop.pickupLocations = [];
  if (isDefault) shop.pickupLocations.forEach((l) => (l.isDefault = false));
  shop.pickupLocations.push({
    street,
    city,
    state,
    zip,
    country,
    isDefault: !!isDefault,
  });

  await shop.save();
  res
    .status(201)
    .json({ success: true, pickupLocations: shop.pickupLocations });
});

export const updatePickupLocation = catchAsync(async (req, res) => {
  const ownerUserId = req.auth.userId;
  const idx = Number(req.params.idx);
  const shop = await Seller.findOne({ ownerUserId });
  if (!shop) throw new AppError("ไม่พบร้าน", 404);
  if (!shop.pickupLocations?.[idx])
    throw new AppError("ไม่พบจุดรับสินค้าที่ระบุ", 404);

  Object.assign(shop.pickupLocations[idx], req.body || {});
  if (req.body?.isDefault === true) {
    shop.pickupLocations.forEach((l, i) => (l.isDefault = i === idx));
  }
  await shop.save();
  res.json({ success: true, pickupLocations: shop.pickupLocations });
});

export const deletePickupLocation = catchAsync(async (req, res) => {
  const ownerUserId = req.auth.userId;
  const idx = Number(req.params.idx);
  const shop = await Seller.findOne({ ownerUserId });
  if (!shop) throw new AppError("ไม่พบร้าน", 404);
  if (!shop.pickupLocations?.[idx])
    throw new AppError("ไม่พบจุดรับสินค้าที่ระบุ", 404);

  const removed = shop.pickupLocations.splice(idx, 1)[0];
  if (removed?.isDefault && shop.pickupLocations.length > 0) {
    shop.pickupLocations[0].isDefault = true;
  }
  await shop.save();
  res.json({ success: true, pickupLocations: shop.pickupLocations });
});

export const setPickupDefault = catchAsync(async (req, res) => {
  const ownerUserId = req.auth.userId;
  const idx = Number(req.params.idx);
  const shop = await Seller.findOne({ ownerUserId });
  if (!shop) throw new AppError("ไม่พบร้าน", 404);
  if (!shop.pickupLocations?.[idx])
    throw new AppError("ไม่พบจุดรับสินค้าที่ระบุ", 404);

  shop.pickupLocations.forEach((l, i) => (l.isDefault = i === idx));
  await shop.save();
  res.json({ success: true, pickupLocations: shop.pickupLocations });
});

// ====== นโยบาย & SLA ======
export const updatePolicies = catchAsync(async (req, res) => {
  const ownerUserId = req.auth.userId;
  const allowed = [
    "shippingPolicy",
    "returnPolicy",
    "warrantyPolicy",
    "daysToShip",
  ];
  const $set = {};
  for (const k of allowed) if (k in req.body) $set[k] = req.body[k];

  const shop = await Seller.findOneAndUpdate(
    { ownerUserId },
    { $set },
    { new: true }
  );
  if (!shop) throw new AppError("ไม่พบร้าน", 404);
  res.json({ success: true, shop });
});

// ====== โหมดพักร้อน ======
export const toggleVacation = catchAsync(async (req, res) => {
  const ownerUserId = req.auth.userId;
  const { vacationMode = false, vacationMessage = "" } = req.body;

  const shop = await Seller.findOneAndUpdate(
    { ownerUserId },
    { $set: { vacationMode: !!vacationMode, vacationMessage } },
    { new: true }
  );
  if (!shop) throw new AppError("ไม่พบร้าน", 404);
  res.json({ success: true, shop });
});

// ====== อัปโหลดโลโก้/แบนเนอร์ (Cloudinary + multer) ======
export const uploadShopImages = catchAsync(async (req, res) => {
  const ownerUserId = req.auth.userId;
  const shop = await Seller.findOne({ ownerUserId });
  if (!shop) throw new AppError("ไม่พบร้าน", 404);

  if (req.files?.logo?.[0]) shop.logoUrl = req.files.logo[0].path;
  if (req.files?.banner?.[0]) shop.bannerUrl = req.files.banner[0].path;

  await shop.save();
  res.json({ success: true, shop });
});

/** Admin: ร้านที่ pending */
export const listPendingShops = catchAsync(async (_req, res) => {
  const shops = await Seller.find({ status: "pending" }).sort({
    createdAt: -1,
  });
  res.json({ success: true, shops });
});

/** Admin: อนุมัติร้าน + promote user -> seller (กันกดซ้ำ) */
export const approveShop = catchAsync(async (req, res) => {
  const { id } = req.params;

  const shop = await Seller.findOneAndUpdate(
    { _id: id, status: { $in: ["pending", "rejected"] } },
    {
      status: "active",
      $push: {
        audit: {
          action: "approve",
          byUserId: req.auth.userId,
          detail: "approved by admin",
        },
      },
    },
    { new: true }
  );
  if (!shop) throw new AppError("ไม่พบร้านหรือร้านนี้ถูกอนุมัติแล้ว", 409);

  await User.findByIdAndUpdate(shop.ownerUserId, { role: "seller" });

  res.json({ success: true, shop });
});

/** Admin: ปฏิเสธร้าน */
export const rejectShop = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { reason = "" } = req.body;

  const shop = await Seller.findOneAndUpdate(
    { _id: id, status: { $in: ["pending", "active", "rejected"] } },
    {
      status: "rejected",
      kycStatus: "rejected",
      kycReason: reason,
      kycUpdatedAt: new Date(),
      $push: {
        audit: { action: "reject", byUserId: req.auth.userId, detail: reason },
      },
    },
    { new: true }
  );
  if (!shop) throw new AppError("ไม่พบร้าน", 404);

  res.json({ success: true, shop });
});

/** Admin: ตั้ง KYC */
export const setKycStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { kycStatus, reason = "" } = req.body;
  if (!["verified", "rejected"].includes(kycStatus)) {
    throw new AppError("kycStatus ต้องเป็น verified หรือ rejected", 400);
  }

  const shop = await Seller.findByIdAndUpdate(
    id,
    {
      kycStatus,
      kycReason: kycStatus === "rejected" ? reason : "",
      kycUpdatedAt: new Date(),
      $push: {
        audit: {
          action: `kyc:${kycStatus}`,
          byUserId: req.auth.userId,
          detail: reason,
        },
      },
    },
    { new: true }
  );
  if (!shop) throw new AppError("ไม่พบร้าน", 404);

  res.json({ success: true, shop });
});
