"use client";
import type { LandRegistryData, DerivedData } from "@/types/eco-audit";

function fmt(gbp: number) {
  return "£" + gbp.toLocaleString("en-GB");
}

export default function PropertyValueCard({
  lr,
  derived,
}: {
  lr: LandRegistryData;
  derived: DerivedData;
}) {
  const lastSale = lr.ownHistory[0];
  const hasValueData = derived.lrAreaMedianGbp > 0;

  return (
    <section style={{ background: "var(--surface)", borderRadius: 12, padding: 32, border: "1px solid var(--border)", boxShadow: "var(--card-shadow)" }}>
      <h2 style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: 16 }}>
        Property Value Context
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 12,
          background: "var(--surface-2)",
          borderRadius: 8,
          padding: 16,
          marginBottom: 16,
        }}
      >
        {lastSale && (
          <div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{fmt(lastSale.priceGbp)}</div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>
              Last sold {lastSale.date} ({lastSale.propertyType} {lastSale.estateType})
            </div>
          </div>
        )}
        <div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>
            {hasValueData ? fmt(derived.lrAreaMedianGbp) : "Unavailable"}
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>
            Area median ({lr.valuationConfidence === "low" ? "broader fallback comparables" : "similar properties"})
          </div>
        </div>
      </div>

      {lr.valuationConfidence === "none" && (
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>
          No recent comparable sales were returned by Land Registry for this postcode area.
        </div>
      )}

      {lr.areaComparables.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>
            Recent comparable sales
          </div>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 5 }}>
            {lr.areaComparables.slice(0, 8).map((sale, i) => (
              <li
                key={i}
                style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}
              >
                <span style={{ color: "var(--muted)" }}>
                  {sale.paon} {sale.street}, {sale.postcode}
                </span>
                <span style={{ fontWeight: 600, marginLeft: 12 }}>{fmt(sale.priceGbp)}</span>
              </li>
            ))}
          </ul>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 10 }}>
            Range: {fmt(lr.areaMinGbp)} – {fmt(lr.areaMaxGbp)} · Avg: {fmt(derived.lrAreaAvgGbp)} · {lr.areaComparables.length} sales
          </div>
        </div>
      )}
    </section>
  );
}
