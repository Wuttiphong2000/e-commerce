# ADR-0005: REST API over GraphQL

**Date**: 2026-05-23
**Status**: accepted
**Deciders**: wuttiphong

## Context

Backend ต้องเปิด API ให้ frontend React และอนาคตอาจมี mobile app ต้องเลือกระหว่าง REST ซึ่งทีมคุ้นเคยอยู่แล้ว กับ GraphQL ซึ่งแก้ปัญหา over-fetching/under-fetching ได้ดีกว่า แต่ต้องการ setup และ learning curve เพิ่มเติม

## Decision

ใช้ RESTful API ตาม resource-based URL design (`/api/users`, `/api/shops`, `/api/products`, `/api/orders`) โดยไม่มี GraphQL layer

## Alternatives Considered

### Alternative 1: GraphQL (Apollo Server)
- **Pros**: client กำหนด shape ของ response เอง, ลด over-fetching, single endpoint
- **Cons**: setup ซับซ้อน (schema, resolvers, dataloader), learning curve, overkill สำหรับ CRUD-heavy app
- **Why not**: ความต้องการของ frontend ใน e-commerce มีรูปแบบค่อนข้างคงที่ ไม่จำเป็นต้อง flexible query language

### Alternative 2: tRPC
- **Pros**: type-safe end-to-end, เหมาะกับ TypeScript monorepo
- **Cons**: codebase นี้ใช้ JavaScript ไม่ใช่ TypeScript, ผูกกับ Node.js ecosystem
- **Why not**: ไม่คุ้มต้นทุน migrate มา TypeScript เพื่อ tRPC เพียงอย่างเดียว

## Consequences

### Positive
- ทีมคุ้นเคย, documentation ง่าย (Postman/Swagger)
- Express router pattern เรียบง่าย, middleware chain ชัดเจน
- Caching ง่ายกว่า (HTTP cache headers, CDN)

### Negative
- Over-fetching บางกรณี (เช่น GET /me return ทั้ง user object ทั้งที่ต้องการแค่ชื่อ)
- Versioning ต้องวางแผนเอง (/api/v2/...) ถ้าเปลี่ยน schema ในอนาคต

### Risks
- Over-fetching ใน mobile app — ลด risk ด้วย query params สำหรับ field selection ถ้าจำเป็น
