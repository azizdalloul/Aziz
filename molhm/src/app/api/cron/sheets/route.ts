import { NextResponse } from "next/server";
import { drainOutbox } from "@/lib/sheets";
export const runtime = "nodejs";
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(await drainOutbox(50));
}
