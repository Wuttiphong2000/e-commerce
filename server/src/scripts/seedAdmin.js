import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import connenctDB from "../configs/db.js";
import User from "../models/User.js";

const run = async () => {
  try {
    const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const username = (process.env.ADMIN_USERNAME || "admin").trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !username || !password) {
      console.error("❌ Please set ADMIN_EMAIL, ADMIN_USERNAME, ADMIN_PASSWORD in .env");
      process.exit(1);
    }

    await connenctDB();

    const exist = await User.findOne({ $or: [{ email }, { username }] });
    const hash = await bcrypt.hash(password, 10);

    if (!exist) {
      const admin = await User.create({
        firstname: "Admin",
        lastname: "User",
        username,
        email,
        password: hash,
        role: "admin",
        isActive: true,
      });
      console.log("✅ Admin user created:", { id: admin._id.toString(), email: admin.email, username: admin.username });
    } else {
      exist.password = hash;
      exist.role = "admin";
      exist.isActive = true;
      await exist.save();
      console.log("✅ Existing user promoted to admin:", { id: exist._id.toString(), email: exist.email, username: exist.username });
    }
  } catch (err) {
    console.error("❌ Seed admin failed:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close().catch(() => {});
  }
};

run();
