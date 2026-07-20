# MarketLens Release Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ตรวจ MarketLens ก่อนเผยแพร่สู่ GitHub ให้ไฟล์ชั่วคราวและข้อมูลลับไม่ถูกติดตาม ชุดทดสอบผ่าน และมี Local release-preparation commit โดยไม่ Push หรือ Deploy

**Architecture:** ใช้ `.gitignore` เป็นด่านแรก ตรวจสถานะจริงด้วย `git check-ignore` และ `git ls-files` ใช้ secret scanner ที่ตรวจทั้ง working tree/index และทุก commit ที่มีอยู่ จากนั้นรัน release verification และบันทึกหลักฐานในเอกสาร audit

**Tech Stack:** Git, Node.js, Next.js, TypeScript, Vitest, Playwright

## Global Constraints

- ห้ามเพิ่ม Git remote, Push หรือ Deploy
- ห้ามใช้ API key จริง
- `.env.example` ต้องติดตามได้ แต่ `.env` และตัวแปร local ต้องถูก ignore
- ห้ามลดหรือลบ test เพื่อให้ผ่าน
- แก้เฉพาะปัญหาที่พบจาก release audit

---

### Task 1: Git ignore และ tracked-file audit

**Files:**
- Modify: `.gitignore`

- [ ] ทำให้ pattern ครบตามรายการที่ผู้ใช้กำหนด
- [ ] ตรวจด้วย `git check-ignore -v` และยืนยันว่า `.env.example` ไม่ถูก ignore
- [ ] ตรวจ `git ls-files` ว่าไม่มี generated/local file ถูกติดตาม

### Task 2: Secret scanner coverage

**Files:**
- Modify: `scripts/secret-scan.mjs` เมื่อพบว่าไม่ครอบคลุม history
- Test: `scripts/secret-scan.test.mjs` หรือ fixture ชั่วคราวที่ไม่ถูก commit

- [ ] เขียน regression test ให้ล้มเหลวเมื่อ scanner ยังไม่ตรวจ Git history
- [ ] เพิ่มการตรวจ working tree/index และทุก reachable commit โดยไม่พิมพ์ค่าลับออก log
- [ ] รัน test ให้ผ่านและสแกน repository จริง

### Task 3: Release verification และรายงาน

**Files:**
- Modify: `PROGRESS.md`
- Modify: `FINAL_AUDIT.md`
- Modify: `TEST_REPORT.md`
- Modify: `SECURITY_REPORT.md`
- Modify: `DEPLOYMENT_READINESS.md`

- [ ] รัน lint, typecheck, tests, E2E, production build และ secret scan
- [ ] บันทึกผลจริง จำนวน test และข้อจำกัดที่เหลือ
- [ ] ตรวจ diff และ secret scan ซ้ำหลังอัปเดตเอกสาร

### Task 4: Local release commit

**Files:** repository release snapshot

- [ ] ยืนยันไม่มี remote และไม่มี secret
- [ ] สร้าง Local Commit โดยไม่เปลี่ยน Git config แบบถาวร
- [ ] ตรวจ commit, status และ history หลัง commit
- [ ] ยืนยันว่าไม่มี Push และไม่มี Deploy
