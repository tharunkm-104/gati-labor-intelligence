"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  Database,
  Download,
  Filter,
  Globe2,
  Home,
  Search,
  ShieldCheck,
  X,
  XCircle
} from "lucide-react";
import { DatasetRecord, SHEETS, SheetName, getCategoryData, getCountryWiseData, isKnownCategory } from "@/lib/excel";
import { cn } from "@/lib/utils";

const categoryOptions = [SHEETS.countryWise, SHEETS.labour, SHEETS.demand, SHEETS.misc] as SheetName[];
const sectorOptions = ["All", "Healthcare", "Hospitality", "Construction", "Logistics", "General"];

function truthyForeign(record: DatasetRecord) {
  return record["Has Foreign Worker Data"] === true;
}

function isVerified(record: DatasetRecord) {
  return record["Verification Status"].toLowerCase().includes("verified") || record["HTTP Status"] === "200";
}

function isIngested(record: DatasetRecord) {
  return record["Ingestion Status"].toLowerCase().includes("ingested");
}

function flagFor(country: string) {
  const flags: Record<string, string> = {
    Australia: "AU",
    Austria: "AT",
    Canada: "CA",
    "Czech Republic": "CZ",
    France: "FR",
    Germany: "DE",
    Hungary: "HU",
    Italy: "IT",
    Japan: "JP",
    Poland: "PL",
    "South Korea": "KR",
    Spain: "ES",
    UK: "GB",
    "United Kingdom": "GB",
    US: "US",
    USA: "US",
    "United States": "US"
  };
  return flags[country] ?? country.slice(0, 2).toUpperCase();
}

