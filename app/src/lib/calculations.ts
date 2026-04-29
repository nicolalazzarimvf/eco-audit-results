import type {
  EpcData,
  SolarData,
  LandRegistryData,
  DerivedData,
  SolarEconomics,
} from "@/types/eco-audit";

const ELECTRICITY_RATE = 0.29; // £/kWh
const SEG_EXPORT_RATE = 0.15; // £/kWh
const SELF_USE_RATIO = 0.35;
const DC_AC_EFFICIENCY = 0.8;
const INSTALL_COST_PER_KWP = 1800; // £
const ASHP_COP = 3.2;
const GRID_CO2_KG_PER_KWH = 0.233;

function calcSolarEconomics(
  panelsCount: number,
  kWp: number,
  dcKwhYr: number
): SolarEconomics {
  const acKwhYr = dcKwhYr * DC_AC_EFFICIENCY;
  const selfUseSavingGbp = acKwhYr * SELF_USE_RATIO * ELECTRICITY_RATE;
  const exportEarningGbp = acKwhYr * (1 - SELF_USE_RATIO) * SEG_EXPORT_RATE;
  const totalAnnualGbp = selfUseSavingGbp + exportEarningGbp;
  const installCostGbp = kWp * INSTALL_COST_PER_KWP;
  const paybackYrs = installCostGbp / totalAnnualGbp;
  const co2SavedTYr = (acKwhYr * GRID_CO2_KG_PER_KWH) / 1000;
  const twentyYrNetGbp = totalAnnualGbp * 20 - installCostGbp;

  return {
    panelsCount,
    kWp,
    dcKwhYr,
    acKwhYr: Math.round(acKwhYr),
    selfUseSavingGbp: Math.round(selfUseSavingGbp),
    exportEarningGbp: Math.round(exportEarningGbp),
    totalAnnualGbp: Math.round(totalAnnualGbp),
    installCostGbp: Math.round(installCostGbp),
    paybackYrs: Math.round(paybackYrs * 10) / 10,
    co2SavedTYr: Math.round(co2SavedTYr * 100) / 100,
    twentyYrNetGbp: Math.round(twentyYrNetGbp),
  };
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

export function derive(
  epc: EpcData | null,
  solar: SolarData | null,
  landRegistry: LandRegistryData | null
): DerivedData | null {
  if (!epc && !solar && !landRegistry) return null;

  // EPC summary
  const totalCurrent = epc
    ? epc.heatingCostCurrentGbp +
      epc.hotWaterCostCurrentGbp +
      epc.lightingCostCurrentGbp
    : 0;
  const totalPotential = epc
    ? epc.heatingCostPotentialGbp +
      epc.hotWaterCostPotentialGbp +
      epc.lightingCostPotentialGbp
    : 0;

  // ASHP sizing
  const totalHeatDemand = epc
    ? epc.rhiSpaceHeatingKwh + epc.rhiWaterHeatingKwh
    : 0;
  const ashpElecNeeded = Math.round(totalHeatDemand / ASHP_COP);
  const ashpRunningCost = Math.round(ashpElecNeeded * ELECTRICITY_RATE);

  // Solar
  const solarEconomics: SolarEconomics[] = solar
    ? solar.panelConfigs.map((c) =>
        calcSolarEconomics(c.panelsCount, c.kWp, c.dcKwhYr)
      )
    : [];

  // Recommended system: ~12 panels or best payback under 14 years
  const recommended =
    solarEconomics.find((s) => s.panelsCount === 12) ??
    solarEconomics.find((s) => s.paybackYrs <= 14) ??
    solarEconomics[solarEconomics.length - 1];

  // Land Registry
  const ownSales = landRegistry?.ownHistory ?? [];
  const lastSale = ownSales.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )[0];
  const comparablePrices = (landRegistry?.areaComparables ?? []).map(
    (s) => s.priceGbp
  );
  const areaMedian =
    landRegistry?.areaMedianGbp ?? median(comparablePrices) ?? 0;
  const areaAvg = landRegistry?.areaAvgGbp ?? 0;
  const estimateLow = lastSale?.priceGbp ?? areaMedian * 0.9;
  const estimateHigh = areaMedian;

  // Total opportunity
  const epcImprovementsTotal = epc
    ? epc.improvements.reduce((sum, i) => sum + i.typicalSavingGbp, 0)
    : 0;
  const solarAnnual = recommended?.totalAnnualGbp ?? 0;
  const totalOpportunity = solarAnnual + epcImprovementsTotal;

  return {
    totalEnergyCostCurrentGbp: Math.round(totalCurrent),
    totalEnergyCostPotentialGbp: Math.round(totalPotential),
    totalEnergyCostSavingGbp: Math.round(totalCurrent - totalPotential),
    co2SavingTYr: epc
      ? Math.round((epc.co2EmissionsCurrentT - epc.co2EmissionsPotentialT) * 10) / 10
      : 0,
    epcScoreImprovement: epc ? epc.potentialScore - epc.currentScore : 0,

    totalHeatDemandKwh: Math.round(totalHeatDemand),
    ashpElectricityNeededKwh: ashpElecNeeded,
    ashpAnnualRunningCostGbp: ashpRunningCost,

    solarEconomics,
    recommendedSolar: recommended ?? solarEconomics[0],

    lrOwnLastSoldDate: lastSale?.date,
    lrOwnLastSoldPriceGbp: lastSale?.priceGbp,
    lrAreaMedianGbp: areaMedian,
    lrAreaAvgGbp: Math.round(areaAvg),
    lrEstimatedValueRangeLow: Math.round(estimateLow),
    lrEstimatedValueRangeHigh: Math.round(estimateHigh),

    totalAnnualOpportunityGbp: Math.round(totalOpportunity),
  };
}
