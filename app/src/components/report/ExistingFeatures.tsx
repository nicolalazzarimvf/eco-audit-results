import type { EpcData } from "@/types/eco-audit";
import { IconCheck, IconEv, IconHeatPump, IconSun } from "./Icons";
import "./report.css";

type Feature = {
  label: string;
  icon: React.ReactNode;
  active: boolean;
};

export default function ExistingFeatures({ epc, hasEv }: { epc: EpcData; hasEv: boolean }) {
  const features: Feature[] = [
    { label: "Solar PV", icon: <IconSun size={18} />, active: epc.hasSolarPv },
    { label: "Solar thermal", icon: <IconSun size={18} />, active: epc.hasSolarWaterHeating },
    { label: "Heat pump", icon: <IconHeatPump size={18} />, active: /heat pump/i.test(epc.mainHeatingDescription) },
    { label: "EV charging", icon: <IconEv size={18} />, active: hasEv },
    { label: "Loft insulation", icon: <IconCheck size={18} />, active: epc.roof.energyRating >= 4 },
    { label: "Wall insulation", icon: <IconCheck size={18} />, active: epc.walls.energyRating >= 4 },
  ];

  return (
    <div className="report-features-row">
      {features.map((f) => (
        <div
          key={f.label}
          className={`report-feature-chip${f.active ? " report-feature-chip--active" : ""}`}
        >
          <div className="report-feature-chip-icon">{f.icon}</div>
          {f.label}
          {f.active ? " ✓" : ""}
        </div>
      ))}
    </div>
  );
}
