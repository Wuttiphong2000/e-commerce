# Tasks — Full-Stack E-Commerce

> อ้างอิง: [architecture.md](./architecture.md) | ADRs: [docs/adr/](./adr/README.md)
>
> Status: `[ ]` todo · `[x]` done · `[-]` in progress · `[s]` skipped

---

## ~~Phase 0 — Frontend Foundation~~ ✅ DONE

งานนี้ต้องเสร็จก่อนทุก Phase อื่นของ frontend

### P0-1 Install frontend dependencies ✅
```
Layer: Frontend
Deps: —
```
- [x] `npm install react-router-dom` (v7)
- [x] `npm install zustand`
- [x] `npm install axios`
- [x] UI library → **Tailwind CSS v4** (`@tailwindcss/vite`) + `clsx` + `tailwind-merge` + `lucide-react`

### P0-2 ตั้งค่า axios instance ✅
```
Layer: Frontend
File: client/src/api/axiosClient.js
Deps: P0-1
```
- [x] `baseURL = import.meta.env.VITE_API_URL` (จาก `client/.env`)
- [x] `withCredentials: true` (ส่ง cookie อัตโนมัติ)
- [x] interceptor สำหรับ 401 → redirect to `/login`

### P0-3 ตั้งค่า React Router ✅
```
Layer: Frontend
File: client/src/main.jsx, client/src/router.jsx
Deps: P0-1
```
- [x] `createBrowserRouter` พร้อม lazy loading ทุก page
- [x] `<ProtectedRoute>` — redirect `/login` ถ้ายังไม่ login
- [x] `<GuestRoute>` — redirect `/` ถ้า login แล้ว
- [x] `<SellerRoute>` — redirect `/` ถ้า role ไม่ใช่ seller/admin
- [x] `<AdminRoute>` — redirect `/` ถ้า role ไม่ใช่ admin

### P0-4 สร้าง Zustand stores ✅
```
Layer: Frontend
Files: client/src/store/authStore.js, cartStore.js
Deps: P0-1
```
- [x] `authStore`: `{ user, isAuth, loading, setUser, clearUser, fetchMe }`
- [x] `cartStore`: `{ items, addItem, updateQty, removeItem, clear }` + `persist` middleware (localStorage)
- [x] `fetchMe()` เรียกใน `main.jsx` ก่อน render เพื่อ validate session

### P0-5 สร้าง Layout components ✅
```
Layer: Frontend
Files: client/src/components/Layout/, Navbar, Footer
Deps: P0-3, P0-4
```
- [x] `<Navbar>` — logo, cart badge (จาก cartStore), user menu, seller/admin shortcuts
- [x] `<Footer>` — basic
- [x] `<RootLayout>` — Navbar + `<Outlet>` + Footer
- [x] 19 placeholder pages สร้างไว้รองรับ lazy routes ทั้งหมด
- [x] `vite.config.js` — เพิ่ม tailwindcss plugin + `@` alias
- [x] `jsconfig.json` — path alias `@/*` → `./src/*`
- [x] `client/.env` — `VITE_API_URL=http://localhost:5000`
- [x] Dev server รันได้ที่ `http://localhost:5173` ✓

---

## ~~Phase 1 — Authentication~~ ✅ DONE

### P1-1 Backend: Logout endpoint ✅
```
Layer: Backend
File: server/src/routers/UserRouter.js, server/src/controllers/userController.js
Deps: —
```
- [x] `DELETE /api/users/session` — clear httpOnly cookie (`res.clearCookie`)
- [x] `requireAuth` middleware ก่อน handler
- [x] แก้ `login` และ `register` ให้ set httpOnly cookie (ADR-0002) แทนการคืน token ใน body

### P1-2 Backend: Cart update & remove ✅
```
Layer: Backend
File: server/src/routers/UserRouter.js, server/src/controllers/userController.js
Deps: —
```
- [x] `PATCH /api/users/cart/:itemId` — update quantity ด้วย `$set` (match `cartdata._id`)
- [x] `DELETE /api/users/cart/:itemId` — ลบ item ด้วย `$pull`
- [x] validate `quantity >= 1` สำหรับ PATCH

### P1-3 Frontend: Register page ✅
```
Layer: Frontend
File: client/src/pages/RegisterPage.jsx
Route: /register (GuestRoute)
Deps: P0-2, P0-3, P0-5
```
- [x] Form: firstname, lastname, username, email, password
- [x] Client-side validation (required, email format, password min 8)
- [x] POST `/api/users/register` → success → redirect `/login`
- [x] แสดง error message จาก API

