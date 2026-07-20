# MarketLens

MarketLens เป็น PWA วิเคราะห์หุ้นสหรัฐแบบ mobile-first ที่คำนวณคะแนนจากข้อมูลเชิงโครงสร้างและอธิบายผลเป็นภาษาไทย แอปเริ่มใน Mock Mode และไม่ต้องใช้ API key เพื่อพัฒนาในเครื่อง

## เริ่มใช้งาน

```text
npm install
npm run dev
```

เปิด `http://localhost:3000`

## Environment

คัดลอก `.env.example` เป็น `.env.local` เฉพาะในเครื่องเมื่อพร้อมทดสอบ provider จริง ห้าม Commit ไฟล์นี้

```text
TWELVE_DATA_API_KEY=
FINNHUB_API_KEY=
GEMINI_API_KEY=
SEC_USER_AGENT=
USAGE_SIGNING_SECRET=
MOCK_DATA_MODE=true
```

## ตรวจคุณภาพ

```text
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
npm run secret:scan
npm run verify
```

## ข้อจำกัด V1

ยังไม่มีสมาชิก ฐานข้อมูลถาวร พอร์ต ซื้อขายจริง หรือสูตรพื้นฐานเฉพาะธนาคาร/REIT/ETF แอปไม่ใช่คำแนะนำการลงทุนและไม่รับประกันผลตอบแทน

ตัวนับ 10 รอบ/วันของ V1 เก็บในหน่วยความจำของ Server Instance และ Local Browser จึงเหมาะกับการใช้ส่วนตัวในเครื่องหรือ Preview เท่านั้น เมื่อ Serverless สร้าง Instance ใหม่ ตัวนับอาจรีเซ็ต และยังไม่สามารถบังคับข้ามอุปกรณ์ได้อย่างสมบูรณ์ หากเปิดให้บุคคลอื่นใช้ต้องเพิ่มฐานข้อมูลหรือ Durable Rate Limit ก่อน

โหมดข้อมูลจริงเชื่อม Twelve Data (ราคา/แท่งเทียน), SEC EDGAR (Company Facts), Finnhub (Company Profile/News) และ Gemini (เรียบเรียงข้อความแบบมี Template Fallback) แต่ยังต้องตรวจตัวเลขกับบัญชี API จริงก่อนใช้งานตัดสินใจ ส่วน Market/Sector comparison ยังแสดงเป็นข้อมูลไม่พร้อมและไม่เดาคะแนนจากแหล่งอื่น

## Deployment ภายหลัง

รอบงานปัจจุบันห้าม Push และ Deploy ขั้นตอนเตรียม Preview จะถูกบันทึกใน `DEPLOYMENT_READINESS.md` เมื่อ Phase 9 ผ่านเท่านั้น
