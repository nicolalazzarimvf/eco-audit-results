"use client";

interface SatelliteMapCardProps {
  lat: number;
  lng: number;
  address: string;
  mapUrl: string | null;
}

export default function SatelliteMapCard({
  lat,
  lng,
  address,
  mapUrl,
}: SatelliteMapCardProps) {
  return (
    <section
      style={{
        background: "var(--surface)",
        borderRadius: 12,
        padding: 32,
        border: "1px solid var(--border)",
        boxShadow: "var(--card-shadow)",
      }}
    >
      <h2
        style={{
          fontSize: 13,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--muted)",
          marginBottom: 12,
        }}
      >
        Satellite View
      </h2>

      {mapUrl ? (
        // Using a direct static map URL keeps this embeddable in partner iframes without extra image config.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mapUrl}
          alt={`Satellite map for ${address || "selected property"}`}
          style={{
            width: "100%",
            height: "auto",
            borderRadius: 10,
            border: "1px solid var(--border)",
            display: "block",
          }}
          loading="lazy"
        />
      ) : (
        <div
          style={{
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "var(--surface-2)",
            padding: 16,
            fontSize: 12,
            color: "var(--muted)",
          }}
        >
          Satellite image unavailable (missing Google Maps API key).
        </div>
      )}

      <div style={{ marginTop: 10, fontSize: 11, color: "var(--muted)" }}>
        Coordinates: {lat.toFixed(6)}, {lng.toFixed(6)}
      </div>
    </section>
  );
}
