"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";

type AddressOption = {
  label: string;
  line1: string;
  line2: string;
  line3: string;
  postTown: string;
  postcode: string;
  udprn: string;
};

export type AddressRefinementCardProps = {
  postcode: string;
  /** Monthly energy bill from form (same basis as Optimizely KPI chip). */
  monthlyBill?: number;
  hasEv?: boolean;
  /** TYP-style hero card + copy; use with the full detailed report in the same iframe. */
  prominentLayout?: boolean;
};

function normalizePostcode(value: string): string {
  const compact = String(value || "").replace(/\s+/g, "").toUpperCase();
  if (!compact) return "";
  if (compact.length <= 3) return compact;
  return `${compact.slice(0, -3)} ${compact.slice(-3)}`;
}

function toPaon(addressLine1: string): string {
  const firstToken = String(addressLine1 || "").trim().split(/\s+/)[0] || "";
  return firstToken;
}

function toStreet(addressLine1: string): string {
  const parts = String(addressLine1 || "").trim().split(/\s+/);
  if (parts.length <= 1) return "";
  return parts.slice(1).join(" ");
}

function formatMoney(value: number): string {
  return `£${Math.round(value || 0).toLocaleString("en-GB")}`;
}

export default function AddressRefinementCard({
  postcode,
  monthlyBill,
  hasEv,
  prominentLayout,
}: AddressRefinementCardProps) {
  const [options, setOptions] = useState<AddressOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const canLookup = Boolean(postcode) && !loading;
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null;

  const normalizedPostcode = useMemo(() => normalizePostcode(postcode), [postcode]);
  const annualFromBill =
    monthlyBill != null && monthlyBill > 0 ? Math.round(monthlyBill * 12 * 0.22) : null;

  async function lookupAddresses() {
    if (!canLookup) return;
    setLoading(true);
    setError("");
    setOptions([]);
    setSelectedIndex(-1);
    try {
      const res = await fetch(`/api/addresses?postcode=${encodeURIComponent(normalizedPostcode)}`);
      const json = (await res.json()) as { addresses?: AddressOption[]; error?: string };
      if (!res.ok) {
        throw new Error(json.error || `Lookup failed (${res.status})`);
      }
      const next = Array.isArray(json.addresses) ? json.addresses : [];
      setOptions(next);
      if (!next.length) setError("No addresses found for this postcode.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Address lookup failed");
    } finally {
      setLoading(false);
    }
  }

  function applyAddress() {
    if (!selected || !privacyAccepted) return;
    const params = new URLSearchParams(window.location.search);
    const fullAddress = [selected.line1, selected.line2, selected.line3].filter(Boolean).join(", ");

    params.set("postcode", normalizePostcode(selected.postcode || normalizedPostcode));
    params.set("address", fullAddress);
    params.set("paon", toPaon(selected.line1));
    params.set("street", toStreet(selected.line1));
    params.set("accuracy", "address");
    params.delete("uprn");

    window.location.search = params.toString();
  }

  const pillBase: CSSProperties = {
    padding: "6px 10px",
    border: "1px solid #dce3ea",
    borderRadius: 999,
    fontSize: 12,
    color: "#244655",
    background: "#f8fbfd",
  };

  const addressBlock = (
    <>
      <div style={{ marginTop: prominentLayout ? 12 : 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={lookupAddresses}
          disabled={!canLookup}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: prominentLayout ? "1px solid #b8d2de" : "1px solid var(--border)",
            background: prominentLayout ? "#fff" : "var(--surface-2)",
            color: prominentLayout ? "#123746" : undefined,
            fontWeight: prominentLayout ? 600 : undefined,
            cursor: canLookup ? "pointer" : "not-allowed",
          }}
        >
          {loading
            ? "Loading..."
            : prominentLayout
              ? "Find addresses"
              : `Find addresses for ${normalizedPostcode}`}
        </button>
      </div>

      {options.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <label htmlFor="address-select" style={{ display: "block", fontSize: 13, marginBottom: 6, color: "#244655", fontWeight: 600 }}>
            Select your address
          </label>
          <select
            id="address-select"
            value={selectedIndex < 0 ? "" : String(selectedIndex)}
            onChange={(e) => setSelectedIndex(e.target.value === "" ? -1 : Number(e.target.value))}
            style={{
              width: "100%",
              padding: "11px",
              borderRadius: 10,
              border: "1px solid #c9d7e0",
              background: "#fff",
              color: "#0a2533",
              fontSize: 14,
            }}
          >
            <option value="">Choose an address...</option>
            {options.map((opt, idx) => (
              <option key={`${opt.udprn}-${idx}`} value={idx}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <label
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
          marginTop: 12,
          fontSize: 12,
          color: prominentLayout ? "#1f4d60" : undefined,
          lineHeight: 1.45,
        }}
      >
        <input
          type="checkbox"
          checked={privacyAccepted}
          onChange={(e) => setPrivacyAccepted(e.target.checked)}
          style={{
            marginTop: 2,
            width: 16,
            height: 16,
            accentColor: "#0c8f49",
          }}
        />
        <span>
          {prominentLayout ? (
            <>
              I consent to using my address data for an accurate report and accept the{" "}
              <a href="https://www.theecoexperts.co.uk/privacy-policy" target="_blank" rel="noreferrer">
                privacy policy
              </a>
              .
            </>
          ) : (
            <>
              I agree to the use of my postcode/address data to generate this report and accept the{" "}
              <a href="https://www.theecoexperts.co.uk/privacy-policy" target="_blank" rel="noreferrer">
                privacy policy
              </a>
              .
            </>
          )}
        </span>
      </label>

      <div style={{ marginTop: 12 }}>
        <button
          type="button"
          onClick={applyAddress}
          disabled={!selected || !privacyAccepted}
          style={{
            padding: "11px 14px",
            borderRadius: 10,
            border: "1px solid #0b8c45",
            background: "#0fb356",
            color: "#fff",
            cursor: selected && privacyAccepted ? "pointer" : "not-allowed",
            opacity: selected && privacyAccepted ? 1 : 0.45,
            fontWeight: 700,
            width: prominentLayout ? "100%" : "auto",
          }}
        >
          {prominentLayout ? "Get accurate report" : "Update report with selected address"}
        </button>
      </div>

      {error && (
        <div style={{ marginTop: 10, color: prominentLayout ? "#a62a24" : "var(--danger)", fontSize: 13 }}>
          {error}
        </div>
      )}
    </>
  );

  if (prominentLayout) {
    const pills: string[] = [`Postcode area: ${normalizedPostcode}`];
    if (annualFromBill != null) {
      pills.push(`Estimated annual saving: ~${formatMoney(annualFromBill)}`);
    }
    if (hasEv) {
      pills.push("EV household detected");
    }

    return (
      <section
        style={{
          marginBottom: 18,
          padding: 16,
          background: "#fff",
          border: "1px solid #dce3ea",
          borderRadius: 12,
          fontFamily: "'Be Vietnam Pro', var(--font-sans, system-ui, sans-serif)",
        }}
      >
        <div
          style={{
            background: "linear-gradient(180deg, #f7fcff 0%, #f5fbf9 100%)",
            border: "1px solid #d9eaf1",
            borderRadius: 14,
            padding: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "#547080",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 4,
                }}
              >
                Postcode average report
              </div>
              <h2 style={{ fontSize: 22, lineHeight: 1.2, margin: 0, color: "#0a2533" }}>Your report is ready</h2>
              <p style={{ margin: "6px 0 0", fontSize: 14, lineHeight: 1.45, color: "#455865" }}>
                You are viewing postcode-average insights. Add your address below to unlock accurate house-level
                calculations.
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "12px 0 10px" }}>
            {pills.map((text) => (
              <div key={text} style={pillBase}>
                {text}
              </div>
            ))}
          </div>
          {addressBlock}
        </div>
      </section>
    );
  }

  return (
    <section
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: 18,
        boxShadow: "var(--card-shadow)",
        marginBottom: 18,
      }}
    >
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Improve data accuracy</h2>
      <p style={{ margin: 0, color: "var(--muted)", fontSize: 14, lineHeight: 1.45 }}>
        Current values are postcode-area estimates. For a more detailed property view, select your full address.
      </p>
      {addressBlock}
    </section>
  );
}
