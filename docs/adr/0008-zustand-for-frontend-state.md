# ADR-0008: Zustand for Global Frontend State

**Date**: 2026-05-23
**Status**: accepted
**Deciders**: wuttiphong

## Context

Frontend ต้องการ global state สำหรับ 2 ส่วนหลัก: (1) auth session — ข้อมูลผู้ใช้ที่ login อยู่ ใช้ใน Header, ProtectedRoute, และทุก page ที่แสดง user info (2) cart — items, count badge, และ mutation (add/update/remove) ที่เกิดถี่และต้องการ re-render เฉพาะ component ที่ subscribe

## Decision

ใช้ Zustand สำหรับ `authStore` และ `cartStore` เป็น global stores แทน React Context API หรือ Redux Toolkit

## Alternatives Considered

### Alternative 1: React Context API + useReducer
- **Pros**: built-in, ไม่ต้อง install package
- **Cons**: ทุก consumer re-render เมื่อ context value เปลี่ยน (ไม่มี selector), boilerplate มาก (Provider, reducer, dispatch)
- **Why not**: cart mutation เกิดบ่อยและจำนวน consumer มาก Context จะทำให้ re-render ไม่จำเป็น

### Alternative 2: Redux Toolkit
- **Pros**: DevTools ดี, มาตรฐานอุตสาหกรรม, middleware ecosystem
- **Cons**: boilerplate มาก (slice, action, thunk), overkill สำหรับ 2 stores
- **Why not**: Zustand ให้ประโยชน์เดียวกันด้วยโค้ดน้อยกว่า 10x

### Alternative 3: TanStack Query (React Query)
- **Pros**: server state management ครบ (cache, refetch, invalidation)
- **Cons**: ไม่ใช่ global client state manager, ต้องใช้ร่วมกับ store อยู่ดี
- **Why not**: ควรใช้ร่วมกันไม่ใช่แทนกัน — TanStack Query สำหรับ server data, Zustand สำหรับ client-only state (cart, auth session)

## Consequences

### Positive
- Selector-based subscription → re-render เฉพาะ component ที่ใช้ state ที่เปลี่ยน
- API เรียบง่าย: `const count = useCartStore(s => s.items.length)`
- ไม่ต้องใช้ Provider wrapper ใน App.jsx

### Negative
- เพิ่ม dependency (`zustand` package)
- ทีมต้องเรียนรู้ Zustand pattern (ไม่ใช่ built-in)

### Risks
- Store state หาย เมื่อ page refresh → ลด risk ด้วย `persist` middleware สำหรับ cart (localStorage)
- Auth state ควร sync กับ server เสมอ → `authStore` ควร call GET /me เมื่อ app mount เพื่อ validate session
