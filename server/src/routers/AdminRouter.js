import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  listPendingShops,
  approveShop,
  rejectShop,
  setKycStatus,
} from "../controllers/shopController.js";
import { deleteUser } from "../controllers/userController.js";

const adminRouter = express.Router();

// ครอบสิทธิ์ admin ทั้งไฟล์
adminRouter.use(requireAuth, requireRole("admin"));

// ผู้ใช้
adminRouter.delete("/users/:id", async (req, res, next) => {
  try {
    req.body.id = req.params.id;
    return deleteUser(req, res, next);
  } catch (e) {
    next(e);
  }
});

// ร้านค้า
adminRouter.get("/shops/pending", listPendingShops);
adminRouter.patch("/shops/:id/approve", approveShop); // จะ promote user → seller
adminRouter.patch("/shops/:id/reject", rejectShop);
adminRouter.patch("/shops/:id/kyc", setKycStatus);

export default adminRouter;
