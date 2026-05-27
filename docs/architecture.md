# Architecture — Full-Stack E-Commerce

## Overview

Multi-vendor marketplace แบบ monorepo แยก `client/` (React) และ `server/` (Express.js) คุยกันผ่าน REST API โดยมี MongoDB เป็น database หลัก และ Cloudinary สำหรับ media storage

```
e-commerce/
├── client/          # React 19 + Vite 7
├── server/          # Express 5 + Mongoose 8
└── docs/            # Architecture & planning docs
```

---

## Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React + Vite | React 19, Vite 7 |
| Backend | Express.js | 5.x |
| Database | MongoDB (Mongoose ODM) | Mongoose 8 |
| Auth | JWT (httpOnly cookie) | jsonwebtoken 9 |
| Media | Cloudinary | v1 SDK |
| Security | Helmet, HPP, CORS, Rate-limit | — |
| Validation | express-validator | 7 |

---

## Backend Architecture

### Entry Point

```
server/src/server.js
  → applySecurity(app)       # helmet, cors, hpp, compression, rate-limit
  → /api/users               # UserRouter
  → /api/shops               # ShopRouter
  → /api/products            # ProductRouter (seller-facing)
  → /api/admin               # AdminRouter
  → notFoundHandler
  → errorHandler
```

### Layer Structure

```
server/src/
├── configs/
│   └── db.js                # Mongoose connect
├── models/
│   ├── User.js              # user, roles, cart, addresses
│   ├── Shop.js              # Seller — shop profile, KYC, payout
│   └── Product.js           # Product — variants, stock, status lifecycle
├── controllers/
│   ├── userController.js    # register, login, me, cart, addresses, avatar
│   ├── shopController.js    # createShop, updateShop, images, policies, vacation
│   └── productController.js # addProduct, getMyProducts, update, delete
├── routers/
│   ├── UserRouter.js
│   ├── ShopRouter.js
│   ├── ProductRouter.js
│   └── AdminRouter.js
├── middleware/
│   ├── auth.js              # requireAuth, optionalAuth, requireRole
│   ├── upload.js            # multer + cloudinary storage
│   └── errorHandler.js      # notFoundHandler, errorHandler
├── scripts/
│   └── seedAdmin.js         # สร้าง admin user เริ่มต้น
└── security.js              # applySecurity, loginLimiter
```

### Data Models

#### User
```
User {
  firstname, middlename, lastname
  username (unique, lowercase)
  email (unique, lowercase)
  password (select: false)
  role: "user" | "seller" | "admin"
  profileImageUrl, profileImagePublicId
  phone
  addresses: [Address]        ← embedded
  cartdata: [CartItem]        ← embedded (snapshot: name, price, image)
  lastLogin, passwordChangedAt
  isActive
}
```

#### Seller (Shop)
```
Seller {
  name, slug (unique)
  ownerUserId → ref User
  status: "pending" | "active" | "suspended" | "closed"
  kycStatus: "none" | "submitted" | "verified" | "rejected"
  logoUrl, bannerUrl, description, tags
  shipFromAddress, pickupLocations[]
  codEnabled, supportedCarriers[]
  payoutMethod, bankAccount
  ratingAvg, orderCount, totalSalesAmount
  vacationMode, strikeCount
  audit[]                     ← admin action log
}
```

#### Order
```
Order {
  userId → ref User
  items: [OrderItem]          ← snapshot ณ เวลาซื้อ
  shippingAddress: Address    ← snapshot ณ เวลาซื้อ
  status: "pending_payment" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded"
  paymentMethod: "cod" | "credit_card" | "promptpay"
  paymentStatus: "pending" | "paid" | "failed" | "refunded"
  subtotal, shippingFee, discount, total
  trackingNumber
  cancelReason, note
}

OrderItem {
  shopId → ref Seller
  productId → ref Product
  variantId
  productName, price, quantity, imagePublicId  ← snapshot
}
```

