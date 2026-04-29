"use client";
import type { SolarData, DerivedData, SolarEconomics } from "@/types/eco-audit";
import { useState } from "react";

function formatNumber(value: number): string {
  return value.toLocaleString("en-GB");
}

function ConfigRow({
  config,
  selected,
  onClick,
}: {
  config: SolarEconomics;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <tr
      onClick={onClick}
      style={{
        cursor: "pointer",
        background: selected ? "var(--surface-2)" : "transparent",
        outline: selected ? "1px solid var(--accent)" : "none",
      }}
    >
      <td style={{ padding: "6px 8px", fontWeight: selected ? 700 : 400 }}>{config.panelsCount}p</td>
      <td style={{ padding: "6px 8px", color: "var(--muted)" }}>{config.kWp} kWp</td>
      <td style={{ padding: "6px 8px", color: "var(--accent)", fontWeight: 600 }}>£{config.totalAnnualGbp}/yr</td>
      <td style={{ padding: "6px 8px", color: "var(--muted)" }}>{config.paybackYrs}y payback</td>
      <td style={{ padding: "6px 8px" }}>£{formatNumber(config.installCostGbp)}</td>
    </tr>
  );
}

export default function SolarCard({
  solar,
  derived,
}: {
  solar: SolarData;
  derived: DerivedData;
}) {
  const [selectedIndex, setSelectedIndex] = useState(
    derived.solarEconomics.findIndex(
      (s) => s.panelsCount === derived.recommendedSolar?.panelsCount
    )
  );

  const selected = derived.solarEconomics[selectedIndex] ?? derived.recommendedSolar;
  const bestSeg = solar.roofSegments.find((s) => s.isBest);

  return (
    <section style={{ background: "var(--surface)", borderRadius: 12, padding: 32, border: "1px solid var(--border)", boxShadow: "var(--card-shadow)" }}>
      <h2 style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: 16 }}>
        Solar Potential
      </h2>

      {bestSeg && (
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>
          Best roof: {bestSeg.facingLabel}-facing ({bestSeg.azimuthDeg}°) · {bestSeg.pitchDeg}° pitch · {bestSeg.areaM2} m² · {formatNumber(bestSeg.maxSunshineHrsYr)} hrs/yr
        </div>
      )}

      {selected && (
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
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: "var(--accent)" }}>£{selected.totalAnnualGbp}</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>Annual saving</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{selected.paybackYrs}y</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>Payback period</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700 }}>£{formatNumber(selected.twentyYrNetGbp)}</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>20yr net saving</div>
          </div>
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
              <th style={{ textAlign: "left", padding: "4px 8px", fontWeight: 500 }}>System</th>
              <th style={{ textAlign: "left", padding: "4px 8px", fontWeight: 500 }}>Size</th>
              <th style={{ textAlign: "left", padding: "4px 8px", fontWeight: 500 }}>Saving</th>
              <th style={{ textAlign: "left", padding: "4px 8px", fontWeight: 500 }}>Payback</th>
              <th style={{ textAlign: "left", padding: "4px 8px", fontWeight: 500 }}>Cost</th>
            </tr>
          </thead>
          <tbody>
            {derived.solarEconomics
              .filter((s) => [4, 6, 8, 10, 12, 16, 20, solar.maxPanelsCount].includes(s.panelsCount))
              .map((config, i) => (
                <ConfigRow
                  key={config.panelsCount}
                  config={config}
                  selected={config.panelsCount === selected?.panelsCount}
                  onClick={() =>
                    setSelectedIndex(
                      derived.solarEconomics.findIndex((s) => s.panelsCount === config.panelsCount)
                    )
                  }
                />
              ))}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 12 }}>
        {solar.maxPanelsCount} max panels · {solar.imageryQuality} imagery quality · {solar.panelCapacityW}W panels
      </div>
    </section>
  );
}
