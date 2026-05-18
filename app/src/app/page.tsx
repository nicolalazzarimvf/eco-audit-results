import type { EpcData, SolarData, LandRegistryData, AuditParams } from "@/types/eco-audit";
import { fetchEpc } from "@/lib/epc";
import { fetchSolar } from "@/lib/solar";
import { fetchLandRegistry } from "@/lib/land-registry";
import { derive } from "@/lib/calculations";
import EpcCard from "@/components/EpcCard";
import SolarCard from "@/components/SolarCard";
import PropertyValueCard from "@/components/PropertyValueCard";
import OpportunityCard from "@/components/OpportunityCard";
import SatelliteMapCard from "@/components/SatelliteMapCard";
import IframeHeightBridge from "@/components/IframeHeightBridge";
import AddressRefinementCard from "@/components/AddressRefinementCard";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

type SimilarPostcodeAddress = {
  line1: string;
  postcode: string;
  udprn: string;
};

function sp(val: string | string[] | undefined): string {
  return Array.isArray(val) ? val[0] ?? "" : val ?? "";
}

function normalizePostcode(value: string): string {
  const compact = String(value || "").replace(/\s+/g, "").toUpperCase();
  if (!compact) return "";
  if (compact.length <= 3) return compact;
  return `${compact.slice(0, -3)} ${compact.slice(-3)}`;
}

function toPaonAndStreet(line1: string): { paon: string; street: string } {
  const trimmed = String(line1 || "").trim();
  if (!trimmed) return { paon: "", street: "" };
  const parts = trimmed.split(/\s+/);
  return {
    paon: parts[0] ?? "",
    street: parts.length > 1 ? parts.slice(1).join(" ") : "",
  };
}

function extractLeadingNumber(line1: string): number {
  const match = String(line1 || "").trim().match(/^(\d+)/);
  return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
}

async function resolveSimilarAddressFromPostcode(
  postcode: string
): Promise<SimilarPostcodeAddress | null> {
  const compact = postcode.replace(/\s+/g, "").toUpperCase();
  if (!compact) return null;

  const key =
    process.env.IDEAL_POSTCODE_API_KEY || "ak_maz7xh95LDak6nnfwtMKdsedW3PsN";
  if (!key) return null;

  try {
    const endpoint = `https://api.ideal-postcodes.co.uk/v1/postcodes/${encodeURIComponent(
      compact
    )}?api_key=${encodeURIComponent(key)}`;
    const res = await fetch(endpoint, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      result?: Array<Record<string, unknown>>;
    };
    const results = Array.isArray(json?.result) ? json.result : [];
    if (!results.length) return null;

    const parsed = results
      .map((entry) => {
        const line1 = String(entry.line_1 || "").trim();
        const fullPostcode = normalizePostcode(String(entry.postcode || postcode));
        const udprn = String(entry.udprn || "").trim();
        return { line1, postcode: fullPostcode, udprn };
      })
      .filter((entry) => entry.line1);

    if (!parsed.length) return null;
    parsed.sort((a, b) => extractLeadingNumber(a.line1) - extractLeadingNumber(b.line1));
    const selected = parsed[Math.floor(parsed.length / 2)] ?? parsed[0];
    return selected ?? null;
  } catch {
    return null;
  }
}