#### Product
```
Product {
  shopId → ref Seller
  name, slug
  description
  imagePublicIds[]
  categories[], tags[]
  status: "draft"|"pending"|"approved"|"rejected"|"active"|"suspended"
  variants: [{ attrs(Map), price, stockQty, skuCode, weight, dimensions }]
  price, stockQty, skuCode
  soldCount, ratingAvg, ratingCount
}

Indexes: shopId+slug(unique), categories, price, createdAt, status, text(name+description)
```

### Authentication Flow

```
POST /api/users/login
  → loginLimiter (10 req/15min)
  → bcrypt.compare password
  → sign JWT → set httpOnly cookie
  → return user object (no password)

requireAuth middleware
  → read JWT from cookie
  → verify → attach req.auth = { userId, role }

requireRole("admin"|"seller")
  → check req.auth.role
```

### Security Layers

| Layer | Measure |
|-------|---------|
| Transport | CORS allowlist via `FRONTEND_URL` env |
| Headers | Helmet (CSP, HSTS, X-Frame, etc.) |
| Param pollution | HPP |
| Login brute-force | Rate-limit 10/15min |
| Global rate-limit | 1000/15min (production only) |
| Payload | express-validator on every mutating endpoint |
| Password | bcrypt hash (select: false on schema) |
| Media | Cloudinary signed upload via multer-storage-cloudinary |

---

## Frontend Architecture

### Current State

```
client/src/
├── main.jsx       # ReactDOM.createRoot entry
├── App.jsx        # Root component
├── App.css
├── index.css
└── assets/
```

### Planned Structure

```
client/src/
├── api/           # axios instances + per-resource hooks
├── components/    # Reusable UI (Button, Input, Modal, …)
├── features/      # Feature slices
│   ├── auth/      # Login, Register, ProtectedRoute
│   ├── shop/      # Shop dashboard, product management
│   ├── product/   # Public product listing, detail page
│   ├── cart/      # Cart sidebar/page
│   └── checkout/  # Checkout flow, address picker
├── pages/         # Route-level components
├── hooks/         # Shared custom hooks
├── store/         # Global state (Context or Zustand)
└── utils/         # Formatters, validators
```

### State Management

**Zustand** — global store สำหรับ auth session และ cart state

```
store/
├── authStore.js    # currentUser, isAuthenticated, login(), logout()
└── cartStore.js    # items[], addItem(), updateQty(), removeItem(), clear()
```

เหตุผล: เบากว่า Redux, API เรียบง่ายกว่า Context+useReducer สำหรับ cart ที่ mutation บ่อย และ React 19 ยังไม่มี built-in global state

### Routing Plan (React Router v7)

| Path | Page | Auth |
|------|------|------|
| `/` | Home / Product listing | Public |
| `/product/:slug` | Product detail | Public |
| `/shop/:slug` | Shop storefront | Public |
| `/login` | Login | Guest only |
| `/register` | Register | Guest only |
| `/cart` | Cart | Auth |
| `/checkout` | Checkout | Auth |
| `/profile` | User profile, addresses | Auth |
| `/seller/dashboard` | Seller dashboard | Seller |
| `/seller/products` | Product management | Seller |
| `/admin` | Admin panel | Admin |

---

## API Endpoints (Existing)

### Users `/api/users`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | — | สมัครสมาชิก |
| POST | `/login` | — | เข้าสู่ระบบ (set cookie) |
| GET | `/me` | Auth | ข้อมูลผู้ใช้ปัจจุบัน |
| PATCH | `/me` | Auth | แก้ไขโปรไฟล์ |
| PATCH | `/me/password` | Auth | เปลี่ยนรหัสผ่าน |
| PATCH | `/me/avatar` | Auth | อัปโหลดรูปโปรไฟล์ |
| GET | `/me/addresses` | Auth | รายการที่อยู่ |
| POST | `/me/addresses` | Auth | เพิ่มที่อยู่ |
| PATCH | `/me/addresses/:idx` | Auth | แก้ไขที่อยู่ |
| PATCH | `/me/addresses/:idx/default` | Auth | ตั้งเป็นที่อยู่หลัก |
| DELETE | `/me/addresses/:idx` | Auth | ลบที่อยู่ |
| GET | `/cart` | Auth | ดูตะกร้า |
| POST | `/cart` | Auth | เพิ่มสินค้าในตะกร้า |
| PATCH | `/cart/:itemId` | Auth | แก้ quantity (itemId = cartItem._id) |
| DELETE | `/cart/:itemId` | Auth | ลบสินค้าออกจากตะกร้า |
| DELETE | `/session` | Auth | logout (clear httpOnly cookie) |
| DELETE | `/me` | Auth | ลบบัญชีตัวเอง |
| DELETE | `/` | Admin | ลบบัญชีผู้ใช้ (admin) |

