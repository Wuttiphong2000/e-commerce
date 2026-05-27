# ADR-0002: JWT Stored in httpOnly Cookie

**Date**: 2026-05-23
**Status**: accepted
**Deciders**: wuttiphong

## Context

ระบบต้องการ stateless authentication ที่ scale ได้โดยไม่ต้องเก็บ session ใน server memory หรือ Redis ขณะเดียวกันต้องป้องกัน XSS ที่จะขโมย token จาก JavaScript และรองรับ credentials: true สำหรับ cross-origin requests จาก Vite dev server

## Decision

ออก JWT ผ่าน `jsonwebtoken` และส่งกลับเป็น `httpOnly; Secure; SameSite=Strict` cookie แทนการ return token ใน response body และให้ client เก็บใน localStorage

## Alternatives Considered

### Alternative 1: JWT ใน localStorage
- **Pros**: ง่าย, ไม่ต้องตั้งค่า CORS credentials
- **Cons**: JavaScript อ่านได้ → XSS สามารถขโมย token ได้โดยตรง
- **Why not**: security risk ขั้นพื้นฐานที่ยอมรับไม่ได้สำหรับ e-commerce

### Alternative 2: Server-side session (express-session + MongoDB store)
- **Pros**: revoke ได้ทันที, ไม่มีปัญหา token expiry
- **Cons**: stateful, ต้องการ session store (Redis/MongoDB), horizontal scaling ซับซ้อนขึ้น
- **Why not**: เพิ่ม infrastructure dependency โดยไม่จำเป็นในระยะนี้

## Consequences

### Positive
- Token ไม่เข้าถึงได้จาก JavaScript → XSS proof
- Stateless → server ทุก instance ตรวจสอบได้โดยไม่ต้องการ shared store
- `requireAuth` middleware เรียบง่าย: อ่าน cookie → verify → attach `req.auth`

### Negative
- ต้องตั้ง CORS `credentials: true` และ `allowList` สำหรับ frontend origin
- Token revocation ก่อน expiry ทำได้ยาก (ต้องใช้ blacklist หรือ short expiry)
- Logout ต้อง clear cookie ฝั่ง server (DELETE /api/users/session)

### Risks
- CSRF — ลด risk ด้วย `SameSite=Strict` และ CORS allowlist
- Token หมดอายุกลางคัน → แก้ด้วย silent refresh หรือ redirect to login (planned)
