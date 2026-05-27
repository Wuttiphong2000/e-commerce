import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { approveShop, rejectShop, setKycStatus } from "../controllers/shopController.js";
import { deleteUser } from "../controllers/userController.js";
import {
  listShops,
  updateShopStatus,
  listProducts,
  updateProductStatus,
  listUsers,
  getDashboardStats,
} from "../controllers/adminController.js";

const adminRouter = express.Router();

adminRouter.use(requireAuth, requireRole("admin"));

// Dashboard
adminRouter.get("/stats", getDashboardStats);

// Users
adminRouter.get("/users", listUsers);
adminRouter.delete("/users/:id", (req, res, next) => {
  req.body.id = req.params.id;
  return deleteUser(req, res, next);
});

// Shops
adminRouter.get("/shops", listShops);
adminRouter.patch("/shops/:id/status", updateShopStatus);
adminRouter.patch("/shops/:id/kyc", setKycStatus);
adminRouter.patch("/shops/:id/approve", approveShop);
adminRouter.patch("/shops/:id/reject", rejectShop);

// Products
adminRouter.get("/products", listProducts);
adminRouter.patch("/products/:id/status", updateProductStatus);

export default adminRouter;
