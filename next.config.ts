import type { NextConfig } from "next";
import { securityHeadersFor } from "./src/lib/security/headers";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeadersFor(process.env.NODE_ENV) }];
  },
};

export default nextConfig;
