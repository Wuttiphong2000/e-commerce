/**
 * Seed script — 10 sellers · 10 shops · 100 products with curated Unsplash images
 * Usage: npm run seed:data
 * Safe to re-run: clears previous seed data (keeps admin users)
 */
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { v2 as cloudinary } from "cloudinary";
import connectDB from "../configs/db.js";
import User from "../models/User.js";
import Shop from "../models/Shop.js";
import Product from "../models/Product.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadFromUrl(url) {
  const result = await cloudinary.uploader.upload(url, {
    folder: "seed-products",
    transformation: [{ width: 800, height: 800, crop: "fill", quality: "auto" }],
  });
  return result.public_id;
}

const U = (id) => `https://images.unsplash.com/photo-${id}?w=800&h=800&fit=crop&q=80`;

// ── Sellers ───────────────────────────────────────────────────────────────────
const SELLERS = [
  { firstname: "สมชาย",   lastname: "ใจดี",      username: "seller01", email: "seller01@test.com" },
  { firstname: "วิไล",    lastname: "สุขสม",     username: "seller02", email: "seller02@test.com" },
  { firstname: "ประยุทธ", lastname: "มั่งมี",    username: "seller03", email: "seller03@test.com" },
  { firstname: "นันทา",   lastname: "เจริญดี",   username: "seller04", email: "seller04@test.com" },
  { firstname: "ภาณุ",    lastname: "ศรีสุข",    username: "seller05", email: "seller05@test.com" },
  { firstname: "กมล",     lastname: "พงษ์ไพร",   username: "seller06", email: "seller06@test.com" },
  { firstname: "รัตนา",   lastname: "ทองใบ",     username: "seller07", email: "seller07@test.com" },
  { firstname: "ชาญ",     lastname: "วิทยา",     username: "seller08", email: "seller08@test.com" },
  { firstname: "พิมพ์",   lastname: "ลดาวัลย์",  username: "seller09", email: "seller09@test.com" },
  { firstname: "อรุณ",    lastname: "แสงทอง",    username: "seller10", email: "seller10@test.com" },
];

