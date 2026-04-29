import type { EpcData, EpcBand, EpcFabricElement, EpcImprovement } from "@/types/eco-audit";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

const BASE = "https://api.get-energy-performance-data.communities.gov.uk";

function toNumber(value: unknown): number {
  if (
    typeof value === "object" &&
    value !== null &&
    "value" in value
  ) {
    return toNumber((value as { value?: unknown }).value);
  }
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.-]/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function firstObject(value: unknown): Record<string, unknown> {
  if (Array.isArray(value)) {
    const first = value[0];
    return (first && typeof first === "object" ? first : {}) as Record<string, unknown>;
  }
  return (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
}

function band(score: number): EpcBand {
  if (score >= 92) return "A";
  if (score >= 81) return "B";
  if (score >= 69) return "C";
  if (score >= 55) return "D";
  if (score >= 39) return "E";
  if (score >= 21) return "F";
  return "G";
}

function fabricFromRaw(raw: Record<string, unknown>): EpcFabricElement {
  return {
    description: String(raw.description ?? ""),
    energyRating: toNumber(raw.energy_efficiency_rating),
    environmentalRating: toNumber(raw.environmental_efficiency_rating),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function improvementFromRaw(raw: any, i: number): EpcImprovement {
  const costRaw = String(raw.indicative_cost ?? "");
  const costs = costRaw.match(/[\d,]+/g)?.map((n) => parseInt(n.replace(/,/g, ""), 10)) ?? [];
  return {
    sequence: i + 1,
    improvementType: String(raw.improvement_type ?? ""),
    improvementSummaryText: String(raw.improvement_summary_text ?? raw.improvement_item ?? ""),
    indicativeCostLow: costs[0],
    indicativeCostHigh: costs[1],
    typicalSavingGbp: Math.round(toNumber(raw.typical_saving)),
    energyRatingAfterUpgrade: toNumber(raw.energy_rating_after_upgrade),
  };
}

export async function fetchEpc(uprn: string, token: string): Promise<EpcData> {
  const searchRes = await fetchWithTimeout(
    `${BASE}/api/domestic/search?uprn=${uprn}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!searchRes.ok) throw new Error(`EPC search failed: ${searchRes.status}`);
  const searchJson = await searchRes.json();

  const results = searchJson?.data ?? searchJson?.results ?? [];
  if (!results.length) throw new Error(`No EPC found for UPRN ${uprn}`);

  const certNumber = results[0].certificate_number ?? results[0].certificateNumber;
  if (!certNumber) throw new Error("No certificate number in EPC search response");

  const certRes = await fetchWithTimeout(
    `${BASE}/api/certificate?certificate_number=${certNumber}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!certRes.ok) throw new Error(`EPC certificate fetch failed: ${certRes.status}`);
  const certJson = await certRes.json();
  const cert = certJson?.data ?? certJson;

  const currentScore = toNumber(cert.current_energy_efficiency ?? cert.energy_rating_current);
  const potentialScore = toNumber(cert.potential_energy_efficiency ?? cert.energy_rating_potential);

  const rawImprovements = cert.improvements ?? cert.suggested_improvements ?? [];

  return {
    uprn: String(cert.uprn ?? uprn),
    certificateNumber: String(certNumber),
    addressLine1: String(cert.address_line1 ?? cert.address_line_1 ?? ""),
    postcode: String(cert.postcode ?? ""),
    postTown: String(cert.post_town ?? ""),
    inspectionDate: String(cert.inspection_date ?? ""),
    completionDate: String(cert.lodgement_date ?? cert.completion_date ?? ""),
    assessmentType: String(cert.type_of_assessment ?? cert.assessment_type ?? "RdSAP"),

    dwellingType: String(cert.dwelling_type ?? ""),
    propertyType: toNumber(cert.property_type),
    builtForm: toNumber(cert.built_form),
    totalFloorAreaM2: toNumber(cert.total_floor_area),
    heatedRoomCount: toNumber(cert.heated_room_count),

    currentBand: band(currentScore),
    currentScore,
    potentialBand: band(potentialScore),
    potentialScore,
    environmentalImpactCurrent: toNumber(cert.environment_impact_current),
    environmentalImpactPotential: toNumber(cert.environment_impact_potential),

    energyConsumptionCurrentKwhM2: toNumber(cert.energy_consumption_current),
    energyConsumptionPotentialKwhM2: toNumber(cert.energy_consumption_potential),
    co2EmissionsCurrentT: toNumber(cert.co2_emissions_current),
    co2EmissionsPotentialT: cert.co2_emiss_curr_per_floor_area ? 0 : toNumber(cert.co2_emissions_potential),

    heatingCostCurrentGbp: toNumber(cert.heating_cost_current),
    heatingCostPotentialGbp: toNumber(cert.heating_cost_potential),
    hotWaterCostCurrentGbp: toNumber(cert.hot_water_cost_current),
    hotWaterCostPotentialGbp: toNumber(cert.hot_water_cost_potential),
    lightingCostCurrentGbp: toNumber(cert.lighting_cost_current),
    lightingCostPotentialGbp: toNumber(cert.lighting_cost_potential),

    mainHeatingDescription: String(
      (firstObject(cert.main_heating).description as string | undefined) ??
        cert.main_heat_description ??
        ""
    ),
    mainHeatingEnergyRating: toNumber(cert.main_heating_energy_eff),
    hotWaterDescription: String(
      (firstObject(cert.hot_water).description as string | undefined) ??
        cert.hot_water_description ??
        ""
    ),
    hasSolarWaterHeating: cert.solar_water_heating === "Y" || cert.solar_water_heating === true,
    hasSolarPv: toNumber(cert.solar_panels_kilograms_co2_per_year ?? cert.photo_supply) > 0,

    walls: fabricFromRaw(firstObject(cert.walls)),
    roof: fabricFromRaw(firstObject(cert.roofs ?? cert.roof)),
    floor: fabricFromRaw(firstObject(cert.floors ?? cert.floor)),
    windows: fabricFromRaw(firstObject(cert.window ?? cert.windows)),

    rhiSpaceHeatingKwh: toNumber(cert.heat_demand_heating_kwh ?? cert.space_heating),
    rhiWaterHeatingKwh: toNumber(cert.heat_demand_water_kwh ?? cert.water_heating),

    improvements: Array.isArray(rawImprovements)
      ? rawImprovements.map(improvementFromRaw)
      : [],
  };
}
