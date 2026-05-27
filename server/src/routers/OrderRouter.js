import express from "express";
import { body } from "express-validator";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getSellerOrders,
  shipOrder,
} from "../controllers/orderController.js";

const orderRouter = express.Router();

orderRouter.use(requireAuth);

orderRouter.post(
  "/",
  [
    body("shippingAddressIdx")
      .isInt({ min: 0 })
      .withMessage("ต้องระบุที่อยู่จัดส่ง"),
    body("paymentMethod")
      .isIn(["cod", "credit_card", "promptpay"])
      .withMessage("วิธีชำระเงินไม่ถูกต้อง"),
  ],
  createOrder
);

orderRouter.get("/seller-orders", requireRole("seller", "admin"), getSellerOrders);
orderRouter.get("/", getMyOrders);
orderRouter.get("/:id", getOrderById);
orderRouter.patch("/:id/ship", requireRole("seller", "admin"), shipOrder);
orderRouter.patch("/:id/cancel", cancelOrder);

export default orderRouter;