// ── Shops + Products ──────────────────────────────────────────────────────────
const SHOPS_META = [
  // ── 1. แฟชั่น ─────────────────────────────────────────────────────────────
  {
    name: "แฟชั่นลีลา", slug: "fashion-leela",
    description: "เสื้อผ้าสตรีทันสมัย คุณภาพดี ราคาเป็นกันเอง",
    city: "กรุงเทพฯ", categories: ["เสื้อผ้า", "แฟชั่น"],
    products: [
      { name: "เสื้อเชิ้ตลายดอก",      price: 390,  stock: 50, tags: ["เสื้อเชิ้ต","ลายดอก","cotton"], weight: 200,
        desc: "ผ้า cotton 100% ลายดอกสวยงาม ใส่ได้ทุกโอกาส",
        img: U("1591047139786-a399e1336367") },
      { name: "กางเกงยีนส์ทรงสลิม",    price: 790,  stock: 30, tags: ["ยีนส์","กางเกง","stretch"], weight: 500,
        desc: "ยีนส์ stretch ทรงสลิม ใส่สบาย ยืดหยุ่นดี",
        img: U("1542272604-787c3835535d") },
      { name: "เดรสลายตาราง",           price: 650,  stock: 25, tags: ["เดรส","ลายตาราง","casual"], weight: 300,
        desc: "เดรสสั้นลายตาราง สไตล์ casual chic",
        img: U("1515372039744-b8f02a3ae446") },
      { name: "เสื้อยืดโอเวอร์ไซส์",   price: 290,  stock: 80, tags: ["เสื้อยืด","oversize","cotton"], weight: 180,
        desc: "cotton เนื้อนุ่ม ทรง oversize มาแรง",
        img: U("1521572163474-6864f9cf17ab") },
      { name: "กระโปรงพลีทสั้น",        price: 490,  stock: 40, tags: ["กระโปรง","พลีท","พาสเทล"], weight: 250,
        desc: "กระโปรงพลีทสีพาสเทล ดูเป็นสาวน้อย",
        img: U("1583744946564-b52ac1c389c8") },
      { name: "แจ็คเก็ตเดนิม",          price: 1290, stock: 20, tags: ["แจ็คเก็ต","ยีนส์","denim"], weight: 700,
        desc: "แจ็คเก็ตยีนส์ classic ทรงโอเวอร์ไซส์",
        img: U("1548126032-079a0fb0099d") },
      { name: "เสื้อครอปถักโครเชต์",   price: 450,  stock: 35, tags: ["เสื้อครอป","โครเชต์","ถัก"], weight: 200,
        desc: "เสื้อถักลายโครเชต์ สไตล์โบฮีเมียน",
        img: U("1558618666-fcd25c85cd64") },
      { name: "กางเกงผ้าลินินขายาว",   price: 590,  stock: 45, tags: ["กางเกง","ลินิน","ขายาว"], weight: 400,
        desc: "ผ้าลินินระบายอากาศดี ทรงกระบอก",
        img: U("1509631179647-0177331693ae") },
      { name: "เสื้อสายเดี่ยวซาติน",   price: 350,  stock: 60, tags: ["เสื้อสายเดี่ยว","ซาติน","ออกงาน"], weight: 150,
        desc: "ซาตินเนื้อดี เงางาม ใส่ออกงานได้",
        img: U("1515886657613-9f3515b0c78f") },
      { name: "เซตเสื้อ+กางเกง",       price: 990,  stock: 15, tags: ["เซต","ชุด","พาสเทล"], weight: 550,
        desc: "เซตคู่สีพาสเทล ใส่ได้ทุกวัน",
        img: U("1539109136881-3be0616acf4b") },
    ],
  },

  // ── 2. อิเล็กทรอนิกส์ ────────────────────────────────────────────────────
  {
    name: "เทคโนพลัส", slug: "techno-plus",
    description: "อุปกรณ์อิเล็กทรอนิกส์และเทคโนโลยีล้ำสมัย",
    city: "นนทบุรี", categories: ["อิเล็กทรอนิกส์", "เทคโนโลยี"],
    products: [
      { name: "หูฟัง Wireless ANC",      price: 2990, stock: 25, tags: ["หูฟัง","wireless","ANC"], weight: 250,
        desc: "ตัดเสียงรบกวน 35dB แบตอึด 30 ชม.",
        img: U("1505740420928-5e560c06d30e") },
      { name: "เมาส์ไร้สาย RGB",         price: 890,  stock: 50, tags: ["เมาส์","wireless","RGB"], weight: 100,
        desc: "DPI ปรับได้ 400-4800 ไฟ RGB 7 สี",
        img: U("1563986645-52dc5e8c2b4e") },
      { name: "คีย์บอร์ด Mechanical",    price: 1990, stock: 20, tags: ["คีย์บอร์ด","mechanical","RGB"], weight: 900,
        desc: "สวิทช์ Blue เสียงดังฟังชัด ไฟ RGB",
        img: U("1587829741301-dc798b83add3") },
      { name: "Webcam 1080p",             price: 1290, stock: 30, tags: ["webcam","กล้อง","Full HD"], weight: 150,
        desc: "ความละเอียด Full HD พร้อมไมค์ในตัว",
        img: U("1596742578826-21ebf9d7e3e6") },
      { name: "Power Bank 20000mAh",      price: 1490, stock: 40, tags: ["power bank","แบต","ชาร์จเร็ว"], weight: 450,
        desc: "ชาร์จเร็ว 65W PD รองรับ 3 พอร์ต",
        img: U("1512941937858-7e4e60e41c3f") },
      { name: "Hub USB-C 7in1",           price: 990,  stock: 35, tags: ["USB-C","hub","HDMI"], weight: 80,
        desc: "รองรับ HDMI 4K, USB 3.0, SD Card",
        img: U("1518770660439-4636190af475") },
      { name: "สาย HDMI 2.1 8K",         price: 490,  stock: 60, tags: ["HDMI","สาย","8K"], weight: 120,
        desc: "รองรับ 8K 60Hz, 4K 120Hz, 48Gbps",
        img: U("1601524909162-0b1f5f4b6e45") },
      { name: "แท่นชาร์จไร้สาย 15W",    price: 790,  stock: 45, tags: ["ชาร์จไร้สาย","Magsafe","wireless"], weight: 90,
        desc: "Magsafe Compatible ชาร์จเร็ว 15W",
        img: U("1582126009267-68c64fe5c4d6") },
      { name: "ขาตั้งจอ Ergonomic",      price: 1690, stock: 15, tags: ["ขาตั้งจอ","ergonomic","จอ"], weight: 1200,
        desc: "ปรับมุมได้ 360° รองรับจอ 13-32 นิ้ว",
        img: U("1527443224154-c4a3942d3acf") },
      { name: "Speaker Bluetooth 360°",   price: 2490, stock: 18, tags: ["ลำโพง","bluetooth","กันน้ำ"], weight: 550,
        desc: "กันน้ำ IPX7 เสียง Bass ทรงพลัง",
        img: U("1545454004-1b588ab5c43f") },
    ],
  },

  // ── 3. ความงาม ────────────────────────────────────────────────────────────
  {
    name: "บิวตี้เฮาส์", slug: "beauty-house",
    description: "เครื่องสำอางและสกินแคร์คุณภาพสูง นำเข้าจากต่างประเทศ",
    city: "กรุงเทพฯ", categories: ["ความงาม", "สกินแคร์"],
    products: [
      { name: "ครีมกันแดด SPF50+",       price: 590,  stock: 80, tags: ["กันแดด","SPF50","สกินแคร์"], weight: 80,
        desc: "PA++++ ปกป้อง UVA/UVB กันน้ำ 8 ชม.",
        img: U("1570194065650-d99fb4bedf0a") },
      { name: "เซรั่มวิตามินซี",          price: 890,  stock: 50, tags: ["เซรั่ม","วิตามินซี","ผิวใส"], weight: 60,
        desc: "วิตามินซี 20% ลดรอยด่างดำ ผิวใส",
        img: U("1620916566398-bfe11700ac62") },
      { name: "มอยเจอร์ไรเซอร์ Hyaluron", price: 750,  stock: 60, tags: ["มอยเจอร์","hyaluron","ชุ่มชื้น"], weight: 100,
        desc: "ไฮยาลูโรนิก แอซิด 5 ชนิด ผิวชุ่มชื้น",
        img: U("1598300042247-d088f8ab3a91") },
      { name: "แผ่นมาสก์หน้า 10 แผ่น",  price: 290,  stock: 100, tags: ["มาสก์","หน้า","สกินแคร์"], weight: 150,
        desc: "มาสก์ essence สูตรกระจ่างใส",
        img: U("1571019613454-1cb2f99b2d8b") },
      { name: "ลิปสติกแมตต์",            price: 390,  stock: 70, tags: ["ลิปสติก","แมตต์","ทนนาน"], weight: 30,
        desc: "สีติดทนนาน 12 ชม. ไม่แห้งปาก 8 เฉดสี",
        img: U("1631214499487-93a4e54d2fd7") },
      { name: "รองพื้น Full Coverage",    price: 990,  stock: 40, tags: ["รองพื้น","coverage","SPF30"], weight: 45,
        desc: "ปกปิดสูง กันน้ำ ติดทนตลอดวัน SPF30",
        img: U("1516975080664-a2db5ded0f24") },
      { name: "ไพรเมอร์เบลอรูขุมขน",    price: 690,  stock: 45, tags: ["ไพรเมอร์","รูขุมขน","แต่งหน้า"], weight: 40,
        desc: "รูขุมขนดูเล็กลง ฐานแต่งหน้าเนียนสมบูรณ์",
        img: U("1522335789203-aabd1fc54bc9") },
      { name: "น้ำมิสเซลลาร์",           price: 450,  stock: 90, tags: ["มิสเซลลาร์","ล้างหน้า","อ่อนโยน"], weight: 200,
        desc: "ล้างเครื่องสำอางสะอาดหมดจด อ่อนโยนต่อผิว",
        img: U("1556228720-195a672e8a03") },
      { name: "โทนเนอร์กรดอะมิโน",      price: 680,  stock: 55, tags: ["โทนเนอร์","อะมิโน","pH"], weight: 180,
        desc: "pH สมดุล บำรุงผิวให้ชุ่มชื้น ลด irritation",
        img: U("1608248543803-ba4f8c70ae0b") },
      { name: "อายไลเนอร์กันน้ำ",        price: 320,  stock: 75, tags: ["อายไลเนอร์","กันน้ำ","ทนนาน"], weight: 15,
        desc: "หัวปากกาเส้นเล็ก กันน้ำ ติดทน 24 ชม.",
        img: U("1517256673220-28a5a07d7394") },
    ],
  },

  // ── 4. กีฬา ──────────────────────────────────────────────────────────────
  {
    name: "กีฬาแชมป์", slug: "sports-champ",
    description: "อุปกรณ์กีฬาและฟิตเนส ครบวงจร สำหรับนักกีฬาทุกระดับ",
    city: "เชียงใหม่", categories: ["กีฬา", "ฟิตเนส"],
    products: [
      { name: "รองเท้าวิ่ง Cushion Max",  price: 3490, stock: 20, tags: ["รองเท้า","วิ่ง","Cushion"], weight: 280,
        desc: "โฟม React รองรับแรงกระแทกสูง น้ำหนักเบา",
        img: U("1562183241-20e5c3de4ccc") },
      { name: "เสื้อวิ่ง Dry-Fit",        price: 590,  stock: 50, tags: ["เสื้อวิ่ง","Dry-Fit","UV"], weight: 120,
        desc: "ผ้าระบายเหงื่อเร็ว UV Protection 50+",
        img: U("1553456558-dff62b0eb7e8") },
      { name: "โยคะแมทหนา 8mm",           price: 890,  stock: 30, tags: ["โยคะ","แมท","TPE"], weight: 1000,
        desc: "ยาง TPE กันลื่น พับเก็บได้ น้ำหนักเบา",
        img: U("1544367567-0f2fcb009e0b") },
      { name: "ดัมเบลปรับน้ำหนัก 5-25kg", price: 4990, stock: 10, tags: ["ดัมเบล","ฟิตเนส","ยิม"], weight: 5000,
        desc: "ปรับน้ำหนักได้ 5 ระดับ ประหยัดพื้นที่",
        img: U("1534438327276-14e5300c3a48") },
      { name: "สายยางออกกำลังกาย",        price: 490,  stock: 60, tags: ["สายยาง","ออกกำลังกาย","Latex"], weight: 200,
        desc: "แรงต้าน 5 ระดับ 5-150 lb Latex เกรด Premium",
        img: U("1593079831268-4d6d4ef30df0") },
      { name: "นาฬิกา GPS Smart Watch",    price: 5990, stock: 15, tags: ["smart watch","GPS","กีฬา"], weight: 45,
        desc: "GPS Built-in, Heart Rate, SpO2, 14 โหมดกีฬา",
        img: U("1508685096489-7aacd43bd3b1") },
      { name: "กระเป๋าเป้ยิม 40L",       price: 1290, stock: 25, tags: ["กระเป๋า","ยิม","เป้"], weight: 600,
        desc: "ช่องรองเท้าแยก กันน้ำ ช่องใส่แล็ปท็อป",
        img: U("1553062407-98eeb64c6a62") },
      { name: "ถุงมือยกน้ำหนัก",         price: 390,  stock: 45, tags: ["ถุงมือ","ยิม","ยกน้ำหนัก"], weight: 80,
        desc: "หนังไมโครไฟเบอร์ กันลื่น ปกป้องมือ",
        img: U("1517836357463-d25dfeac3438") },
      { name: "โปรตีนเวย์ 1kg",           price: 1890, stock: 35, tags: ["โปรตีน","whey","เวย์"], weight: 1000,
        desc: "Whey Isolate 27g protein/serving รส Chocolate",
        img: U("1593095948071-474c5cc2989d") },
      { name: "เสื่อออกกำลังกาย Puzzle",  price: 690,  stock: 40, tags: ["เสื่อ","EVA","ฟิตเนส"], weight: 800,
        desc: "EVA 1cm ต่อเป็นแผ่น กันกระแทก 4 แผ่น/เซต",
        img: U("1518611012118-696072aa579a") },
    ],
  },

  // ── 5. หนังสือ ────────────────────────────────────────────────────────────
  {
    name: "หนังสือดีดี", slug: "book-deedee",
    description: "หนังสือทุกประเภท ทั้งภาษาไทยและภาษาอังกฤษ ราคาย่อมเยา",
    city: "กรุงเทพฯ", categories: ["หนังสือ", "การศึกษา"],
    products: [
      { name: "Atomic Habits ฉบับภาษาไทย", price: 295, stock: 60, tags: ["หนังสือ","นิสัย","self-help"], weight: 350,
        desc: "เปลี่ยนพฤติกรรม สร้างนิสัย โดย James Clear",
        img: U("1481627834876-b7833e8f5570") },
      { name: "คิดเร็วและช้า",             price: 345, stock: 40, tags: ["จิตวิทยา","หนังสือ","thinking"], weight: 400,
        desc: "Thinking Fast and Slow ฉบับแปลไทย",
        img: U("1512820790803-83ca734da794") },
      { name: "รวยจากหุ้น VI",             price: 275, stock: 55, tags: ["หุ้น","ลงทุน","การเงิน"], weight: 300,
        desc: "แนวคิดการลงทุนแบบ Value Investment ไทยๆ",
        img: U("1611974789855-9c2a0a7236a3") },
      { name: "Python สำหรับมือใหม่",      price: 395, stock: 30, tags: ["Python","โปรแกรม","coding"], weight: 450,
        desc: "เรียนเขียนโปรแกรม Python ตั้งแต่ศูนย์",
        img: U("1555066931-4365d14bab8c") },
      { name: "ตำราอาหารไทยต้นตำรับ",     price: 450, stock: 25, tags: ["ตำราอาหาร","อาหารไทย","สูตร"], weight: 600,
        desc: "สูตรอาหารไทย 200 เมนู พร้อมภาพประกอบ",
        img: U("1466921149-25ef7b0f17b9") },
      { name: "The Psychology of Money",    price: 325, stock: 50, tags: ["การเงิน","จิตวิทยา","money"], weight: 320,
        desc: "จิตวิทยาการเงิน โดย Morgan Housel",
        img: U("1592496431122-2349e0fbc666") },
      { name: "Sapiens ประวัติย่อมนุษยชาติ", price: 375, stock: 35, tags: ["ประวัติศาสตร์","มนุษย์","sapiens"], weight: 500,
        desc: "ประวัติศาสตร์มนุษย์ฉบับย่อ โดย Yuval Noah Harari",
        img: U("1544716278-ca5e3f4abd8c") },
      { name: "Deep Work",                  price: 295, stock: 45, tags: ["productivity","ทำงาน","focus"], weight: 300,
        desc: "ทำงานลึก สำเร็จเร็ว โดย Cal Newport",
        img: U("1434030216411-0b5816999aea") },
      { name: "การ์ตูน One Piece เล่ม 1",  price: 75,  stock: 100, tags: ["การ์ตูน","มังงะ","one piece"], weight: 180,
        desc: "มังงะญี่ปุ่นชื่อดัง โดย Eiichiro Oda",
        img: U("1578632767115-351597cf2477") },
      { name: "ไดอารี่ 2025 Minimal",      price: 195, stock: 80, tags: ["ไดอารี่","แพลนเนอร์","สมุด"], weight: 250,
        desc: "สมุดแพลนเนอร์ A5 180 แกรม 365 หน้า",
        img: U("1531346878377-a5be20888e57") },
    ],
  },

  // ── 6. ของเล่น ───────────────────────────────────────────────────────────
  {
    name: "ของเล่นน้องหนู", slug: "kids-toy-shop",
    description: "ของเล่นเด็กปลอดภัย ได้มาตรฐาน CE เหมาะทุกช่วงวัย",
    city: "สมุทรปราการ", categories: ["ของเล่น", "เด็ก"],
    products: [
      { name: "ตัวต่อเลโก้ Classic 500 ชิ้น", price: 990,  stock: 25, tags: ["เลโก้","ตัวต่อ","เด็ก"], weight: 500,
        desc: "ตัวต่อสีสดใส เหมาะ 5+ ปี พัฒนาความคิด",
        img: U("1585366396788-aa41a2ea0f5c") },
      { name: "ตุ๊กตาบาร์บี้ชุดนักบิน",       price: 590,  stock: 30, tags: ["ตุ๊กตา","บาร์บี้","เด็กผู้หญิง"], weight: 300,
        desc: "Barbie Pilot ชุดครบ พร้อมอุปกรณ์เสริม",
        img: U("1515488042361-ee00e65b431f") },
      { name: "หุ่นยนต์ STEM ประกอบเอง",     price: 1290, stock: 15, tags: ["หุ่นยนต์","STEM","coding"], weight: 400,
        desc: "โค้ดได้ 30+ ท่า เหมาะ 8+ ปี เรียน STEM",
        img: U("1485827404703-89b55fcc595e") },
      { name: "จิ๊กซอว์ 500 ชิ้น",           price: 390,  stock: 40, tags: ["จิ๊กซอว์","ปริศนา","สมาธิ"], weight: 450,
        desc: "ภาพประกอบสีสวย พัฒนาสมาธิและสายตา",
        img: U("1611532736597-de2d4265fba3") },
      { name: "รถไฟของเล่นไม้",              price: 890,  stock: 20, tags: ["รถไฟ","ของเล่นไม้","เด็กเล็ก"], weight: 800,
        desc: "ไม้ธรรมชาติ ปลอดสาร รางยาว 3 เมตร",
        img: U("1558171578-6c49b2d39590") },
      { name: "บ้านตุ๊กตา 3 ชั้น",          price: 1990, stock: 10, tags: ["บ้านตุ๊กตา","เด็กผู้หญิง","ไม้"], weight: 2000,
        desc: "ไม้ MDF แข็งแรง พร้อมเฟอร์นิเจอร์จิ๋ว",
        img: U("1560807707-8cc77767d783") },
      { name: "กระดาน Whiteboard เด็ก",      price: 690,  stock: 35, tags: ["กระดาน","whiteboard","วาดรูป"], weight: 600,
        desc: "2 in 1 กระดานไวท์บอร์ด+ดำ พร้อมชอล์ก",
        img: U("1503676260728-1c00da094a0b") },
      { name: "ชุดทดลองวิทยาศาสตร์",       price: 790,  stock: 25, tags: ["วิทยาศาสตร์","ทดลอง","STEM"], weight: 700,
        desc: "20 การทดลอง เหมาะ 6-12 ปี คู่มือไทย",
        img: U("1532187863486-abf9dbad1b69") },
      { name: "ลูกบิด Rubik's Cube 3x3",    price: 290,  stock: 50, tags: ["รูบิค","ปริศนา","speed cube"], weight: 100,
        desc: "Speed Cube มืออาชีพ หมุนลื่น สปริงปรับได้",
        img: U("1550989460-0adf9ea622e2") },
      { name: "ของเล่นอ่างทราย",            price: 490,  stock: 30, tags: ["ทราย","สร้างสรรค์","เด็กเล็ก"], weight: 1200,
        desc: "ทรายจลนศาสตร์ 1kg ไม่ติดมือ อุปกรณ์พร้อม",
        img: U("1566140967859-9f9601e7e1f7") },
    ],
  },

  // ── 7. เครื่องครัว ───────────────────────────────────────────────────────
  {
    name: "เครื่องครัวพรีเมียม", slug: "kitchen-premium",
    description: "เครื่องครัวและของใช้ในบ้านคุณภาพสูง ทั้งไทยและนำเข้า",
    city: "กรุงเทพฯ", categories: ["เครื่องครัว", "บ้านและสวน"],
    products: [
      { name: "หม้อทอดอากาศ 5.5L",         price: 2990, stock: 20, tags: ["air fryer","ทอดอากาศ","ดิจิตอล"], weight: 3500,
        desc: "ดิจิตอล 8 โปรแกรม ลดน้ำมัน 95% ล้างง่าย",
        img: U("1564890369478-9cda8d5f12bc") },
      { name: "เครื่องชงกาแฟ Espresso",     price: 4990, stock: 10, tags: ["กาแฟ","espresso","เครื่องชง"], weight: 4000,
        desc: "แรงดัน 15 Bar นมฟองได้ สกัดคุณภาพร้าน",
        img: U("1495474472287-4d71bcdd2085") },
      { name: "มีดเชฟ Ceramic 8 นิ้ว",     price: 890,  stock: 30, tags: ["มีด","ceramic","เชฟ"], weight: 200,
        desc: "เซรามิก ไม่เป็นสนิม คมนาน เบากว่าเหล็ก",
        img: U("1556909114-44e3e70034e2") },
      { name: "กระทะเคลือบ Diamond 28cm",   price: 1290, stock: 25, tags: ["กระทะ","diamond","non-stick"], weight: 1200,
        desc: "เคลือบ Diamond PFOA Free ติดไฟ Induction ได้",
        img: U("1556909212-d5b604d0c90d") },
      { name: "เครื่องปั่น 1200W",          price: 1990, stock: 15, tags: ["เครื่องปั่น","blender","1200W"], weight: 2000,
        desc: "มอเตอร์ 1200W ปั่นน้ำแข็งได้ โถ 2 ลิตร",
        img: U("1610725664285-7c57e6eeac3f") },
      { name: "หม้อหุงข้าว Fuzzy Logic 1L", price: 2290, stock: 20, tags: ["หม้อหุงข้าว","IH","fuzzy logic"], weight: 2500,
        desc: "IH Induction 12 โปรแกรม สแตนเลสทั้งใบ",
        img: U("1625491022-9a56696e0c2c") },
      { name: "เขียงไม้ยางพารา XL",        price: 590,  stock: 40, tags: ["เขียง","ไม้","ยางพารา"], weight: 1500,
        desc: "ไม้ยางพาราแท้ หนา 3cm กันเชื้อรา",
        img: U("1608198093002-ad4e005484ec") },
      { name: "ชุดช้อนส้อมมีดสแตนเลส 24 ชิ้น", price: 890, stock: 35, tags: ["ช้อนส้อม","สแตนเลส","cutlery"], weight: 800,
        desc: "สแตนเลส 304 ชุด 6 ที่นั่ง กล่องของขวัญ",
        img: U("1602166481765-ec43a33e60ab") },
      { name: "กล่องถนอมอาหาร Vacuum 5 ใบ", price: 790,  stock: 45, tags: ["กล่อง","vacuum","ถนอมอาหาร"], weight: 600,
        desc: "สูญญากาศมือกด รักษาความสดใหม่ 5 เท่า",
        img: U("1583947215259-38e31be8751f") },
      { name: "ตู้เย็นขนาดเล็ก 3.2Q",      price: 3490, stock: 8,  tags: ["ตู้เย็น","inverter","ประหยัดไฟ"], weight: 12000,
        desc: "ระบบ Inverter ประหยัดไฟเบอร์ 5 เสียงเงียบ",
        img: U("1584568694244-14fbdf83bd30") },
    ],
  },

  // ── 8. เฟอร์นิเจอร์ ──────────────────────────────────────────────────────
  {
    name: "เฟอร์นิเจอร์โมเดิร์น", slug: "modern-furniture",
    description: "เฟอร์นิเจอร์ดีไซน์สมัยใหม่ ราคาจับต้องได้ จัดส่งทั่วประเทศ",
    city: "สมุทรสาคร", categories: ["เฟอร์นิเจอร์", "ตกแต่งบ้าน"],
    products: [
      { name: "โซฟา L-Shape 3+2 ที่นั่ง",  price: 18900, stock: 5, tags: ["โซฟา","L-shape","วนเวอร์"], weight: 80000,
        desc: "ผ้าวนเวอร์ กันน้ำ โครงไม้จริง รับน้ำหนัก 300kg",
        img: U("1631679706892-64e2f0e4c929") },
      { name: "โต๊ะทำงาน Height Adjustable", price: 8900, stock: 8, tags: ["โต๊ะ","ปรับความสูง","ergonomic"], weight: 30000,
        desc: "ปรับความสูงได้ 60-125cm มอเตอร์คู่ งานหนัก",
        img: U("1593642632559-0c6d3fc62b89") },
      { name: "เก้าอี้ Ergonomic Mesh",      price: 6900, stock: 10, tags: ["เก้าอี้","ergonomic","mesh"], weight: 15000,
        desc: "รองรับหลัง 7 จุด ปรับได้ทุกส่วน รับ 150kg",
        img: U("1505843490538-5133c6c7d0e1") },
      { name: "ชั้นหนังสือ BILLY Style 5 ชั้น", price: 3900, stock: 12, tags: ["ชั้นหนังสือ","ชั้นวาง","MDF"], weight: 25000,
        desc: "MDF เคลือบ PVC กว้าง 80cm รับน้ำหนักดี",
        img: U("1493809842364-78817add7ffb") },
      { name: "เตียง Platform 6 ฟุต",       price: 7900, stock: 6,  tags: ["เตียง","platform","6ฟุต"], weight: 40000,
        desc: "ไม้ MDF+ขาเหล็ก หัวเตียงบุนวม ไม่ดังเวลานอน",
        img: U("1505692952047-1a78307da8f2") },
      { name: "โต๊ะกาแฟ Tempered Glass",    price: 4900, stock: 10, tags: ["โต๊ะกาแฟ","กระจก","living room"], weight: 15000,
        desc: "กระจกนิรภัย 10mm ขาสแตนเลสทอง สวยหรู",
        img: U("1567016432779-094069958ea5") },
      { name: "ตู้เสื้อผ้า 3 บาน Sliding",  price: 12900, stock: 5, tags: ["ตู้เสื้อผ้า","sliding","กระจก"], weight: 60000,
        desc: "บานเลื่อน กระจกเต็มบาน พื้นที่เก็บของเยอะ",
        img: U("1595428774223-ef52624120d2") },
      { name: "โคมไฟ Floor Lamp Nordic",    price: 2900, stock: 20, tags: ["โคมไฟ","nordic","LED"], weight: 3000,
        desc: "สไตล์นอร์ดิก ปรับความสว่างได้ LED 12W",
        img: U("1507473885765-e6ed057f782c") },
      { name: "พรมขนนุ่ม Shaggy 160x230",   price: 3900, stock: 8, tags: ["พรม","shaggy","นุ่ม"], weight: 5000,
        desc: "ขนยาว 3cm นุ่มเหยียบ กันลื่น ล้างได้",
        img: U("1506439773919-d8d1ed74b877") },
      { name: "กระจกผนัง Arch Shape 120cm", price: 2490, stock: 15, tags: ["กระจก","arch","Japandi"], weight: 4000,
        desc: "ทรงโค้ง กรอบทองดำ Japandi style",
        img: U("1618220179428-22790b461013") },
    ],
  },

  // ── 9. อาหารออร์แกนิค ────────────────────────────────────────────────────
  {
    name: "อาหารสุขภาพออร์แกนิค", slug: "organic-health-food",
    description: "อาหารสุขภาพ ออร์แกนิค ธรรมชาติ 100% ไม่มีสารเคมี",
    city: "เชียงราย", categories: ["อาหาร", "สุขภาพ"],
    products: [
      { name: "ข้าวกล้องหอมมะลิออร์แกนิค 5kg", price: 390, stock: 60, tags: ["ข้าวกล้อง","ออร์แกนิค","GAP"], weight: 5000,
        desc: "ข้าวกล้องออร์แกนิค GAP รับรองจากกรมวิชาการ",
        img: U("1586201375761-83865001e31c") },
      { name: "น้ำผึ้งป่าแท้ 500ml",           price: 450, stock: 40, tags: ["น้ำผึ้ง","ป่า","ธรรมชาติ"], weight: 600,
        desc: "น้ำผึ้งป่าธรรมชาติ ไม่ผ่านความร้อน เอนไซม์สมบูรณ์",
        img: U("1558642452-9d2a7deb7f62") },
      { name: "ชาเขียวมัทฉะออร์แกนิค 100g",   price: 590, stock: 35, tags: ["มัทฉะ","ชาเขียว","ออร์แกนิค"], weight: 120,
        desc: "มัทฉะ Ceremonial Grade จากเชียงราย",
        img: U("1544787219-7f47ccb76574") },
      { name: "เมล็ดเจีย Chia Seeds 500g",     price: 290, stock: 80, tags: ["เจีย","omega-3","superfood"], weight: 520,
        desc: "Omega-3 สูง ออร์แกนิค นำเข้าจาก Mexico",
        img: U("1505253716362-bf64b37a47c2") },
      { name: "ถั่วอัลมอนด์อบ Raw 500g",       price: 390, stock: 55, tags: ["อัลมอนด์","raw","โปรตีน"], weight: 520,
        desc: "Raw almond ไม่เติมเกลือ ไม่มีน้ำมัน โปรตีนสูง",
        img: U("1508061253366-f7da158b6d46") },
      { name: "คีนัว Quinoa 500g",             price: 350, stock: 50, tags: ["คีนัว","quinoa","protein"], weight: 520,
        desc: "Super Grain Protein ครบ 9 Amino Acid",
        img: U("1518977822-31c08a11734b") },
      { name: "น้ำมันมะพร้าว Cold Press 500ml", price: 490, stock: 45, tags: ["น้ำมันมะพร้าว","cold press","virgin"], weight: 550,
        desc: "สกัดเย็น Virgin ไม่ผ่านความร้อน Lauric acid สูง",
        img: U("1509042239860-f550ce710b93") },
      { name: "โปรตีนพืช Pea Protein 1kg",    price: 990, stock: 25, tags: ["pea protein","วีแกน","plant-based"], weight: 1050,
        desc: "Pea Isolate 80% protein วีแกน แลคโตสฟรี",
        img: U("1593095948071-474c5cc2989d") },
      { name: "สาหร่ายสไปรูลิน่า 200 เม็ด",  price: 350, stock: 60, tags: ["สไปรูลิน่า","superfood","วิตามิน"], weight: 100,
        desc: "Spirulina อินทรีย์ โปรตีน 60% วิตามิน B12",
        img: U("1540420828-2ada0fb64f89") },
      { name: "แกรนนูล่าโฮมเมด 400g",         price: 290, stock: 70, tags: ["granola","ข้าวโอ๊ต","ไม่มีน้ำตาล"], weight: 420,
        desc: "ข้าวโอ๊ต+ถั่ว+ผลไม้อบแห้ง ไม่มีน้ำตาล",
        img: U("1525351484163-7529414f2acd") },
    ],
  },

  // ── 10. สัตว์เลี้ยง ──────────────────────────────────────────────────────
  {
    name: "เพ็ทเลิฟ สัตว์เลี้ยง", slug: "petlove-shop",
    description: "ของใช้และอาหารสัตว์เลี้ยงคุณภาพดี ทั้งหมาแมวและสัตว์เลี้ยงอื่น",
    city: "ปทุมธานี", categories: ["สัตว์เลี้ยง", "ของใช้สัตว์"],
    products: [
      { name: "อาหารแมว Royal Canin 2kg",    price: 890,  stock: 40, tags: ["อาหารแมว","royal canin","แมว"], weight: 2000,
        desc: "สูตร Indoor 27 สำหรับแมวเลี้ยงในบ้าน อายุ 1-7 ปี",
        img: U("1514888286974-6c03e2ca1dba") },
      { name: "อาหารสุนัข Hill's Science 3kg", price: 1290, stock: 30, tags: ["อาหารหมา","hill's","สุนัข"], weight: 3000,
        desc: "สูตร Adult Small Paws วิตามิน+แร่ธาตุครบ",
        img: U("1543466835-00a7907e9de1") },
      { name: "บ้านแมวไม้ 5 ชั้น",           price: 2990, stock: 10, tags: ["บ้านแมว","cat tree","ฝนเล็บ"], weight: 8000,
        desc: "ไม้จริง+กำมะหยี่ ฝนเล็บ นอน เกาะ ครบ",
        img: U("1557495655-43d64b073090") },
      { name: "สายจูงหมา Retractable 5m",     price: 590,  stock: 45, tags: ["สายจูง","หมา","retractable"], weight: 300,
        desc: "รับน้ำหนัก 50kg กดล็อคอัตโนมัติ กว้าง 5m",
        img: U("1587300003388-59208cc962cb") },
      { name: "ที่นอนสัตว์เลี้ยง Fluffy L",  price: 890,  stock: 25, tags: ["ที่นอน","pet bed","นุ่ม"], weight: 900,
        desc: "ขนนุ่มมาก เครื่องซักผ้าได้ กันน้ำด้านล่าง",
        img: U("1552053831-71594a27632d") },
      { name: "ของเล่นแมว 10 ชิ้น/เซต",      price: 290,  stock: 60, tags: ["ของเล่นแมว","cat toy","เซต"], weight: 200,
        desc: "ขนนก, ลูกบอล, หนู, เลเซอร์ ครบทุกประเภท",
        img: U("1526336024174-e58f5cdd8e13") },
      { name: "แชมพูหมาสูตรออร์แกนิค",       price: 390,  stock: 50, tags: ["แชมพูหมา","ออร์แกนิค","ลาเวนเดอร์"], weight: 350,
        desc: "ออร์แกนิค กลิ่นลาเวนเดอร์ ไม่刺激ผิว pH สมดุล",
        img: U("1587300003388-59208cc962cb") },
      { name: "อ่างน้ำพุแมว 2L",             price: 1290, stock: 20, tags: ["อ่างน้ำ","cat fountain","ฟิลเตอร์"], weight: 600,
        desc: "ฟิลเตอร์ 3 ชั้น เสียงเงียบ น้ำไหลเวียนสะอาด",
        img: U("1548366086-7f1b76106622") },
      { name: "กรงแมว Foldable 3 ชั้น",      price: 3900, stock: 8,  tags: ["กรง","แมว","foldable"], weight: 10000,
        desc: "พับเก็บได้ พื้นที่กว้าง ล้อล่าง ประตู 2 บาน",
        img: U("1533743983669-94fa5c4338ec") },
      { name: "ทรายแมว Tofu 7L",             price: 390,  stock: 70, tags: ["ทรายแมว","tofu","ดับกลิ่น"], weight: 3500,
        desc: "ทรายเต้าหู้ ดับกลิ่น 7 วัน ทิ้งชักโครกได้",
        img: U("1608848461950-0fe51dfc41cb") },
    ],
  },
];

