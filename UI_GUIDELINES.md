# MarketLens UI Guidelines

## บุคลิก

Professional, clean, premium และดูเป็นเครื่องมือวิเคราะห์ที่คนออกแบบ ไม่ใช่ chatbot, crypto dashboard หรือ template สำเร็จรูป

## สี

- Canvas: `#F6F8FB`
- Surface: `#FFFFFF`
- Text: `#172033`
- Muted: `#667085`
- Primary: `#145DA0`
- Positive: `#168F68`
- Warning: `#C68A12`
- Risk: `#D76526`
- Critical: `#C53B42`
- Missing: `#98A2B3`

สีต้องมาพร้อมข้อความ/ไอคอนเสมอ ห้ามสื่อสถานะด้วยสีอย่างเดียว

## Typography

- Latin/ตัวเลข: Geist หรือ Inter
- ไทย: Noto Sans Thai
- ตัวเลขหลักใช้ tabular numerals
- ขนาดตัวอักษรเนื้อหาไม่ต่ำกว่า 14px บนมือถือ

## Layout

- Mobile-first, content width สูงสุดประมาณ 1180px
- Spacing scale: 4, 8, 12, 16, 24, 32, 48px
- Card radius 18–20px; ไม่ทำทุกชิ้นเป็นกล่องเหมือนกัน
- Touch target อย่างน้อย 44px
- Bottom navigation ต้องรองรับ safe area และไม่บังเนื้อหา

## Motion and accessibility

- ใช้ motion เฉพาะ feedback, loading และ tab transition
- เคารพ `prefers-reduced-motion`
- Focus ring มองเห็นชัด
- Contrast และ ARIA ต้องผ่านการใช้งานด้วย keyboard/screen reader

## ห้ามใช้

พื้นดำ, neon, glassmorphism หนัก, gradient ม่วงแบบ AI, robot, crypto coin, เงาหนักทุก card, animation ฟุ่มเฟือย และคำสั่ง Strong Buy/Strong Sell เป็นคำตัดสินหลัก
