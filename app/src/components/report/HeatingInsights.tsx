import type { DerivedData, EpcData } from "@/types/eco-audit";
import { IconFlame, IconHeatPump } from "./Icons";
import "./report.css";

function formatMoney(value: number) {
  return `£${Math.round(value || 0).toLocaleString("en-GB")}`;
}

export default function HeatingInsights({ epc, derived }: { epc: EpcData; derived: DerivedData }) {
  const boilerEfficiency = Math.min(95, Math.max(55, 100 - epc.currentScore * 0.45));
  const ashpSavingLow = Math.round(derived.totalEnergyCostSavingGbp * 0.35);
  const ashpSavingHigh = Math.round(derived.totalEnergyCostSavingGbp * 0.55);

  return (
    <div className="report-heating-split">
      <div className="report-heating-card">
        <div className="report-insight-icon" style={{ marginBottom: 10 }}>
          <IconFlame />
        </div>
        <h4 style={{ margin: "0 0 8px", fontSize: 16, color: "#0a3d52" }}>Your boiler</h4>
        <p style={{ margin: "0 0 12px", fontSize: 13, color: "#5c7381" }}>{epc.mainHeatingDescription}</p>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#0a3d52" }}>{Math.round(boilerEfficiency)}%</div>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#5c7381" }}>Estimated system efficiency</p>
        <div
          style={{
            marginTop: 10,
            height: 8,
            borderRadius: 999,
            background: "#e8f0f5",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${boilerEfficiency}%`,
              height: "100%",
              background: "linear-gradient(90deg, #f59e0b, #fbbf24)",
              borderRadius: 999,
            }}
          />
        </div>
      </div>
      <div className="report-heating-card report-heating-card--highlight">
        <div className="report-insight-icon" style={{ marginBottom: 10, background: "#e8f8ee", color: "#0a8f49" }}>
          <IconHeatPump />
        </div>
        <h4 style={{ margin: "0 0 8px", fontSize: 16, color: "#0a3d52" }}>Heat pump suitability</h4>
        <ul style={{ margin: "0 0 12px", paddingLeft: 18, fontSize: 13, color: "#3d5a6b", lineHeight: 1.6 }}>
          <li>Lower carbon heating for most UK homes</li>
          <li>Works well with improved insulation</li>
          <li>Eligible for BUS grant in many cases</li>
        </ul>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0a8f49" }}>
          {formatMoney(ashpSavingLow)} – {formatMoney(ashpSavingHigh)} estimated annual savings
        </p>
        <p style={{ margin: "6px 0 0", fontSize: 12, color: "#5c7381" }}>~300% system efficiency vs gas boiler</p>
      </div>
    </div>
  );
}
