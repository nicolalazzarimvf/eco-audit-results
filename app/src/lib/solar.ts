import type { SolarData, SolarRoofSegment, SolarPanelConfig } from "@/types/eco-audit";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

const SOLAR_API = "https://solar.googleapis.com/v1/buildingInsights:findClosest";

const AZIMUTH_LABELS: [number, string][] = [
  [22.5, "N"], [67.5, "NE"], [112.5, "E"], [157.5, "SE"],
  [202.5, "S"], [247.5, "SW"], [292.5, "W"], [337.5, "NW"],
];

function azimuthLabel(deg: number): string {
  const d = ((deg % 360) + 360) % 360;
  for (const [threshold, label] of AZIMUTH_LABELS) {
    if (d < threshold) return label;
  }
  return "N";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseSegments(raw: any[]): SolarRoofSegment[] {
  const segments: SolarRoofSegment[] = raw.map((s, i) => ({
    index: i,
    azimuthDeg: Number(s.azimuthDegrees ?? 0),
    pitchDeg: Number(s.pitchDegrees ?? 0),
    areaM2: Number(s.stats?.areaMeters2 ?? 0),
    maxSunshineHrsYr: Number(s.stats?.maxSunshineHoursPerYear ?? 0),
    facingLabel: azimuthLabel(Number(s.azimuthDegrees ?? 0)),
    isBest: false,
  }));

  // Best = highest sunshine hours on a south-facing (90–270°) segment
  const southFacing = segments.filter(
    (s) => s.azimuthDeg > 90 && s.azimuthDeg < 270
  );
  const best =
    southFacing.sort((a, b) => b.maxSunshineHrsYr - a.maxSunshineHrsYr)[0] ??
    segments.sort((a, b) => b.maxSunshineHrsYr - a.maxSunshineHrsYr)[0];
  if (best) best.isBest = true;

  return segments;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseConfigs(raw: any[], panelCapacityW: number): SolarPanelConfig[] {
  return raw.map((c) => {
    const count = Number(c.panelsCount ?? 0);
    const kWp = Math.round((count * panelCapacityW) / 100) / 10;
    const dcKwhYr = Math.round(Number(c.yearlyEnergyDcKwh ?? 0));
    return { panelsCount: count, kWp, dcKwhYr };
  });
}

export async function fetchSolar(
  lat: number,
  lng: number,
  apiKey: string
): Promise<SolarData> {
  const url = `${SOLAR_API}?location.latitude=${lat}&location.longitude=${lng}&requiredQuality=LOW&key=${apiKey}`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`Solar API failed: ${res.status}`);
  const d = await res.json();

  const solarPotential = d.solarPotential ?? {};
  const panelCapacityW = Number(solarPotential.panelCapacityWatts ?? 400);

  return {
    buildingId: String(d.name ?? ""),
    centerLat: Number(d.center?.latitude ?? lat),
    centerLng: Number(d.center?.longitude ?? lng),
    imageryDate: d.imageryDate
      ? `${d.imageryDate.year}-${String(d.imageryDate.month).padStart(2, "0")}-${String(d.imageryDate.day).padStart(2, "0")}`
      : "",
    imageryQuality: (d.imageryQuality ?? "LOW") as SolarData["imageryQuality"],
    postalCode: String(d.postalCode ?? ""),

    roofTotalAreaM2: Math.round(Number(solarPotential.wholeRoofStats?.areaMeters2 ?? 0) * 10) / 10,
    roofGroundFootprintM2: Math.round(Number(solarPotential.roofSegmentStats?.[0]?.stats?.areaMeters2 ?? 0) * 10) / 10,
    roofSegmentsCount: Number((solarPotential.roofSegmentStats ?? []).length),
    maxSunshineHrsYr: Math.round(Number(solarPotential.maxSunshineHoursPerYear ?? 0) * 10) / 10,

    panelCapacityW,
    panelHeightM: Number(solarPotential.panelHeightMeters ?? 1.879),
    panelWidthM: Number(solarPotential.panelWidthMeters ?? 1.045),
    panelLifetimeYrs: Number(solarPotential.panelLifetimeYears ?? 20),
    maxPanelsCount: Number(solarPotential.maxArrayPanelsCount ?? 0),
    maxArrayAreaM2: Math.round(Number(solarPotential.maxArrayAreaMeters2 ?? 0) * 10) / 10,

    roofSegments: parseSegments(solarPotential.roofSegmentStats ?? []),
    panelConfigs: parseConfigs(solarPotential.solarPanelConfigs ?? [], panelCapacityW),
  };
}
