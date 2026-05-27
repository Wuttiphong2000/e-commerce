# ADR-0003: Embedded Cart and Addresses in User Document

**Date**: 2026-05-23
**Status**: accepted
**Deciders**: wuttiphong

## Context

Cart และ Address เป็นข้อมูลที่อ่านร่วมกับ User เสมอ (ทุก request ที่ login จะต้องการ cart count, checkout ต้องการ addresses) การแยกเป็น collection ต่างหากจะต้องทำ populate/join ทุกครั้ง CartItem ออกแบบให้เป็น snapshot (บันทึก name, price, image ณ เวลาเพิ่มลงตะกร้า) เพื่อป้องกันการเปลี่ยนแปลงราคาหลังจากนั้น

## Decision

เก็บ `cartdata: [CartItem]` และ `addresses: [Address]` เป็น embedded arrays ใน User document โดย CartItem มี `_id: true` เพื่อใช้เป็น reference key ในการ update/delete

## Alternatives Considered

### Alternative 1: Cart เป็น Collection แยก (Cart model)
- **Pros**: ง่ายต่อการ query cart โดยไม่ดึง User fields อื่น, รองรับ guest cart ได้
- **Cons**: ต้อง populate ทุกครั้งที่ต้องการ cart, เพิ่ม round-trip
- **Why not**: ไม่มี requirement สำหรับ guest cart ในระยะนี้, read pattern เสมอเป็น "user + cart"

### Alternative 2: Addresses เป็น Collection แยก
- **Pros**: share address ข้าม users ได้ (เช่น office address)
- **Cons**: ไม่มี use case ใน marketplace นี้, เพิ่ม complexity เปล่า
- **Why not**: address ผูกกับ user คนเดียว ไม่จำเป็นต้อง share

## Consequences

### Positive
- `GET /me` return user + cart + addresses ใน single query
- Checkout snapshot address ทำได้ง่าย (copy embedded object ไปยัง Order)
- CartItem มี `_id` → update/delete ด้วย `$set`/`$pull` บน array element ได้

### Negative
- User document โตขึ้นตามจำนวน cart items และ addresses
- Cart ขนาดใหญ่มาก (>100 items) อาจกระทบ document size limit (16MB) — ไม่น่าเกิดใน practice

### Risks
- Cart ไม่ sync กับ product price จริง → ยอมรับ: ราคา snapshot เป็น intent, validate stock ตอน checkout
