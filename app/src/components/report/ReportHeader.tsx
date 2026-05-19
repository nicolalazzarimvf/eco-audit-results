import { EcoLogoMark } from "./Icons";
import "./report.css";

export default function ReportHeader() {
  return (
    <header className="report-header">
      <div className="report-header-inner">
        <a
          className="report-logo"
          href="https://www.theecoexperts.co.uk/"
          target="_blank"
          rel="noreferrer"
        >
          <EcoLogoMark size={40} />
          <div className="report-logo-text">
            The Eco Experts
            <span>Personalised home energy insights</span>
          </div>
        </a>
        <nav className="report-nav" aria-label="Site">
          <a href="https://www.theecoexperts.co.uk/" target="_blank" rel="noreferrer">
            Home
          </a>
          <a href="https://www.theecoexperts.co.uk/solar-panels" target="_blank" rel="noreferrer">
            Solar
          </a>
          <a href="https://www.theecoexperts.co.uk/about-us" target="_blank" rel="noreferrer">
            About
          </a>
          <a href="https://www.theecoexperts.co.uk/contact-us" target="_blank" rel="noreferrer">
            Contact
          </a>
        </nav>
      </div>
    </header>
  );
}
