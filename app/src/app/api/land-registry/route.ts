import { NextRequest, NextResponse } from "next/server";
import { fetchLandRegistry } from "@/lib/land-registry";

export async function GET(req: NextRequest) {
  const paon = req.nextUrl.searchParams.get("paon");
  const street = req.nextUrl.searchParams.get("street");
  const postcode = req.nextUrl.searchParams.get("postcode");

  if (!paon || !street || !postcode) {
    return NextResponse.json({ error: "paon, street, and postcode required" }, { status: 400 });
  }

  try {
    const data = await fetchLandRegistry(paon, street, postcode);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
