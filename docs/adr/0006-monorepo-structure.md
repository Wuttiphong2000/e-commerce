# ADR-0006: Monorepo Structure (client + server)

**Date**: 2026-05-23
**Status**: accepted
**Deciders**: wuttiphong

## Context

โปรเจกต์มี 2 ส่วนหลัก: React frontend และ Express backend ต้องตัดสินใจว่าจะเก็บในที่เดียวกัน (monorepo) หรือแยก 2 repository เพื่อความเป็นอิสระ ทีมเป็นทีมเล็ก (1-2 คน) และต้องการ development experience ที่ง่าย

## Decision

ใช้ monorepo แบบ simple (ไม่ใช้ Turborepo/Nx) โดย `client/` และ `server/` เป็น subdirectory ใน repo เดียว แต่ละ directory มี `package.json` แยกอิสระ

## Alternatives Considered

### Alternative 1: 2 Repositories แยก (client-repo + server-repo)
- **Pros**: deploy pipeline อิสระ, permission control แยก, team ขนาดใหญ่ทำงานแยกกันได้
- **Cons**: ต้องจัดการ 2 repo, PR ที่เกี่ยวกับทั้ง 2 ส่วนต้องเปิด 2 PR, sync version ยาก
- **Why not**: ทีมเล็ก, ไม่มีประโยชน์จาก repo separation

### Alternative 2: Monorepo ด้วย Turborepo/Nx
- **Pros**: shared packages, build caching, task orchestration
- **Cons**: setup overhead มาก, overkill สำหรับ 2 packages
- **Why not**: ไม่มี shared code ระหว่าง client และ server ที่ต้องการ package ร่วม

## Consequences

### Positive
- `git clone` เดียวได้ทั้งโปรเจกต์
- PR เดียวครอบคลุม backend + frontend change
- ง่ายต่อการ review การเปลี่ยนแปลง API ที่กระทบทั้ง 2 ฝั่ง

### Negative
- `git history` รวมกัน — นักพัฒนาต้องระวัง commit scope
- Deploy pipeline ต้อง detect ว่า change อยู่ใน `client/` หรือ `server/` เพื่อ deploy เฉพาะส่วนที่เปลี่ยน

### Risks
- ไม่มี — ความเสี่ยงต่ำมากสำหรับโปรเจกต์ขนาดนี้
