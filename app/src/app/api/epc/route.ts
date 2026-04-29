import { NextRequest, NextResponse } from "next/server";
import { fetchEpc } from "@/lib/epc";

export async function GET(req: NextRequest) {
  const uprn = req.nextUrl.searchParams.get("uprn");
  if (!uprn) return NextResponse.json({ error: "uprn required" }, { status: 400 });

  const token = process.env.EPC_API_TOKEN;
  if (!token) return NextResponse.json({ error: "EPC_API_TOKEN not configured" }, { status: 500 });

  try {
    const data = await fetchEpc(uprn, token);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