// ── Main ──────────────────────────────────────────────────────────────────────
async function run() {
  await connectDB();

  console.log("\n☁️  Deleting old Cloudinary images...");
  try {
    const result = await cloudinary.api.delete_resources_by_prefix("seed-products/", { resource_type: "image" });
    const count = Object.keys(result.deleted || {}).length;
    console.log(`   ✓ Deleted ${count} old image(s)`);
    try { await cloudinary.api.delete_folder("seed-products"); } catch (_) {}
  } catch (err) {
    console.log(`   ⚠ Cloudinary cleanup skipped: ${err.message}`);
  }

  console.log("\n🗑️  Clearing previous seed data...");
  await Product.deleteMany({});
  await Shop.deleteMany({});
  await User.deleteMany({ role: { $ne: "admin" } });
  console.log("   ✓ Cleared");

  const passwordHash = await bcrypt.hash("Test1234!", 10);

  console.log("\n👤 Creating seller users...");
  const createdUsers = await User.insertMany(
    SELLERS.map((s) => ({ ...s, password: passwordHash, role: "seller", isActive: true }))
  );
  console.log(`   ✓ ${createdUsers.length} sellers created`);

  for (let i = 0; i < SHOPS_META.length; i++) {
    const meta = SHOPS_META[i];
    const owner = createdUsers[i];

    console.log(`\n🏪 [${i + 1}/10] ${meta.name}`);

    const shop = await Shop.create({
      name: meta.name,
      slug: meta.slug,
      ownerUserId: owner._id,
      description: meta.description,
      status: "active",
      kycStatus: "verified",
      kycUpdatedAt: new Date(),
      shipFromAddress: { street: "123 ถนนหลัก", city: meta.city, country: "Thailand", isDefault: true },
    });

    const products = [];
    for (let j = 0; j < meta.products.length; j++) {
      const pd = meta.products[j];
      process.stdout.write(`   📦 ${pd.name} — uploading image...`);
      let imagePublicIds = [];
      try {
        const publicId = await uploadFromUrl(pd.img);
        imagePublicIds = [publicId];
        console.log(" ✓");
      } catch (err) {
        console.log(` ✗ (${err.message})`);
      }
      products.push({
        shopId: shop._id,
        name: pd.name,
        slug: `${meta.slug}-${pd.name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-")}-${j}`,
        description: pd.desc,
        price: pd.price,
        stockQty: pd.stock,
        weight: pd.weight || 0,
        tags: pd.tags || [],
        imagePublicIds,
        categories: meta.categories,
        status: "active",
      });
    }
    await Product.insertMany(products);
    console.log(`   ✓ ${products.length} products created`);
  }

  console.log("\n✅ Seed complete!");
  console.log("   Seller accounts: seller01@test.com — seller10@test.com");
  console.log("   Password: Test1234!");
  await mongoose.connection.close();
}

run().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  mongoose.connection.close();
  process.exit(1);
});
