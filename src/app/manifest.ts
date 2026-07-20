import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MarketLens – ผู้ช่วยวิเคราะห์หุ้นอัจฉริยะ",
    short_name: "MarketLens",
    description: "วิเคราะห์หุ้นสหรัฐแบบรอบด้านด้วยสูตรที่ตรวจสอบได้",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f8fb",
    theme_color: "#1466d8",
    lang: "th",
    orientation: "portrait-primary",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
