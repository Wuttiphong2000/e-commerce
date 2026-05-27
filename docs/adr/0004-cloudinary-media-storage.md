# ADR-0004: Cloudinary for Media Storage

**Date**: 2026-05-23
**Status**: accepted
**Deciders**: wuttiphong

## Context

แอปต้องการ upload รูปภาพสำหรับ product (หลายรูป), shop logo/banner, และ user avatar ไฟล์รูปภาพมีขนาดใหญ่และต้องให้ public URL แก่ frontend โดยตรง การเก็บบน local disk ของ server ทำให้ horizontal scaling ยาก (แต่ละ instance มี disk แยก)

## Decision

ใช้ Cloudinary เป็น media storage ผ่าน `multer-storage-cloudinary` โดยรูปภาพถูก stream จาก client → Express → Cloudinary โดยตรง ไม่แตะ local disk เลย บันทึกเฉพาะ `publicId` ใน MongoDB

## Alternatives Considered

### Alternative 1: Local disk storage (multer diskStorage)
- **Pros**: ง่ายที่สุด, ไม่มี external dependency
- **Cons**: ไม่ scale ใน multi-instance deploy, ต้องจัดการ static file serving เอง
- **Why not**: เป็น bottleneck ทันทีที่ deploy บน PaaS หลาย instance

### Alternative 2: AWS S3
- **Pros**: industry standard, pricing ถูกกว่า Cloudinary ที่ scale ใหญ่
- **Cons**: ต้อง configure CDN แยก (CloudFront) สำหรับ image optimization, setup ซับซ้อนกว่า
- **Why not**: Cloudinary มี transform/resize built-in ซึ่งจำเป็นสำหรับ product thumbnails, เร็วกว่าสำหรับ MVP

## Consequences

### Positive
- Zero local disk usage → stateless server
- Built-in image transformation (resize, crop, format conversion) ผ่าน URL params
- CDN delivery โดยอัตโนมัติ

### Negative
- ผูกกับ Cloudinary vendor
- Free tier มี limit (25 credits/month) → ต้อง monitor usage

### Risks
- Cloudinary downtime กระทบ upload → ลด risk ด้วย error handling ที่ชัดเจนและ retry logic
- publicId ที่เก็บใน MongoDB อาจ orphan ถ้าลบ product แล้วไม่ลบ Cloudinary → ต้องมี cleanup job (planned)
