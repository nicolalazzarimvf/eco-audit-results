// ─── URL params passed by optimizely.js ──────────────────────────────────────

export interface AuditParams {
  uprn: string;
  lat: number;
  lng: number;
  address: string;
  postcode: string;
  /** User-stated monthly energy bill (£), optional */
  bill?: number;
  /** Has or wants EV charger */
  hasEv?: boolean;
}

// ─── EPC API ──────────────────────────────────────────────────────────────────

export type EpcBand = "A" | "B" | "C" | "D" | "E" | "F" | "G";

export interface EpcImprovement {
  sequence: number;
  improvementType: string; // e.g. "W1", "U", "G"
  improvementSummaryText: string;
  indicativeCostLow?: number;
  indicativeCostHigh?: number;
  typicalSavingGbp: number;
  energyRatingAfterUpgrade: number;
}

export interface EpcFabricElement {
  description: string;
  energyRating: number; // 0–5
  environmentalRating: number; // 0–5
}

export interface EpcData {
  // identity
  uprn: string;
  certificateNumber: string;
  addressLine1: string;
  postcode: string;
  postTown: string;
  inspectionDate: string;
  completionDate: string;
  assessmentType: string;

  // property
  dwellingType: string;
  propertyType: number;
  builtForm: number;
  totalFloorAreaM2: number;
  heatedRoomCount: number;

  // EPC scores
  currentBand: EpcBand;
  currentScore: number;
  potentialBand: EpcBand;
  potentialScore: number;
  environmentalImpactCurrent: number;
  environmentalImpactPotential: number;

  // energy consumption
  energyConsumptionCurrentKwhM2: number;
  energyConsumptionPotentialKwhM2: number;
  co2EmissionsCurrentT: number;
  co2EmissionsPotentialT: number;

  // running costs
  heatingCostCurrentGbp: number;
  heatingCostPotentialGbp: number;
  hotWaterCostCurrentGbp: number;
  hotWaterCostPotentialGbp: number;
  lightingCostCurrentGbp: number;
  lightingCostPotentialGbp: number;

  // heating
  mainHeatingDescription: string;
  mainHeatingEnergyRating: number;
  hotWaterDescription: string;
  hasSolarWaterHeating: boolean;
  hasSolarPv: boolean;

  // fabric
  walls: EpcFabricElement;
  roof: EpcFabricElement;
  floor: EpcFabricElement;
  windows: EpcFabricElement;

  // RHI heat demand (kWh/yr)
  rhiSpaceHeatingKwh: number;
  rhiWaterHeatingKwh: number;

  // improvements
  improvements: EpcImprovement[];
}

// ─── Google Solar API ─────────────────────────────────────────────────────────

export interface SolarRoofSegment {
  index: number;
  azimuthDeg: number;
  pitchDeg: number;
  areaM2: number;
  maxSunshineHrsYr: number;
  /** Derived: SE/SW etc. */
  facingLabel: string;
  isBest: boolean;
}

export interface SolarPanelConfig {
  panelsCount: number;
  kWp: number;
  dcKwhYr: number;
}

export interface SolarData {
  buildingId: string;
  centerLat: number;
  centerLng: number;
  imageryDate: string;
  imageryQuality: "HIGH" | "MEDIUM" | "LOW";
  postalCode: string;

  // roof
  roofTotalAreaM2: number;
  roofGroundFootprintM2: number;
  roofSegmentsCount: number;
  maxSunshineHrsYr: number;

  // panels
  panelCapacityW: number;
  panelHeightM: number;
  panelWidthM: number;
  panelLifetimeYrs: number;
  maxPanelsCount: number;
  maxArrayAreaM2: number;

  roofSegments: SolarRoofSegment[];
  panelConfigs: SolarPanelConfig[];
}

// ─── Land Registry ────────────────────────────────────────────────────────────

export interface LrSale {
  date: string;
  priceGbp: number;
  propertyType: string;
  estateType: string;
  transactionCategory: string;
  paon: string;
  street: string;
  postcode: string;
}

export interface LandRegistryData {
  ownHistory: LrSale[];
  areaComparables: LrSale[];
  valuationConfidence: "high" | "low" | "none";
  areaMinGbp: number;
  areaMaxGbp: number;
  areaAvgGbp: number;
  areaMedianGbp: number;
}

// ─── Derived / Calculated ─────────────────────────────────────────────────────

export interface SolarEconomics {
  panelsCount: number;
  kWp: number;
  dcKwhYr: number;
  acKwhYr: number;
  selfUseSavingGbp: number;
  exportEarningGbp: number;
  totalAnnualGbp: number;
  installCostGbp: number;
  paybackYrs: number;
  co2SavedTYr: number;
  twentyYrNetGbp: number;
}

export interface DerivedData {
  // EPC summary
  totalEnergyCostCurrentGbp: number;
  totalEnergyCostPotentialGbp: number;
  totalEnergyCostSavingGbp: number;
  co2SavingTYr: number;
  epcScoreImprovement: number;

  // ASHP sizing
  totalHeatDemandKwh: number;
  ashpElectricityNeededKwh: number;
  ashpAnnualRunningCostGbp: number;

  // Solar economics for each config
  solarEconomics: SolarEconomics[];
  recommendedSolar: SolarEconomics;

  // Land Registry valuation
  lrOwnLastSoldDate?: string;
  lrOwnLastSoldPriceGbp?: number;
  lrAreaMedianGbp: number;
  lrAreaAvgGbp: number;
  lrEstimatedValueRangeLow: number;
  lrEstimatedValueRangeHigh: number;

  // Total opportunity
  totalAnnualOpportunityGbp: number;
}

// ─── Top-level audit result ───────────────────────────────────────────────────

export interface EcoAuditResult {
  params: AuditParams;
  epc: EpcData | null;
  solar: SolarData | null;
  landRegistry: LandRegistryData | null;
  derived: DerivedData | null;
  fetchedAt: string;
}

export type AuditStatus = "loading" | "partial" | "complete" | "error";
