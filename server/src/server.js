import express from "express";
import cookieParser from "cookie-parser";
import "dotenv/config";
import connenctDB from "./configs/db.js";

import { applySecurity } from "./security.js";
import userRouter from "./routers/UserRouter.js";
import shopRouter from "./routers/ShopRouter.js";
import productRouter from "./routers/ProductRouter.js";
import adminRouter from "./routers/AdminRouter.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(express.json());
app.use(cookieParser());
applySecurity(app);

// Health
app.get("/", (_req, res) => res.send("API is working"));

// Routes
app.use("/api/users", userRouter);
app.use("/api/shops", shopRouter);
app.use("/api/products", productRouter);
app.use("/api/admin", adminRouter);

// Error middleware
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

(async () => {
  await connenctDB();
  app.listen(PORT, () => {
    console.log("server is runing port " + PORT);
  });
})();
