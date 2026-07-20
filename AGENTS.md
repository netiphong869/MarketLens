# MarketLens Agent Rules

เอกสารนี้เป็นจุดเริ่มต้นสำหรับ AI agent ทุกตัวที่ทำงานใน repository นี้

## กฎบังคับ

- ทำงานเฉพาะใน repository นี้และอ่าน `MASTER_SPEC.md`, `PROJECT_RULES.md`, `CALCULATION_ENGINE.md`, `ARCHITECTURE.md`, และ `PROGRESS.md` ก่อนแก้โค้ด
- ใช้ภาษาไทยที่เป็นกันเองเมื่อตอบผู้ใช้ อธิบายว่าแก้ตรงไหน เหตุผล และจุดที่ต้องระวัง
- ห้ามเพิ่ม Git remote, Push, สร้าง GitHub repository, รันคำสั่ง Vercel หรือ Deploy
- ห้ามสร้างหรือใช้ API key จริง ห้าม Commit `.env*` ยกเว้น `.env.example`
- Secret ต้องอยู่ฝั่ง server และห้ามใช้ชื่อขึ้นต้น `NEXT_PUBLIC_`
- ใช้ TypeScript strict mode และ Zod ที่ขอบเขตข้อมูลภายนอก
- ใช้ TDD สำหรับพฤติกรรมใหม่: test ต้องล้มเหลวด้วยเหตุผลที่ถูกต้องก่อนเขียน implementation
- ห้ามลด ลบ ปิด หรือแก้ test เพียงเพื่อให้ผ่าน
- Gemini ใช้เรียบเรียงภาษาไทยเท่านั้น ตัวเลข คะแนน และ Scenario มาจาก deterministic engine
- ข้อมูลหายใช้ `null`/unavailable ห้ามแทนด้วยศูนย์
- Mock data ต้องติดป้าย `ข้อมูลจำลอง` ชัดเจน
- สูตรหรือน้ำหนักคะแนนเปลี่ยนได้ต่อเมื่อแก้ `CALCULATION_ENGINE.md`, เพิ่ม test และได้รับอนุมัติ
- ก่อนรายงานว่างานเสร็จ ต้องรัน verification จริงและระบุผลตามหลักฐาน

## คำสั่งมาตรฐาน

```text
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
npm run secret:scan
```

## ขอบเขต V1

ให้คะแนนพื้นฐานเต็มเฉพาะบริษัทดำเนินธุรกิจทั่วไปในสหรัฐ หุ้นประเภทเฉพาะ เช่น ธนาคาร ประกัน REIT ETF biotech ก่อนมีรายได้ และสินค้าโภคภัณฑ์ ต้องแสดงข้อจำกัดและไม่ใช้สูตรบริษัททั่วไปแบบเงียบ ๆ