### P1-4 Frontend: Login page ✅
```
Layer: Frontend
File: client/src/pages/LoginPage.jsx
Route: /login (GuestRoute)
Deps: P0-2, P0-3, P0-4, P0-5
```
- [x] Form: email, password
- [x] POST `/api/users/login` → success → `authStore.setUser()` → redirect `/`
- [x] แสดง error message (รวม rate-limit message)

### P1-5 Frontend: Logout ✅
```
Layer: Frontend
File: client/src/components/Navbar
Deps: P1-1, P0-4
```
- [x] ปุ่ม Logout ใน user menu → `DELETE /api/users/session` → `authStore.clearUser()` + `cartStore.clear()` → redirect `/login`

### P1-6 Frontend: User profile page ✅
```
Layer: Frontend
File: client/src/pages/ProfilePage.jsx
Route: /profile (ProtectedRoute)
Deps: P0-2, P0-3, P0-4
```
- [x] แสดงข้อมูลส่วนตัว (name, username, email, phone)
- [x] แก้ไขโปรไฟล์ (PATCH `/api/users/me`)
- [x] เปลี่ยนรหัสผ่าน (PATCH `/api/users/me/password`)
- [x] จัดการที่อยู่ (list, add, set default, delete)

---

## ~~Phase 2 — Product Browsing (Public)~~ ✅ DONE

### P2-1 Backend: Public product listing endpoint ✅
```
Layer: Backend
File: server/src/routers/ProductRouter.js
Deps: —
```
- [x] `GET /api/products` — query params: `page`, `limit`, `category`, `minPrice`, `maxPrice`, `sort` (price_asc/price_desc/newest), `q` (text search)
- [x] filter เฉพาะ `status: "active"` เท่านั้น
- [x] return: `{ items, total, page, pages }`
- [x] ใช้ indexes ที่มีอยู่แล้ว (categories, price, createdAt, text)

### P2-2 Backend: Public product detail endpoint ✅
```
Layer: Backend
File: server/src/routers/ProductRouter.js
Deps: —
```
- [x] `GET /api/products/:slug` — param เป็น slug หรือ id
- [x] populate `shopId` (name, slug, logoUrl, ratingAvg) บางส่วน
- [x] return 404 ถ้า status ไม่ใช่ "active"

### P2-3 Frontend: Home / Product listing page ✅
```
Layer: Frontend
File: client/src/pages/HomePage.jsx
Route: / (Public)
Deps: P0-2, P0-5, P2-1
```
- [x] Grid แสดง product cards (image, name, price, shop name, rating)
- [x] Filter sidebar: category, price range
- [x] Sort dropdown
- [x] Search bar (debounced, ส่ง `?q=`)
- [x] Pagination

### P2-4 Frontend: Product detail page ✅
```
Layer: Frontend
File: client/src/pages/ProductDetailPage.jsx
Route: /product/:slug (Public)
Deps: P0-2, P0-5, P2-2
```
- [x] แสดงรูปภาพ (gallery)
- [x] ชื่อ, ราคา, สต็อก, รายละเอียด
- [x] Variant picker (ถ้ามี variants) → เปลี่ยนราคา/stock ตาม variant ที่เลือก
- [x] ปุ่ม "เพิ่มลงตะกร้า" → POST `/api/users/cart` → `cartStore.addItem()`
- [x] แสดงข้อมูลร้าน (logo, ชื่อ, rating) + ลิงก์ไปหน้าร้าน

### P2-5 Frontend: Shop storefront page ✅
```
Layer: Frontend
File: client/src/pages/ShopPage.jsx
Route: /shop/:slug (Public)
Deps: P0-2, P0-5
```
- [x] แสดง banner, logo, ชื่อร้าน, คำอธิบาย, rating
- [x] รายการสินค้าของร้าน (GET `/api/shops/:slug/products`)
- [x] Pagination

---

## ~~Phase 3 — Cart & Checkout~~ ✅ DONE

### P3-1 Frontend: Cart page ✅
```
Layer: Frontend
File: client/src/pages/CartPage.jsx
Route: /cart (ProtectedRoute)
Deps: P0-2, P0-4, P1-2
```
- [x] แสดง items จาก backend (GET /api/users/cart) พร้อมรูป, ชื่อ, ราคา, จำนวน
- [x] เปลี่ยน quantity → PATCH `/api/users/cart/:itemId`
- [x] ลบ item → DELETE `/api/users/cart/:itemId`
- [x] แสดง subtotal รวม
- [x] ปุ่ม "สั่งซื้อ" → ไป `/checkout`