function splitVariables(value: string) {
  return value
    .split(/[,;|]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

export default function ExplorerPage() {
  const [records, setRecords] = useState<DatasetRecord[]>([]);
  const [activeSheet, setActiveSheet] = useState<SheetName>(SHEETS.countryWise);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [countries, setCountries] = useState<string[]>([]);
  const [sector, setSector] = useState("All");
  const [foreignOnly, setForeignOnly] = useState(false);
  const [verification, setVerification] = useState("All");
  const [ingestion, setIngestion] = useState("All");
  const [previewRecord, setPreviewRecord] = useState<DatasetRecord | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const category = params.get("category");
    const country = params.get("country");

    if (isKnownCategory(category)) {
      setActiveSheet(category);
    }

    if (country) {
      setCountries([country]);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setError("");
    const loader = activeSheet === SHEETS.countryWise ? getCountryWiseData : () => getCategoryData(activeSheet);

    loader()
      .then(setRecords)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load workbook data."))
      .finally(() => setLoading(false));
  }, [activeSheet]);

  const allCountries = useMemo(() => {
    return Array.from(new Set(records.map((record) => record.Country).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  }, [records]);

  const filteredRecords = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return records.filter((record) => {
      const searchable = [
        record.Country,
        record["Official Agency"],
        record.Sector,
        record["Key Variables / Fields"],
        record.Description,
        record["Data Category"]
      ]
        .join(" ")
        .toLowerCase();

      if (needle && !searchable.includes(needle)) return false;
      if (countries.length && !countries.includes(record.Country)) return false;
      if (sector !== "All" && record.Sector !== sector) return false;
      if (foreignOnly && !truthyForeign(record)) return false;
      if (verification === "Verified" && !isVerified(record)) return false;
      if (verification === "Needs Review" && isVerified(record)) return false;
      if (ingestion === "Ingested" && !isIngested(record)) return false;
      if (ingestion === "Link Only" && isIngested(record)) return false;
      return true;
    });
  }, [countries, foreignOnly, ingestion, query, records, sector, verification]);

  const previewRows = useMemo(() => {
    if (!previewRecord) return [];
    return records.slice(0, 10);
  }, [previewRecord, records]);

  function toggleCountry(country: string) {
    setCountries((current) => (current.includes(country) ? current.filter((item) => item !== country) : [...current, country]));
  }

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link href="/" className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-teal">
              <Home className="h-4 w-4" />
              Intelligence Hub
            </Link>
            <h1 className="font-display text-2xl font-bold text-ink">Dataset Explorer</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {categoryOptions.map((sheet) => (
              <button
                key={sheet}
                onClick={() => setActiveSheet(sheet)}
                className={cn(
                  "focus-ring rounded-md border px-3 py-2 text-sm font-semibold",
                  activeSheet === sheet ? "border-teal bg-teal text-white" : "border-line bg-white text-ink hover:border-teal"
                )}
              >
                {sheet === SHEETS.countryWise ? "Unified View" : sheet}
              </button>
            ))}
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[300px_1fr]">
        <aside className="h-fit rounded-lg border border-line bg-white p-4 shadow-soft lg:sticky lg:top-28">
          <div className="mb-4 flex items-center gap-2">
            <Filter className="h-4 w-4 text-teal" />
            <h2 className="font-display text-lg font-bold">Filters</h2>
          </div>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Search</span>
            <div className="mt-2 flex items-center gap-2 rounded-md border border-line px-3 py-2 focus-within:border-teal">
              <Search className="h-4 w-4 text-muted" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Country, agency, sector, variables"
                className="w-full border-0 bg-transparent text-sm outline-none"
              />
            </div>
          </label>

          <div className="mt-5">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Country</span>
            <div className="mt-2 max-h-56 space-y-1 overflow-auto pr-1">
              {allCountries.map((country) => (
                <label key={country} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-teal/5">
                  <input
                    type="checkbox"
                    checked={countries.includes(country)}
                    onChange={() => toggleCountry(country)}
                    className="h-4 w-4 accent-teal"
                  />
                  {country}
                </label>
              ))}
            </div>
          </div>

          <label className="mt-5 block">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Sector</span>
            <select
              value={sector}
              onChange={(event) => setSector(event.target.value)}
              className="focus-ring mt-2 w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
            >
              {sectorOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>

          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-md border border-line p-3 text-sm">
            <input
              type="checkbox"
              checked={foreignOnly}
              onChange={(event) => setForeignOnly(event.target.checked)}
              className="mt-1 h-4 w-4 accent-teal"
            />
            <span>
              <strong className="block text-ink">Foreign worker datasets only</strong>
              <span className="text-muted">Show immigration, mobility, and foreign workforce records.</span>
            </span>
          </label>

          <label className="mt-5 block">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Verification</span>
            <select
              value={verification}
              onChange={(event) => setVerification(event.target.value)}
              className="focus-ring mt-2 w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
            >
              <option>All</option>
              <option>Verified</option>
              <option>Needs Review</option>
            </select>
          </label>

          <label className="mt-5 block">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Ingestion status</span>
            <select
              value={ingestion}
              onChange={(event) => setIngestion(event.target.value)}
              className="focus-ring mt-2 w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
            >
              <option>All</option>
              <option>Ingested</option>
              <option>Link Only</option>
            </select>
          </label>

          <button
            onClick={() => {
              setQuery("");
              setCountries([]);
              setSector("All");
              setForeignOnly(false);
              setVerification("All");
              setIngestion("All");
            }}
            className="focus-ring mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-bold text-ink hover:border-teal hover:text-teal"
          >
            <X className="h-4 w-4" />
            Reset Filters
          </button>
        </aside>

        <section>
          <div className="mb-4 flex flex-col gap-2 rounded-lg border border-line bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-muted">Source sheet</p>
              <h2 className="font-display text-xl font-bold text-ink">{activeSheet === SHEETS.countryWise ? "Country-wise consolidated view" : activeSheet}</h2>
            </div>
            <p className="font-mono text-sm text-muted">{filteredRecords.length} of {records.length} records</p>
          </div>

          {loading && <div className="rounded-lg border border-line bg-white p-8 text-center text-muted shadow-soft">Loading Excel workbook...</div>}
          {error && <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">{error}</div>}

          {!loading && !error && (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredRecords.map((record) => (
                <article key={record.id} className="rounded-lg border border-line bg-white p-5 shadow-soft">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-ink px-2 py-1 font-mono text-xs font-bold text-white">{flagFor(record.Country)}</span>
                        <span className="text-sm font-bold text-teal">{record.Country}</span>
                      </div>
                      <h3 className="font-display text-xl font-bold leading-tight text-ink">{record["Official Agency"]}</h3>
                    </div>
                    <span className="rounded-full bg-teal/10 px-3 py-1 text-xs font-bold text-teal">{record.Sector}</span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {truthyForeign(record) && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                        <Globe2 className="h-3.5 w-3.5" />
                        Foreign Worker Data
                      </span>
                    )}
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold",
                        isVerified(record) ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                      )}
                    >
                      {isVerified(record) ? <ShieldCheck className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                      {isVerified(record) ? `Verified Link (${record["HTTP Status"] || "200"})` : "Needs Review / Broken"}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold",
                        isIngested(record) ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                      )}
                    >
                      {isIngested(record) ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Database className="h-3.5 w-3.5" />}
                      {isIngested(record) ? "Ingested" : "Link Only"}
                    </span>
                    <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-bold text-stone-700">{record["Data Category"]}</span>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-muted">{record.Description || "No description supplied yet."}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {splitVariables(record["Key Variables / Fields"]).map((variable) => (
                      <span key={variable} className="rounded-md border border-line bg-paper px-2 py-1 text-xs font-semibold text-ink">
                        {variable}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {record.URL && (
                      <a
                        href={record.URL}
                        target="_blank"
                        rel="noreferrer"
                        className="focus-ring inline-flex items-center gap-2 rounded-md bg-ink px-3 py-2 text-sm font-bold text-white hover:bg-teal"
                      >
                        Source Portal
                        <ArrowUpRight className="h-4 w-4" />
                      </a>
                    )}
                    {record["Direct Download Link"] && (
                      <a
                        href={record["Direct Download Link"]}
                        target="_blank"
                        rel="noreferrer"
                        className="focus-ring inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-bold text-ink hover:border-teal hover:text-teal"
                      >
                        <Download className="h-4 w-4" />
                        Download Raw File
                      </a>
                    )}
                    <button
                      onClick={() => setPreviewRecord(record)}
                      className="focus-ring inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-bold text-ink hover:border-teal hover:text-teal"
                    >
                      <Database className="h-4 w-4" />
                      Preview Data
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      {previewRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
          <div className="max-h-[86vh] w-full max-w-5xl overflow-hidden rounded-lg bg-white shadow-soft">
            <div className="flex items-start justify-between gap-4 border-b border-line p-5">
              <div>
                <p className="text-sm font-semibold text-teal">{previewRecord.Country}</p>
                <h2 className="font-display text-xl font-bold text-ink">{previewRecord["Official Agency"]}</h2>
                <p className="mt-1 text-sm text-muted">First 10 rows from the parsed Excel JSON for the active workbook view.</p>
              </div>
              <button onClick={() => setPreviewRecord(null)} className="focus-ring rounded-md border border-line p-2 hover:border-teal">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[62vh] overflow-auto p-5">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-paper">
                    <th className="px-3 py-3 font-semibold text-ink">Country</th>
                    <th className="px-3 py-3 font-semibold text-ink">Agency</th>
                    <th className="px-3 py-3 font-semibold text-ink">Category</th>
                    <th className="px-3 py-3 font-semibold text-ink">Sector</th>
                    <th className="px-3 py-3 font-semibold text-ink">Verification</th>
                    <th className="px-3 py-3 font-semibold text-ink">Key Variables</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row) => (
                    <tr key={row.id} className="border-b border-line last:border-0">
                      <td className="px-3 py-3 align-top text-ink">{row.Country}</td>
                      <td className="px-3 py-3 align-top text-muted">{row["Official Agency"]}</td>
                      <td className="px-3 py-3 align-top text-muted">{row["Data Category"]}</td>
                      <td className="px-3 py-3 align-top text-muted">{row.Sector}</td>
                      <td className="px-3 py-3 align-top text-muted">{row["Verification Status"]}</td>
                      <td className="px-3 py-3 align-top text-muted">{row["Key Variables / Fields"]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
