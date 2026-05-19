import type { DerivedData, EpcData } from "@/types/eco-audit";
import { IconRoof, IconSun } from "./Icons";
import "./report.css";

function formatMoney(value: number) {
  return `£${Math.round(value || 0).toLocaleString("en-GB")}`;
}

function improvementTitle(type: string, sequence: number): string {
  const code = type.toUpperCase();
  if (code.startsWith("W")) return "Loft & wall insulation";
  if (code === "G") return "Smart heating controls";
  if (code === "U") return "Boiler upgrade";
  return `Upgrade ${sequence}`;
}

export default function TopOpportunities({ epc, derived }: { epc: EpcData | null; derived: DerivedData }) {
  const solar = derived.recommendedSolar;
  const topEpc = epc?.improvements?.[0];

  const opportunities = [
    solar && {
      title: "Solar panels",
      description: `Recommended ${solar.kWp} kWp system with ${solar.paybackYrs} year payback.`,
      saving: solar.totalAnnualGbp,
      icon: <IconSun size={22} />,
    },
    topEpc && {
      title: improvementTitle(topEpc.improvementType, topEpc.sequence),
      description: topEpc.improvementSummaryText,
      saving: topEpc.typicalSavingGbp,
      icon: <IconRoof size={22} />,
    },
    {
      title: "Smart heating controls",
      description: "Optimise when your heating runs to cut waste without comfort loss.",
      saving: Math.round(derived.totalEnergyCostSavingGbp * 0.15) || 120,
      icon: <IconRoof size={22} />,
    },
  ].filter(Boolean) as {
    title: string;
    description: string;
    saving: number;
    icon: React.ReactNode;
  }[];

  const topThree = opportunities.slice(0, 3);
  const co2Pct =
    epc && epc.co2EmissionsCurrentT > 0
      ? Math.round(
          ((epc.co2EmissionsCurrentT - epc.co2EmissionsPotentialT) / epc.co2EmissionsCurrentT) * 100
        )
      : Math.round(derived.co2SavingTYr * 10);

  return (
    <>
      <div className="report-opportunities">
        {topThree.map((opp) => (
          <article key={opp.title} className="report-opportunity-card">
            <div className="report-insight-icon">{opp.icon}</div>
            <h4>{opp.title}</h4>
            <p>{opp.description}</p>
            <div className="report-opportunity-saving">{formatMoney(opp.saving)}/yr</div>
          </article>
        ))}
      </div>
      <div className="report-summary-bar">
        <div>
          <strong>{formatMoney(derived.totalAnnualOpportunityGbp)}</strong>
          <span>Total annual savings</span>
        </div>
        <div>
          <strong>{co2Pct}%</strong>
          <span>CO₂ reduction</span>
        </div>
        <div>
          <strong>{solar?.paybackYrs ?? "—"} yrs</strong>
          <span>Estimated payback</span>
        </div>
      </div>
    </>
  );
}