### P3-2 Backend: Order model ✅
```
Layer: Backend
File: server/src/models/Order.js
Deps: —
```
- [x] สร้าง `Order` schema (userId, items snapshot, shippingAddress snapshot, status, paymentMethod, totals)
- [x] index: `userId`, `status`, `createdAt`

### P3-3 Backend: Order endpoints ✅
```
Layer: Backend
File: server/src/routers/OrderRouter.js, server/src/controllers/orderController.js
Deps: P3-2
```
- [x] `POST /api/orders` — validate stock → create order → decrement `Product.stockQty` + increment `soldCount` → clear cart
- [x] `GET /api/orders` — ประวัติคำสั่งซื้อของ user ปัจจุบัน (paginated)
- [x] `GET /api/orders/:id` — รายละเอียด (ตรวจสอบ ownership)
- [x] `PATCH /api/orders/:id/cancel` — cancel เฉพาะ status "pending_payment" หรือ "paid"
- [x] register router ใน `server.js`: `app.use("/api/orders", orderRouter)`

### P3-4 Frontend: Checkout page ✅
```
Layer: Frontend
File: client/src/pages/CheckoutPage.jsx
Route: /checkout (ProtectedRoute)
Deps: P0-2, P0-4, P3-3
```
- [x] แสดง order summary (items จาก cart)
- [x] เลือกที่อยู่จัดส่ง (radio จาก `addresses` ของ user)
- [x] เลือก payment method (COD / promptpay / credit_card)
- [x] ปุ่ม "ยืนยันคำสั่งซื้อ" → POST `/api/orders` → clear cart → redirect `/orders/:id`

### P3-5 Frontend: Order history & detail ✅
```
Layer: Frontend
Files: client/src/pages/OrdersPage.jsx, OrderDetailPage.jsx
Routes: /orders (ProtectedRoute), /orders/:id (ProtectedRoute)
Deps: P0-2, P3-3
```
- [x] `/orders` — รายการคำสั่งซื้อ พร้อม status badge
- [x] `/orders/:id` — รายละเอียดครบ (items, ราคา, ที่อยู่, payment method, tracking)
- [x] ปุ่ม "ยกเลิก" ถ้า status ยังยกเลิกได้

---

## ~~Phase 4 — Seller Dashboard~~ ✅ DONE

### P4-1 Frontend: Seller onboarding ✅
```
Layer: Frontend
File: client/src/pages/seller/OpenShopPage.jsx
Route: /seller/open (ProtectedRoute)
Deps: P0-2
```
- [x] Form สมัครเปิดร้าน (ชื่อร้าน, slug, คำอธิบาย, ที่อยู่)
- [x] POST `/api/shops` → redirect to /seller/dashboard

### P4-2 Frontend: Seller dashboard ✅
```
Layer: Frontend
File: client/src/pages/seller/DashboardPage.jsx
Route: /seller/dashboard (SellerRoute)
Deps: P0-2, P0-5
```
- [x] แสดงสถานะร้าน (status, kycStatus)
- [x] Summary: จำนวนสินค้า, คำสั่งซื้อที่รอดำเนินการ (parallel fetch)
- [x] ลิงก์ไป manage products, shop settings, shop storefront

### P4-3 Frontend: Product management (Seller) ✅
```
Layer: Frontend
Files: client/src/pages/seller/ProductsPage.jsx
Route: /seller/products (SellerRoute)
Deps: P0-2, P0-5
```
- [x] ตารางสินค้า (ชื่อ, ราคา, stock, status)
- [x] เพิ่มสินค้า: form + upload image → POST `/api/products`
- [x] แก้ไขสินค้า inline → PATCH `/api/products/:id`
- [x] ลบสินค้า → DELETE `/api/products/:id`

### P4-4 Frontend: Shop settings ✅
```
Layer: Frontend
File: client/src/pages/seller/ShopSettingsPage.jsx
Route: /seller/settings (SellerRoute)
Deps: P0-2
```
- [x] แก้ไขข้อมูลร้าน (PATCH `/api/shops/me`)
- [x] อัปโหลด logo/banner (PATCH `/api/shops/me/images`)
- [x] แก้นโยบาย (PATCH `/api/shops/me/policies`)
- [x] toggle vacation mode (PATCH `/api/shops/me/vacation`)

