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

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function sp(val: string | string[] | undefined): string {
  return Array.isArray(val) ? val[0] ?? "" : val ?? "";
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;

  const uprn = sp(params.uprn);
  const lat = parseFloat(sp(params.lat) || "0");
  const lng = parseFloat(sp(params.lng) || "0");
  const address = sp(params.address);
  const postcode = sp(params.postcode);
  const paon = sp(params.paon) || address.split(" ")[0];
  const street = sp(params.street) || address.replace(/^\S+\s+/, "");

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
  const mapUrl = mapsKey
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=20&size=1200x700&maptype=satellite&markers=color:red%7C${lat},${lng}&key=${mapsKey}`
    : null;

  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: "32px 16px 48px" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
          Eco Audit Report
        </div>
        <h1 style={{ fontSize: 44, fontWeight: 800, lineHeight: 1.23, letterSpacing: "-0.02em", marginBottom: 6 }}>
          {address || "Your property"}
        </h1>
        {postcode && (
          <div style={{ fontSize: 18, color: "var(--muted)" }}>{postcode}</div>
        )}
      </div>

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
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <SatelliteMapCard lat={lat} lng={lng} address={address} mapUrl={mapUrl} />
        {epc && derived && <EpcCard epc={epc} derived={derived} />}
        {solar && derived && <SolarCard solar={solar} derived={derived} />}
        {landRegistry && derived && <PropertyValueCard lr={landRegistry} derived={derived} />}
        {derived && <OpportunityCard epc={epc} derived={derived} />}
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
