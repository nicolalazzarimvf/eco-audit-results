import type { EpcData, SolarData, LandRegistryData, AuditParams } from "@/types/eco-audit";
import { fetchEpc } from "@/lib/epc";
import { fetchSolar } from "@/lib/solar";
import { fetchLandRegistry } from "@/lib/land-registry";
import { derive } from "@/lib/calculations";
import EpcCard from "@/components/EpcCard";
import SolarCard from "@/components/SolarCard";
import PropertyValueCard from "@/components/PropertyValueCard";
import SatelliteMapCard from "@/components/SatelliteMapCard";
import IframeHeightBridge from "@/components/IframeHeightBridge";
import AddressRefinementCard from "@/components/AddressRefinementCard";
import ReportHeader from "@/components/report/ReportHeader";
import KpiSummaryGrid from "@/components/report/KpiSummaryGrid";
import ReportSection from "@/components/report/ReportSection";
import InsulationInsights from "@/components/report/InsulationInsights";
import HeatingInsights from "@/components/report/HeatingInsights";
import ExistingFeatures from "@/components/report/ExistingFeatures";
import TopOpportunities from "@/components/report/TopOpportunities";

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
  const systemSize = derived?.recommendedSolar?.kWp ?? 0;

  const showProminentAvgAddressCard = isDetailedView && !hasAddressLevelAccuracy && Boolean(postcode);

  const titleAccent =
    usingSimilarHouseAverage && !isAddressAccuracy
      ? `homes like yours in ${postcode || "your area"}`
      : address || postcode || "your property";

  const co2Tonnes =
    epc && epc.co2EmissionsCurrentT > epc.co2EmissionsPotentialT
      ? `${(epc.co2EmissionsCurrentT - epc.co2EmissionsPotentialT).toFixed(1)}t`
      : derived
        ? `${Math.max(0.1, derived.co2SavingTYr).toFixed(1)}t`
        : "—";

  const efficiencyScore =
    epc && epc.currentScore > 0
      ? `${Math.round(((epc.potentialScore - epc.currentScore) / epc.currentScore) * 100)}%`
      : "—";

  if (!isDetailedView) {
    return (
      <main style={{ maxWidth: 980, margin: "0 auto", padding: "24px 16px 48px" }}>
        <IframeHeightBridge />
        <h1 style={{ fontSize: 44, fontWeight: 800, marginBottom: 12 }}>
          Your personalised Eco Audit for {titleAccent}
        </h1>
        {solar && derived ? <SolarCard solar={solar} derived={derived} /> : <SatelliteMapCard lat={lat} lng={lng} address={address} mapUrl={mapUrl} />}
        {epc && derived && <EpcCard epc={epc} derived={derived} />}
        {landRegistry && derived && <PropertyValueCard lr={landRegistry} derived={derived} />}
      </main>
    );
  }

  return (
    <div className="report-page">
      <IframeHeightBridge />
      <ReportHeader />

      <div className="report-container">
        <header className="report-hero">
          <div className="report-hero-top">
            <span className="report-eyebrow">Your savings report</span>
            <span className="report-mode-pill">
              {hasAddressLevelAccuracy ? "ADDRESS mode" : "AVG mode"}
            </span>
          </div>
          <h1 className="report-title">
            Your personalised Eco Audit for{" "}
            <span className="report-title-accent">{titleAccent}</span>
          </h1>
          <p className="report-subtitle">
            Here&apos;s how much you could save by making your home more energy efficient.
            {postcode ? ` Postcode: ${postcode}.` : ""}
          </p>
        </header>

        {!hasAddressLevelAccuracy && postcode ? (
          <AddressRefinementCard
            postcode={postcode}
            monthlyBill={auditParams.bill}
            hasEv={auditParams.hasEv}
            prominentLayout={showProminentAvgAddressCard}
          />
        ) : null}

        {derived ? (
          <KpiSummaryGrid
            annualSaving={formatMoney(annualSaving)}
            solarKwp={`${systemSize.toFixed(1)} kWp`}
            co2Tonnes={co2Tonnes}
            efficiencyScore={efficiencyScore}
          />
        ) : null}

        <nav className="report-nav-pills" aria-label="Report sections">
          <a href="#solar-section">Solar</a>
          <a href="#insulation-section">Insulation</a>
          <a href="#heating-section">Heating</a>
          <a href="#ev-section">EV charging</a>
          <a href="#opportunities-section">Opportunities</a>
        </nav>

        {errors.length > 0 && (
          <div
            style={{
              background: "#fde8e8",
              border: "1px solid #fbd2d0",
              borderRadius: 10,
              padding: 12,
              marginBottom: 16,
              fontSize: 12,
              color: "#8e130b",
            }}
          >
            {errors.map((e) => (
              <div key={e}>{e}</div>
            ))}
          </div>
        )}

        <ReportSection
          id="solar-section"
          title="Your solar potential"
          ctaLabel="Get your solar panels quote here"
          ctaHref="https://www.theecoexperts.co.uk/solar-panels"
        >
          {solar && derived ? (
            <SolarCard solar={solar} derived={derived} />
          ) : (
            <SatelliteMapCard lat={lat} lng={lng} address={address} mapUrl={mapUrl} />
          )}
        </ReportSection>

        {epc && derived ? (
          <ReportSection
            id="insulation-section"
            title="Windows & insulation insights"
            ctaLabel="Get insulation quotes"
            ctaHref="https://www.theecoexperts.co.uk/insulation"
          >
            <InsulationInsights epc={epc} />
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid #e2ebf2" }}>
              <EpcCard epc={epc} derived={derived} />
            </div>
          </ReportSection>
        ) : null}

        {epc && derived ? (
          <ReportSection
            id="heating-section"
            title="Heating system insights"
            ctaLabel="Find a heat pump installer"
            ctaHref="https://www.theecoexperts.co.uk/heat-pumps"
          >
            <HeatingInsights epc={epc} derived={derived} />
            {landRegistry ? (
              <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid #e2ebf2" }}>
                <PropertyValueCard lr={landRegistry} derived={derived} />
              </div>
            ) : null}
          </ReportSection>
        ) : landRegistry && derived ? (
          <ReportSection id="heating-section" title="Property value context">
            <PropertyValueCard lr={landRegistry} derived={derived} />
          </ReportSection>
        ) : null}

        <ReportSection
          id="ev-section"
          title="EV & smart charging"
          ctaLabel="Find an EV charger installer"
          ctaHref="https://www.theecoexperts.co.uk/ev-charging"
        >
          <div className="report-ev-grid">
            <div className="report-ev-stat">
              <div className="report-ev-stat-label">EV profile</div>
              <div className="report-ev-stat-value">
                {auditParams.hasEv ? "Active EV home" : "EV-ready home"}
              </div>
            </div>
            <div className="report-ev-stat">
              <div className="report-ev-stat-label">Suggested annual offset</div>
              <div className="report-ev-stat-value">
                {formatMoney((derived?.recommendedSolar?.totalAnnualGbp || 0) * 0.35)}
              </div>
            </div>
            <div className="report-ev-stat">
              <div className="report-ev-stat-label">Best charging window</div>
              <div className="report-ev-stat-value">Overnight + solar peak</div>
            </div>
          </div>
        </ReportSection>

        {epc ? (
          <ReportSection id="features-section" title="Your existing green features">
            <ExistingFeatures epc={epc} hasEv={Boolean(auditParams.hasEv)} />
          </ReportSection>
        ) : null}

        {derived ? (
          <ReportSection id="opportunities-section" title="Your top 3 opportunities">
            <TopOpportunities epc={epc} derived={derived} />
          </ReportSection>
        ) : null}

        {!epc && !solar && !landRegistry && (
          <p style={{ textAlign: "center", color: "var(--muted)", padding: 40 }}>
            No data could be retrieved for this property.
          </p>
        )}

        <footer className="report-footer">
          Data sources: Energy Performance of Buildings Register · Google Solar API · HM Land
          Registry Price Paid Data. Savings are estimates based on standard assumptions (£0.29/kWh
          electricity, £0.15/kWh SEG export, 3.2 ASHP COP). Install costs and savings will vary.
        </footer>
      </div>
    </div>
  );
}