### P4-5 Backend + Frontend: Seller order management ✅
```
Layer: Both
File: client/src/pages/seller/SellerOrdersPage.jsx
Route: /seller/orders (SellerRoute)
Deps: P3-2, P3-3
```
- [x] Backend: `GET /api/orders/seller-orders` — คำสั่งซื้อที่มีสินค้าจากร้านของฉัน
- [x] Backend: `PATCH /api/orders/:id/ship` — อัปเดต status → shipped + trackingNumber
- [x] Backend: fix productController.js imagePublicIds field
- [x] Frontend: ตารางคำสั่งซื้อ, filter by status
- [x] อัปเดต status (paid/processing → shipped) + tracking number via modal

---

## ~~Phase 5 — Admin Panel~~ ✅ DONE

### P5-1 Backend: Admin endpoints ✅
```
Layer: Backend
File: server/src/routers/AdminRouter.js, server/src/controllers/adminController.js
Deps: —
```
- [x] `GET /api/admin/stats` — dashboard counts (users, shops pending, products pending, orders)
- [x] `GET /api/admin/shops` — list ร้านทั้งหมด (filter by status/kycStatus, paginated)
- [x] `PATCH /api/admin/shops/:id/kyc` — approve/reject KYC
- [x] `PATCH /api/admin/shops/:id/status` — suspend/activate ร้าน (syncs user role)
- [x] `PATCH /api/admin/shops/:id/approve` — อนุมัติร้าน + promote user → seller
- [x] `PATCH /api/admin/shops/:id/reject` — ปฏิเสธร้าน
- [x] `GET /api/admin/products` — list สินค้า (filter by status, paginated, populate shopId)
- [x] `PATCH /api/admin/products/:id/status` — approve/reject สินค้า
- [x] `GET /api/admin/users` — list users (filter by role, paginated)
- [x] ทุก endpoint ผ่าน `requireRole("admin")`

### P5-2 Frontend: Admin panel ✅
```
Layer: Frontend
Files: client/src/pages/admin/
Route: /admin/* (AdminRoute)
Deps: P0-2, P0-5, P5-1
```
- [x] `/admin` — dashboard: stat cards (users, shops pending, products pending, orders)
- [x] `/admin/shops` — ตารางร้าน + filter by status + ปุ่ม approve/reject/KYC/suspend
- [x] `/admin/products` — ตาราง products + filter by status + ปุ่ม approve/suspend
- [x] `/admin/users` — ตาราง users + filter by role

---

## Phase 6 — Polish & Remaining Features

### P6-1 Backend: Review & Rating ✅
```
Layer: Backend
File: server/src/models/Review.js, server/src/controllers/reviewController.js
Deps: P3-2
```
- [x] Review schema: `{ userId, productId, orderId, rating(1-5), comment }` unique per user+product
- [x] `POST /api/products/:id/reviews` — auth required, recalculates ratingAvg/ratingCount
- [x] `GET /api/products/:id/reviews` — paginated, public

### P6-2 Frontend: Review system ✅
```
Layer: Frontend
Deps: P6-1, P2-4
```
- [x] ReviewSection in ProductDetailPage: star display, review list with avatar
- [x] StarPicker + form for logged-in users

### P6-3 Backend: Cloudinary cleanup script
```
Layer: Backend
Deps: —
```
- [s] Skipped — low priority, no orphaned assets yet

### P6-4 Frontend: Error & loading states ✅
```
Layer: Frontend
Deps: ทุก phase ก่อนหน้า
```
- [x] Global ErrorBoundary wrapping RouterProvider in main.jsx
- [x] Zustand toastStore + Toaster component in RootLayout
- [s] Skeleton loaders — already exist on individual pages

### P6-5 SEO & Meta tags
```
Layer: Frontend
Deps: P2-3, P2-4
```
- [s] Skipped — React 19 native document metadata support; low priority for MVP

### P6-6 ทดสอบ end-to-end
```
Layer: Both
Deps: ทุก phase
```
- [ ] flow ครบ: register → login → browse → add to cart → checkout → order
- [ ] seller flow: open shop → add product → manage orders
- [ ] admin flow: KYC approval → product approval

---

## สรุป Priority

| Phase | ความสำคัญ | สถานะ |
|-------|----------|-------|
| P0 Frontend Foundation | Critical | `[x]` DONE |
| P1 Auth | Critical | `[x]` DONE |
| P2 Product Browsing | High | `[~]` backend seller done, public endpoint missing |
| P3 Cart & Checkout | High | `[x]` DONE |
| P4 Seller Dashboard | Medium | `[x]` DONE |
| P5 Admin Panel | Medium | `[x]` DONE |
| P6 Polish | Low | `[ ]` ยังไม่เริ่ม |

> `[~]` = backend บางส่วนเสร็จแล้ว แต่ frontend ยังไม่มี