### Shops `/api/shops`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | Auth | สมัครเปิดร้าน |
| GET | `/me` | Seller | ข้อมูลร้านตัวเอง |
| PATCH | `/me` | Seller | แก้ไขร้าน |
| PATCH | `/me/address` | Seller | แก้ที่อยู่ร้าน |
| POST | `/me/pickups` | Seller | เพิ่มจุดรับสินค้า |
| PATCH | `/me/pickups/:idx` | Seller | แก้ไขจุดรับสินค้า |
| DELETE | `/me/pickups/:idx` | Seller | ลบจุดรับสินค้า |
| PATCH | `/me/pickups/:idx/default` | Seller | ตั้งเป็นจุดหลัก |
| PATCH | `/me/policies` | Seller | แก้นโยบายร้าน |
| PATCH | `/me/vacation` | Seller | เปิด/ปิดโหมดพักร้อน |
| PATCH | `/me/images` | Seller | อัปโหลด logo/banner |
| GET | `/me/status` | Seller | สถานะร้านย่อ |
| GET | `/:slug/products` | Public | สินค้าสาธารณะของร้าน |

### Products `/api/products` (Seller-facing)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | Seller | เพิ่มสินค้า (พร้อม image) |
| GET | `/me` | Seller | สินค้าของร้านฉัน |
| PATCH | `/:id` | Seller | แก้ไขสินค้า |
| DELETE | `/:id` | Seller | ลบสินค้า |

### Planned: Public Products & Orders

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/products` | Public | รายการสินค้า (filter, sort, search) |
| GET | `/api/products/:slug` | Public | รายละเอียดสินค้า |
| POST | `/api/orders` | Auth | สร้างคำสั่งซื้อ |
| GET | `/api/orders` | Auth | ประวัติคำสั่งซื้อ |
| GET | `/api/orders/:id` | Auth | รายละเอียดคำสั่งซื้อ |
| PATCH | `/api/orders/:id/cancel` | Auth | ยกเลิกคำสั่งซื้อ |

---

## Missing Features (To Build)

| Feature | Backend | Frontend |
|---------|---------|----------|
| Public product listing + search | GET /api/products | Product page + filters |
| Product detail page | GET /api/products/:slug | Detail page + variant picker |
| Cart update/remove | PATCH/DELETE /cart/:itemId | Cart UI |
| Checkout + Order creation | POST /api/orders | Checkout flow |
| Order model | Order.js model | Order history page |
| Payment integration | Payment gateway hook | Payment page |
| Review & Rating | POST /api/products/:id/reviews | Review form |
| Admin KYC approval | PATCH /api/admin/shops/:id | Admin panel |
| Logout endpoint | DELETE /api/users/session | Logout button |
| Refresh token / session check | — | Silent refresh |

---

## Environment Variables

### Server (`.env`)
```
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=...
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### Client (`.env`)
```
VITE_API_URL=http://localhost:5000
```

---

## Data Flow — Checkout (Planned)

```
User selects items in Cart
  → POST /api/orders
      body: { items[], addressId, paymentMethod }
  → Server validates stock
  → Creates Order document
  → Decrements Product.stockQty
  → Triggers payment gateway
  → Returns order confirmation
  → Frontend redirects to /orders/:id
```

---

## Non-Functional Requirements

| Concern | Approach |
|---------|---------|
| Input validation | express-validator on all mutating routes |
| Error handling | Centralised errorHandler middleware |
| Image uploads | Cloudinary via multer (no local disk storage) |
| Compression | compression middleware on all responses |
| HTTPS | Enforced by hosting layer (not in-app) |
| Scalability | Stateless JWT — horizontally scalable |
| Database indexes | Defined on all query-hot fields |
