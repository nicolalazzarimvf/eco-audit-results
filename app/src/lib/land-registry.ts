import type { LandRegistryData, LrSale } from "@/types/eco-audit";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

const SPARQL_ENDPOINT = "https://landregistry.data.gov.uk/landregistry/query";

function sparql(query: string): string {
  return `${SPARQL_ENDPOINT}?query=${encodeURIComponent(query)}&output=json`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function saleFromBinding(b: any): LrSale {
  return {
    date: String(b.date?.value ?? ""),
    priceGbp: Number(b.amount?.value ?? 0),
    propertyType: String(b.type?.value ?? "").split("/").pop() ?? "",
    estateType: String(b.estate?.value ?? "").split("/").pop() ?? "",
    transactionCategory: String(b.category?.value ?? "").split("/").pop() ?? "",
    paon: String(b.paon?.value ?? ""),
    street: String(b.street?.value ?? ""),
    postcode: String(b.postcode?.value ?? ""),
  };
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

function sparqlString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

async function fetchSales(query: string, timeoutMs = 12000): Promise<LrSale[]> {
  const res = await fetchWithTimeout(
    sparql(query),
    { headers: { Accept: "application/sparql-results+json" } },
    timeoutMs
  );
  if (!res.ok) return [];
  const json = await res.json();
  return (json.results?.bindings ?? []).map(saleFromBinding);
}

export async function fetchLandRegistry(
  paon: string,
  street: string,
  postcode: string
): Promise<LandRegistryData> {
  const streetSafe = sparqlString(street.trim());
  const postcodeUpper = postcode.trim().toUpperCase();
  const paonSafe = sparqlString(paon.trim());
  const postcodeSafe = sparqlString(postcodeUpper);
  const [outward, inward = ""] = postcodeUpper.split(" ");
  const sectorPrefix = inward ? `${outward} ${inward[0]}` : outward;
  const outwardSafe = sparqlString(outward);
  const sectorSafe = sparqlString(sectorPrefix);

  // Own history
  const ownQuery = `
    PREFIX lrppi: <http://landregistry.data.gov.uk/def/ppi/>
    PREFIX lrcommon: <http://landregistry.data.gov.uk/def/common/>
    SELECT ?date ?amount ?type ?estate ?category ?paon ?street ?postcode WHERE {
      ?trans a lrppi:TransactionRecord ;
             lrppi:pricePaid ?amount ;
             lrppi:transactionDate ?date ;
             lrppi:propertyType ?type ;
             lrppi:estateType ?estate ;
             lrppi:transactionCategory ?category ;
             lrppi:propertyAddress ?addr .
      ?addr lrcommon:paon ?paon ;
            lrcommon:street ?street ;
            lrcommon:postcode ?postcode .
      FILTER(str(?paon) = "${paonSafe}")
      FILTER(LCASE(str(?street)) = LCASE("${streetSafe}"))
      FILTER(str(?postcode) = "${postcodeSafe}")
    }
    ORDER BY DESC(?date) LIMIT 10
  `;

  // Area comparables — terraced freehold, standard, last 4 years
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 4);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  const areaQuery = `
    PREFIX lrppi: <http://landregistry.data.gov.uk/def/ppi/>
    PREFIX lrcommon: <http://landregistry.data.gov.uk/def/common/>
    SELECT ?date ?amount ?type ?estate ?category ?paon ?street ?postcode WHERE {
      ?trans a lrppi:TransactionRecord ;
             lrppi:pricePaid ?amount ;
             lrppi:transactionDate ?date ;
             lrppi:propertyType ?type ;
             lrppi:estateType ?estate ;
             lrppi:transactionCategory ?category ;
             lrppi:propertyAddress ?addr .
      ?addr lrcommon:postcode ?postcode ;
            lrcommon:paon ?paon ;
            lrcommon:street ?street .
      FILTER(STRSTARTS(str(?postcode), "${sectorSafe}"))
      FILTER(?type = <http://landregistry.data.gov.uk/def/common/terraced>)
      FILTER(?estate = <http://landregistry.data.gov.uk/def/common/freehold>)
      FILTER(?category = <http://landregistry.data.gov.uk/def/ppi/standardPricePaidTransaction>)
      FILTER(?date >= "${cutoffStr}"^^<http://www.w3.org/2001/XMLSchema#date>)
    }
    LIMIT 30
  `;

  // Fallback: widen match to postcode outward code and drop strict type/estate filters.
  const areaFallbackQuery = `
    PREFIX lrppi: <http://landregistry.data.gov.uk/def/ppi/>
    PREFIX lrcommon: <http://landregistry.data.gov.uk/def/common/>
    SELECT ?date ?amount ?paon ?street ?postcode WHERE {
      ?trans a lrppi:TransactionRecord ;
             lrppi:pricePaid ?amount ;
             lrppi:transactionDate ?date ;
             lrppi:propertyAddress ?addr .
      ?addr lrcommon:postcode ?postcode .
      OPTIONAL { ?addr lrcommon:paon ?paon . }
      OPTIONAL { ?addr lrcommon:street ?street . }
      FILTER(STRSTARTS(str(?postcode), "${outwardSafe} "))
      FILTER(?date >= "${cutoffStr}"^^<http://www.w3.org/2001/XMLSchema#date>)
    }
    LIMIT 30
  `;

  const [ownHistory, strictAreaComparables] = await Promise.all([
    fetchSales(ownQuery, 10000).catch(() => []),
    fetchSales(areaQuery, 10000).catch(() => []),
  ]);
  const areaComparables =
    strictAreaComparables.length > 0
      ? strictAreaComparables
      : await fetchSales(areaFallbackQuery, 25000).catch(() => []);
  const valuationConfidence: LandRegistryData["valuationConfidence"] =
    strictAreaComparables.length > 0
      ? "high"
      : areaComparables.length > 0
      ? "low"
      : "none";

  const prices = areaComparables.map((s) => s.priceGbp).filter((p) => p > 0);
  const areaAvg = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
  const areaMin = prices.length ? Math.min(...prices) : 0;
  const areaMax = prices.length ? Math.max(...prices) : 0;

  return {
    ownHistory,
    areaComparables,
    valuationConfidence,
    areaMinGbp: areaMin,
    areaMaxGbp: areaMax,
    areaAvgGbp: areaAvg,
    areaMedianGbp: median(prices),
  };
}
