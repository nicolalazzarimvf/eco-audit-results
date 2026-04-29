"use client";
import type { EpcData, DerivedData } from "@/types/eco-audit";

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

export default function OpportunityCard({
  epc,
  derived,
}: {
  epc: EpcData | null;
  derived: DerivedData;
}) {
  const solar = derived.recommendedSolar;
  const epcImprovements = epc?.improvements ?? [];

  const rows = [
    solar && {
      label: `Solar panels (${solar.panelsCount}p, ${solar.kWp} kWp)`,
      detail: "Estimated annual benefit from the recommended array",
      saving: solar.totalAnnualGbp,
      color: "var(--accent)",
    },
    ...epcImprovements.map((imp) => ({
      label: improvementTitle(imp.improvementType, imp.sequence),
      detail: imp.improvementSummaryText,
      saving: imp.typicalSavingGbp,
      color: "var(--info)",
    })),
  ].filter(Boolean) as { label: string; detail: string; saving: number; color: string }[];

  return (
    <section
      style={{
        background: "var(--surface)",
        borderRadius: 12,
        padding: 32,
        border: "1px solid var(--border)",
        boxShadow: "var(--card-shadow)",
      }}
    >
      <h2
        style={{
          fontSize: 13,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--muted)",
          marginBottom: 16,
        }}
      >
        Total Opportunity
      </h2>

      <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.map((row, i) => (
          <li
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 14,
              paddingBottom: 8,
              borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none",
            }}
          >
            <span>
              <div style={{ fontWeight: 600 }}>{row.label}</div>
              <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 2 }}>{row.detail}</div>
            </span>
            <span style={{ color: row.color, fontWeight: 700, flexShrink: 0, marginLeft: 12 }}>
              £{formatNumber(row.saving)}/yr
            </span>
          </li>
        ))}
      </ul>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 16,
          paddingTop: 16,
          borderTop: "2px solid var(--border)",
          fontSize: 18,
          fontWeight: 700,
        }}
      >
        <span>Total potential saving</span>
        <span style={{ color: "var(--accent)" }}>
          ~£{formatNumber(derived.totalAnnualOpportunityGbp)}/yr
        </span>
      </div>
    </section>
  );
}
