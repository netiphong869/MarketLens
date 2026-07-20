import Link from "next/link";
import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 24, background: "#f6f8fb" }}>
    <section style={{ maxWidth: 480, textAlign: "center", padding: 32, background: "white", border: "1px solid #dce3ed", borderRadius: 20 }}>
      <WifiOff aria-hidden size={36} color="#607086" />
      <h1>ขณะนี้ไม่ได้เชื่อมต่ออินเทอร์เน็ต</h1>
      <p>MarketLens จะไม่แสดงข้อมูลหุ้นเก่าว่าเป็นข้อมูลสด กรุณาเชื่อมต่ออินเทอร์เน็ตแล้วลองใหม่</p>
      <Link href="/">กลับหน้าแรก</Link>
    </section>
  </main>;
}
