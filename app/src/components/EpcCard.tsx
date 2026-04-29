"use client";
import type { EpcData, DerivedData } from "@/types/eco-audit";

const BAND_COLOR: Record<string, string> = {
  A: "var(--band-a)", B: "var(--band-b)", C: "var(--band-c)",
  D: "var(--band-d)", E: "var(--band-e)", F: "var(--band-f)", G: "var(--band-g)",
};

function formatNumber(value: number): string {
  return value.toLocaleString("en-GB");
}

function improvementTitle(type: string, sequence: number): string {
  const code = type.toUpperCase();
  if (code.startsWith("W")) return "Wall insulation upgrade";
  if (code === "G") return "Heating controls improvement";
  if (code === "U") return "Boiler / heating system upgrade";
  return `Upgrade ${sequence}`;
}

function GbpBadge({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 22, fontWeight: 700 }}>£{formatNumber(value)}</div>
      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{label}</div>
    </div>
  );
}

function BandBar({ band, score, label }: { band: string; score: number; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 6,
          background: BAND_COLOR[band] ?? "var(--muted)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          fontSize: 18,
          color: "#000",
          flexShrink: 0,
        }}
      >
        {band}
      </div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>{score} / 100</div>
        <div style={{ fontSize: 11, color: "var(--muted)" }}>{label}</div>
      </div>
    </div>
  );
}

export default function EpcCard({ epc, derived }: { epc: EpcData; derived: DerivedData }) {
  const improvement = derived.epcScoreImprovement;

  return (
    <section style={{ background: "var(--surface)", borderRadius: 12, padding: 32, border: "1px solid var(--border)", boxShadow: "var(--card-shadow)" }}>
      <h2 style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: 16 }}>
        Energy Performance
      </h2>

      <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <BandBar band={epc.currentBand} score={epc.currentScore} label="Current rating" />
        <div style={{ display: "flex", alignItems: "center", color: "var(--muted)", fontSize: 18 }}>→</div>
        <BandBar band={epc.potentialBand} score={epc.potentialScore} label={`Potential (+${improvement} pts)`} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          background: "var(--surface-2)",
          borderRadius: 8,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <GbpBadge label="Annual cost" value={derived.totalEnergyCostCurrentGbp} />
        <GbpBadge label="After upgrades" value={derived.totalEnergyCostPotentialGbp} />
        <GbpBadge label="EPC saving / yr" value={derived.totalEnergyCostSavingGbp} />
      </div>

      <div style={{ fontSize: 12, color: "var(--muted)" }}>
        {epc.dwellingType} · {epc.totalFloorAreaM2} m² · CO₂ {epc.co2EmissionsCurrentT}t/yr now → {epc.co2EmissionsPotentialT}t/yr potential
      </div>

      {epc.improvements.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>Recommended upgrades</div>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
            {epc.improvements.map((imp) => (
              <li key={imp.sequence} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, fontSize: 13 }}>
                <span>
                  <div style={{ fontWeight: 600 }}>{improvementTitle(imp.improvementType, imp.sequence)}</div>
                  <div style={{ color: "var(--muted)", marginTop: 2 }}>{imp.improvementSummaryText}</div>
                </span>
                <span style={{ color: "var(--accent)", fontWeight: 600, flexShrink: 0, marginLeft: 12 }}>
                  +£{formatNumber(imp.typicalSavingGbp)}/yr
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
