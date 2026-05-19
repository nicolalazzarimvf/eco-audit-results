import { ChevronRight } from "./Icons";
import "./report.css";

type Props = {
  id: string;
  title: string;
  ctaLabel?: string;
  ctaHref?: string;
  children: React.ReactNode;
};

export default function ReportSection({ id, title, ctaLabel, ctaHref, children }: Props) {
  return (
    <section id={id} className="report-section">
      <div className="report-section-header">
        <h2 className="report-section-title">{title}</h2>
      </div>
      <div className="report-section-body">
        {children}
        {ctaLabel && ctaHref ? (
          <a className="report-btn-primary" href={ctaHref} target="_blank" rel="noreferrer">
            {ctaLabel}
            <ChevronRight />
          </a>
        ) : null}
      </div>
    </section>
  );
}
