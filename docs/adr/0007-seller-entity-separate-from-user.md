# ADR-0007: Seller Entity Separate from User with KYC Lifecycle

**Date**: 2026-05-23
**Status**: accepted
**Deciders**: wuttiphong

## Context

แอปเป็น multi-vendor marketplace ที่ผู้ใช้ทั่วไปสามารถสมัครเป็นผู้ขายได้ ต้องตัดสินใจว่าจะเก็บข้อมูลร้านค้าใน User document เดิม (เป็น embedded object) หรือสร้าง Seller collection แยก platform ต้องการ KYC verification, audit log, และ admin workflow สำหรับ approve/reject ร้าน

## Decision

สร้าง `Seller` collection แยกจาก `User` โดย `Seller.ownerUserId` เป็น reference กลับไปยัง User User มี `role: "seller"` เพื่อ route-level permission check แต่ข้อมูลร้านทั้งหมดอยู่ใน Seller document

## Alternatives Considered

### Alternative 1: Embedded shop ใน User document
- **Pros**: GET /me ได้ข้อมูลร้านทันที, ไม่ต้อง populate
- **Cons**: User document โตมาก (shop มี audit[], pickupLocations[], policies, payout info), admin query ร้านทั้งหมดทำได้ยาก
- **Why not**: admin KYC workflow ต้องการ query ร้านทุกร้านอิสระจาก User, และ audit log ของร้านจะทำให้ User document ใหญ่มากเกินไป

### Alternative 2: Shop collection แยก แต่ไม่มี KYC
- **Pros**: เรียบง่ายกว่า
- **Cons**: ไม่รองรับ admin approval flow ซึ่งจำเป็นสำหรับ marketplace
- **Why not**: KYC เป็น requirement หลักเพื่อป้องกัน fraud

## Consequences

### Positive
- Admin สามารถ query ร้านทุกร้าน (filter by status, kycStatus) ได้ง่าย
- KYC lifecycle (none→submitted→verified/rejected) และ audit log อยู่ใน Seller เดียว
- Seller metrics (ratingAvg, orderCount, totalSalesAmount) แยกจาก User profile

### Negative
- ต้อง populate Seller เมื่อ seller เปิด dashboard (2 queries)
- ต้องดูแล consistency ระหว่าง User.role กับ Seller.status

### Risks
- User role "seller" แต่ Seller.status "suspended" → middleware ต้องตรวจสอบทั้งคู่
- Seller ถูกลบแต่ Product ยังอ้างถึง shopId → ต้องมี cascade delete หรือ soft delete
