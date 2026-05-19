import { IconCo2, IconGauge, IconPound, IconSun } from "./Icons";
import "./report.css";

type Props = {
  annualSaving: string;
  solarKwp: string;
  co2Tonnes: string;
  efficiencyScore: string;
};

export default function KpiSummaryGrid({ annualSaving, solarKwp, co2Tonnes, efficiencyScore }: Props) {
  const items = [
    {
      label: "Potential yearly savings",
      value: annualSaving,
      icon: <IconPound size={22} />,
      iconClass: "report-kpi-icon--savings",
    },
    {
      label: "Potential solar capacity",
      value: solarKwp,
      icon: <IconSun size={22} />,
      iconClass: "report-kpi-icon--solar",
    },
    {
      label: "CO₂ reduction potential",
      value: co2Tonnes,
      icon: <IconCo2 size={22} />,
      iconClass: "report-kpi-icon--co2",
    },
    {
      label: "Eco efficiency uplift",
      value: efficiencyScore,
      icon: <IconGauge size={22} />,
      iconClass: "report-kpi-icon--score",
    },
  ];

  return (
    <div className="report-kpi-grid">
      {items.map((item) => (
        <div key={item.label} className="report-kpi-card">
          <div className={`report-kpi-icon ${item.iconClass}`}>{item.icon}</div>
          <div>
            <div className="report-kpi-label">{item.label}</div>
            <div className="report-kpi-value">{item.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

