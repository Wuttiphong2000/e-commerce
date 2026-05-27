# ADR-0001: MongoDB as Primary Datastore

**Date**: 2026-05-23
**Status**: accepted
**Deciders**: wuttiphong

## Context

แอปเป็น multi-vendor marketplace ที่ Product schema มี variants หลากหลายรูปแบบ (attrs เป็น Map ไม่คงที่), Cart เป็น snapshot ของสินค้า ณ เวลาซื้อ, และ Shop มี embedded arrays หลายชุด (pickupLocations, audit log) การ model ด้วย relational schema จะต้องใช้หลาย JOIN และ schema migration บ่อยเมื่อโครงสร้างเปลี่ยน

## Decision

ใช้ MongoDB ผ่าน Mongoose ODM เป็น primary datastore เพียงตัวเดียว ไม่มี secondary SQL database

## Alternatives Considered

### Alternative 1: PostgreSQL
- **Pros**: ACID transactions เต็มรูปแบบ, foreign key constraints, mature tooling
- **Cons**: variant attrs แบบ dynamic key ต้องใช้ JSONB หรือ EAV table, JOIN หลายชั้นสำหรับ cart+product+shop
- **Why not**: schema ของ Product variants และ CartItem snapshot ไม่เหมาะกับ rigid relational model ในระยะ early development

### Alternative 2: PostgreSQL + MongoDB (polyglot)
- **Pros**: ใช้แต่ละตัวตาม use case
- **Cons**: ต้องดูแล 2 connection pool, 2 migration path, consistency ข้ามสองระบบ
- **Why not**: ซับซ้อนเกินไปสำหรับทีมขนาดเล็ก

## Consequences

### Positive
- Schema-flexible รองรับ Product variants รูปแบบใหม่โดยไม่ต้อง migration
- Embedded documents (cart, addresses) ทำให้ read เป็น single query
- Mongoose ให้ schema validation + middleware ในระดับ ODM

### Negative
- ไม่มี multi-document ACID transaction โดย default (ต้องใช้ session ถ้าต้องการ)
- ไม่มี referential integrity — orphaned documents เป็นไปได้

### Risks
- Cart snapshot อาจเก่าถ้าไม่ sync กับราคาจริง → ยอมรับ: snapshot เป็น design intent
- Collection ขนาดใหญ่ต้องพึ่ง indexes อย่างระมัดระวัง → ลด risk ด้วย indexes ที่กำหนดไว้ใน schema แล้ว
