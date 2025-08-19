import mongoose from "mongoose";
import "dotenv/config";

export default async function connenctDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("❌ MONGO_URI missing in .env");
    process.exit(1);
  }
  try {
    await mongoose.connect(uri, {
      autoIndex: true,
    });
    console.log("db connected");
  } catch (e) {
    console.error("❌ db connect error:", e.message);
    process.exit(1);
  }
}