async function resolveCoordinatesFromPostcode(postcode: string): Promise<{ lat: number; lng: number } | null> {
  const compact = postcode.replace(/\s+/g, "").toUpperCase();
  if (!compact) return null;
  try {
    const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(compact)}`, {
      next: { revalidate: 60 * 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const lat = Number(json?.result?.latitude ?? 0);
    const lng = Number(json?.result?.longitude ?? 0);
    if (!lat || !lng) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;

  const queryAccuracy = sp(params.accuracy);
  const isAddressAccuracy = queryAccuracy === "address";
  let uprn = sp(params.uprn);
  let lat = parseFloat(sp(params.lat) || "0");
  let lng = parseFloat(sp(params.lng) || "0");
  let address = sp(params.address);
  let postcode = normalizePostcode(sp(params.postcode));
  let paon = sp(params.paon) || address.split(" ")[0];
  let street = sp(params.street) || address.replace(/^\S+\s+/, "");
  let usingSimilarHouseAverage = false;

  if (!isAddressAccuracy && postcode && (!address || !paon || !street || !uprn)) {
    const similarHouse = await resolveSimilarAddressFromPostcode(postcode);
    if (similarHouse) {
      const split = toPaonAndStreet(similarHouse.line1);
      address = address || similarHouse.line1;
      postcode = normalizePostcode(similarHouse.postcode || postcode);
      paon = paon || split.paon;
      street = street || split.street;
      uprn = uprn || similarHouse.udprn;
      usingSimilarHouseAverage = true;
    }
  }

  if ((!lat || !lng) && postcode) {
    const fallbackCoords = await resolveCoordinatesFromPostcode(postcode);
    if (fallbackCoords) {
      lat = fallbackCoords.lat;
      lng = fallbackCoords.lng;
    }
  }

  if (!lat || !lng) {
    return (
      <main style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
        <p>Missing location data. This page should be accessed via the enquiry form.</p>
      </main>
    );
  }

  const auditParams: AuditParams = {
    uprn,
    lat,
    lng,
    address,
    postcode,
    bill: parseFloat(sp(params.bill) || "0") || undefined,
    hasEv: sp(params.hev) === "1",
  };

  const [epcResult, solarResult, lrResult] = await Promise.allSettled([
    uprn ? fetchEpc(uprn, process.env.EPC_API_TOKEN ?? "") : Promise.resolve(null),
    fetchSolar(lat, lng, process.env.GOOGLE_MAPS_API_KEY ?? ""),
    fetchLandRegistry(paon, street, postcode),
  ]);

  const epc = epcResult.status === "fulfilled" ? epcResult.value : null;
  const solar = solarResult.status === "fulfilled" ? solarResult.value : null;
  const landRegistry = lrResult.status === "fulfilled" ? lrResult.value : null;
  const derived = derive(epc, solar, landRegistry);

  const errors = [
    epcResult.status === "rejected" && `EPC: ${epcResult.reason?.message}`,
    solarResult.status === "rejected" && `Solar: ${solarResult.reason?.message}`,
    lrResult.status === "rejected" && `Land Registry: ${lrResult.reason?.message}`,
  ].filter(Boolean) as string[];

  const mapsKey = process.env.GOOGLE_MAPS_API_KEY ?? "";
  const hasAddressLevelAccuracy = isAddressAccuracy;
  const markerSegment = hasAddressLevelAccuracy ? `&markers=color:red%7C${lat},${lng}` : "";
  const mapUrl = mapsKey
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=20&size=1200x700&maptype=satellite${markerSegment}&key=${mapsKey}`
    : null;
  const isDetailedView = sp(params.reportView) === "detailed";
  const formatMoney = (value: number) => `£${Math.round(value || 0).toLocaleString("en-GB")}`;
  const annualSaving = derived?.totalAnnualOpportunityGbp ?? 0;
  const propertyValueAvg = derived?.lrAreaAvgGbp ?? 0;
  const systemSize = derived?.recommendedSolar?.kWp ?? 0;
  const payback = derived?.recommendedSolar?.paybackYrs ?? 0;

  const showProminentAvgAddressCard = isDetailedView && !hasAddressLevelAccuracy && Boolean(postcode);

  return (
    <main style={{ maxWidth: isDetailedView ? 1140 : 980, margin: "0 auto", padding: "24px 16px 48px" }}>
      <IframeHeightBridge />
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: "1 1 280px", minWidth: 0 }}>
            <div style={{ fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
              Eco Audit Report
            </div>
            <h1 style={{ fontSize: isDetailedView ? 42 : 44, fontWeight: 800, lineHeight: 1.18, letterSpacing: "-0.02em", marginBottom: 6 }}>
              {usingSimilarHouseAverage && !isAddressAccuracy
                ? `Your personalised Eco Audit for homes like yours in ${postcode || "your area"}`
                : `Your personalised Eco Audit for ${address || "your property"}`}
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 17, color: "var(--muted)", lineHeight: 1.45, maxWidth: 560 }}>
              {"Here's how much you could save by making your home more energy efficient."}
            </p>
            {postcode ? (
              <div style={{ fontSize: 18, color: "var(--muted)", marginTop: 8 }}>{postcode}</div>
            ) : null}
          </div>
          <div
            style={{
              padding: "7px 10px",
              borderRadius: 999,
              border: "1px solid #cfe2eb",
              background: "#fff",
              color: "#0f455a",
              fontSize: 12,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {hasAddressLevelAccuracy ? "ADDRESS mode" : "AVG mode"}
          </div>
        </div>
      </div>

      {!hasAddressLevelAccuracy && postcode ? (
        <AddressRefinementCard
          postcode={postcode}
          monthlyBill={auditParams.bill}
          hasEv={auditParams.hasEv}
          prominentLayout={showProminentAvgAddressCard}
        />
      ) : null}

      {usingSimilarHouseAverage && !isAddressAccuracy && !showProminentAvgAddressCard ? (
        <div
          style={{
            background: "#eaf7ff",
            border: "1px solid #c8e3f5",
            borderRadius: 10,
            padding: 12,
            marginBottom: 14,
            color: "#1d4f68",
            fontSize: 13,
          }}
        >
          Showing postcode-average values based on a similar nearby property profile. Select your
          exact address below for house-specific calculations.
        </div>
      ) : null}

      {isDetailedView && (
        <div
          style={{
            background: "linear-gradient(180deg, #f7fcff 0%, #f5fbf9 100%)",
            border: "1px solid #ddebf2",
            borderRadius: 16,
            padding: 14,
            marginBottom: 16,
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
            {[
              ["Annual savings", formatMoney(annualSaving)],
              ["Avg home value", formatMoney(propertyValueAvg)],
              ["Suggested solar size", `${systemSize.toFixed(1)} kWp`],
              ["Estimated payback", `${payback || 0} years`],
            ].map(([label, value]) => (
              <div key={label} style={{ background: "#fff", border: "1px solid #dce8ef", borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ fontSize: 11, color: "#5c7381", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#0f3646", marginTop: 2 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isDetailedView && (
        <nav
          style={{
            position: "sticky",
            top: 10,
            zIndex: 2,
            background: "#f2fbff",
            border: "1px solid #d8e8ef",
            borderRadius: 12,
            padding: 8,
            marginBottom: 16,
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          {[
            ["#solar-section", "Solar"],
            ["#insulation-section", "Insulation"],
            ["#heating-section", "Heating"],
            ["#ev-section", "EV charging"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              style={{
                padding: "7px 12px",
                borderRadius: 999,
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 600,
                color: "#0d3f53",
                background: "#fff",
                border: "1px solid #cce0ea",
              }}
            >
              {label}
            </a>
          ))}
        </nav>
      )}

      {/* Data errors (non-blocking) */}
      {errors.length > 0 && (
        <div
          style={{
            background: "#fbd2d0",
            border: "1px solid #fbd2d0",
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
            fontSize: 12,
            color: "#8e130b",
          }}
        >
          {errors.map((e) => <div key={e}>{e}</div>)}
        </div>
      )}

      {/* Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <section id="solar-section" style={{ background: isDetailedView ? "#f6fcff" : "transparent", borderRadius: 14, padding: isDetailedView ? 14 : 0 }}>
          {solar && derived ? <SolarCard solar={solar} derived={derived} /> : <SatelliteMapCard lat={lat} lng={lng} address={address} mapUrl={mapUrl} />}
        </section>

        <section id="insulation-section" style={{ background: isDetailedView ? "#f7fcfa" : "transparent", borderRadius: 14, padding: isDetailedView ? 14 : 0 }}>
          {epc && derived && <EpcCard epc={epc} derived={derived} />}
          {derived && <OpportunityCard epc={epc} derived={derived} />}
        </section>

        <section id="heating-section" style={{ background: isDetailedView ? "#f6fbff" : "transparent", borderRadius: 14, padding: isDetailedView ? 14 : 0 }}>
          {landRegistry && derived && <PropertyValueCard lr={landRegistry} derived={derived} />}
        </section>

        <section id="ev-section" style={{ background: isDetailedView ? "#f6fbff" : "transparent", borderRadius: 14, padding: isDetailedView ? 14 : 0 }}>
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              boxShadow: "var(--card-shadow)",
              padding: 16,
            }}
          >
            <h3 style={{ margin: 0, fontSize: 20, color: "#123746" }}>EV charging</h3>
            <p style={{ margin: "6px 0 10px", color: "var(--muted)" }}>
              Charging suitability estimated from your home energy profile and likely solar production.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
              <div style={{ border: "1px solid #d7e5ee", borderRadius: 10, padding: 10, background: "#fff" }}>
                <div style={{ fontSize: 11, color: "#5a7280" }}>EV profile</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#0e3443" }}>{auditParams.hasEv ? "Active EV home" : "EV-ready home"}</div>
              </div>
              <div style={{ border: "1px solid #d7e5ee", borderRadius: 10, padding: 10, background: "#fff" }}>
                <div style={{ fontSize: 11, color: "#5a7280" }}>Suggested annual offset</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#0e3443" }}>
                  {formatMoney((derived?.recommendedSolar?.totalAnnualGbp || 0) * 0.35)}
                </div>
              </div>
              <div style={{ border: "1px solid #d7e5ee", borderRadius: 10, padding: 10, background: "#fff" }}>
                <div style={{ fontSize: 11, color: "#5a7280" }}>Best charging window</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#0e3443" }}>Overnight + solar peak</div>
              </div>
            </div>
          </div>
        </section>

        {!epc && !solar && !landRegistry && (
          <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
            No data could be retrieved for this property.
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 32, fontSize: 11, color: "var(--muted)", lineHeight: 1.6 }}>
        Data sources: Energy Performance of Buildings Register · Google Solar API · HM Land Registry Price Paid Data.
        Savings are estimates based on standard assumptions (£0.29/kWh electricity, £0.15/kWh SEG export, 3.2 ASHP COP).
        Install costs and savings will vary.
      </div>
    </main>
  );
}
