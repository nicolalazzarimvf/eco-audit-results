import type { EpcData } from "@/types/eco-audit";
import { IconDraft, IconRoof, IconWall, IconWindow } from "./Icons";
import "./report.css";

function ratingStatus(score: number): { label: string; className: string } {
  if (score >= 4) return { label: "Good", className: "report-status--good" };
  if (score >= 2) return { label: "Attention", className: "report-status--warn" };
  return { label: "Poor", className: "report-status--poor" };
}

type Insight = {
  title: string;
  description: string;
  icon: React.ReactNode;
  status: { label: string; className: string };
};

export default function InsulationInsights({ epc }: { epc: EpcData }) {
  const items: Insight[] = [
    {
      title: "Window glazing",
      description: epc.windows.description || "Glazing performance from your EPC record.",
      icon: <IconWindow />,
      status: ratingStatus(epc.windows.energyRating),
    },
    {
      title: "Wall insulation",
      description: epc.walls.description || "External or cavity wall insulation potential.",
      icon: <IconWall />,
      status: ratingStatus(epc.walls.energyRating),
    },
    {
      title: "Loft insulation",
      description: epc.roof.description || "Roof and loft insulation depth and type.",
      icon: <IconRoof />,
      status: ratingStatus(epc.roof.energyRating),
    },
    {
      title: "Draught proofing",
      description: "Air tightness and ventilation balance for your property type.",
      icon: <IconDraft />,
      status: ratingStatus(Math.min(epc.windows.energyRating, epc.floor.energyRating)),
    },
  ];

  return (
    <div className="report-insight-grid">
      {items.map((item) => (
        <article key={item.title} className="report-insight-card">
          <span className={`report-status ${item.status.className}`}>{item.status.label}</span>
          <div className="report-insight-icon">{item.icon}</div>
          <h4>{item.title}</h4>
          <p>{item.description}</p>
        </article>
      ))}
    </div>
  );
}
