import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env/server";
export function GET(): NextResponse { const env = getServerEnv(); return NextResponse.json({ ok: true, mode: env.MOCK_DATA_MODE ? "mock" : "live", time: new Date().toISOString() }); }
