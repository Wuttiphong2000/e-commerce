import express from "express";
import { requireAuth } from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import {
  createShop, getMyShop,
  updateMyShop, updateShopAddress,
  addPickupLocation, updatePickupLocation, deletePickupLocation, setPickupDefault,
  updatePolicies, toggleVacation, uploadShopImages,
} from "../controllers/shopController.js";
import Seller from "../models/Shop.js";
import Product from "../models/Product.js";

const shopRouter = express.Router();

// สมัครร้าน (pending)
shopRouter.post("/", requireAuth, createShop);

// ร้านของฉัน
shopRouter.get("/me", requireAuth, getMyShop);

// อัปเดตร้านพื้นฐาน
shopRouter.patch("/me", requireAuth, updateMyShop);

// อัปเดตที่อยู่หลักของร้าน
shopRouter.patch("/me/address", requireAuth, updateShopAddress);

// จุดรับสินค้า (pickupLocations)
shopRouter.post("/me/pickups", requireAuth, addPickupLocation);
shopRouter.patch("/me/pickups/:idx", requireAuth, updatePickupLocation);
shopRouter.delete("/me/pickups/:idx", requireAuth, deletePickupLocation);
shopRouter.patch("/me/pickups/:idx/default", requireAuth, setPickupDefault);

// นโยบาย/วันเตรียมส่ง
shopRouter.patch("/me/policies", requireAuth, updatePolicies);

// โหมดพักร้อน
shopRouter.patch("/me/vacation", requireAuth, toggleVacation);

// อัปโหลดรูปโลโก้/แบนเนอร์ (form-data: logo(file), banner(file))
shopRouter.patch(
  "/me/images",
  requireAuth,
  upload.fields([{ name: "logo", maxCount: 1 }, { name: "banner", maxCount: 1 }]),
  uploadShopImages
);

/* ========== ของเดิม: สถานะย่อ & สินค้าสาธารณะ ========== */

// สถานะย่อของร้านฉัน
shopRouter.get("/me/status", requireAuth, async (req, res) => {
  const shop = await Seller.findOne({ ownerUserId: req.auth.userId }).lean();
  if (!shop) return res.json({ success: true, status: "none" });
  return res.json({
    success: true,
    status: shop.status,
    kycStatus: shop.kycStatus,
    reason: shop.kycReason || ""
  });
});

// ข้อมูลสาธารณะของร้าน
shopRouter.get("/:slug", async (req, res) => {
  const shop = await Seller.findOne({ slug: req.params.slug.toLowerCase() })
    .select("name slug logoUrl bannerUrl description ratingAvg ratingCount status")
    .lean();
  if (!shop || shop.status !== "active")
    return res.status(404).json({ success: false, message: "ไม่พบร้าน" });
  res.json({ success: true, shop });
});

// สินค้าสาธารณะของร้านตาม slug
shopRouter.get("/:slug/products", async (req, res) => {
  const shop = await Seller.findOne({ slug: req.params.slug.toLowerCase() }).lean();
  if (!shop || shop.status !== "active")
    return res.status(404).json({ success: false, message: "ไม่พบร้าน" });

  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    Product.find({ shopId: shop._id, status: "active" })
      .sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    Product.countDocuments({ shopId: shop._id, status: "active" }),
  ]);

  res.json({ success: true, items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

export default shopRouter;
