import { NextResponse } from "next/server";

const IDEAL_POSTCODE_API_KEY =
  process.env.IDEAL_POSTCODE_API_KEY || "ak_maz7xh95LDak6nnfwtMKdsedW3PsN";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const postcode = (searchParams.get("postcode") || "").replace(/\s+/g, "").toUpperCase();

  if (!postcode) {
    return NextResponse.json({ error: "Missing postcode" }, { status: 400, headers: CORS_HEADERS });
  }

  try {
    const endpoint = `https://api.ideal-postcodes.co.uk/v1/postcodes/${encodeURIComponent(
      postcode
    )}?api_key=${encodeURIComponent(IDEAL_POSTCODE_API_KEY)}`;
    const res = await fetch(endpoint, { next: { revalidate: 300 } });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Address lookup failed: ${res.status}` },
        { status: res.status, headers: CORS_HEADERS }
      );
    }

    const json = await res.json();
    const results = Array.isArray(json?.result) ? json.result : [];

    const addresses = results.map((entry: unknown) => {
      const item = (entry ?? {}) as Record<string, unknown>;
      const line1 = String(item.line_1 || "");
      const line2 = String(item.line_2 || "");
      const line3 = String(item.line_3 || "");
      const postTown = String(item.post_town || "");
      const fullPostcode = String(item.postcode || "");
      const label = [line1, line2, line3, postTown, fullPostcode].filter(Boolean).join(", ");

      return {
        label,
        line1,
        line2,
        line3,
        postTown,
        postcode: fullPostcode,
        udprn: String(item.udprn || ""),
      };
    });

    return NextResponse.json({ addresses }, { headers: CORS_HEADERS });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Address lookup failed" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
