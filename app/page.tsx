import Link from "next/link";
import { ArrowRight, BarChart3, BriefcaseBusiness, Globe2, Search } from "lucide-react";
import { SHEETS } from "@/lib/excel";

const countries = ["Canada", "France", "Germany", "Italy", "Japan", "Poland", "South Korea", "Spain", "UK", "US"];

const categoryCards = [
  {
    title: "Labour Market Data",
    sheet: SHEETS.labour,
    description: "General employment, workforce demographics, participation rates, and national labour force statistics.",
    icon: BarChart3,
    accent: "text-teal bg-teal/10 border-teal/20"
  },
  {
    title: "Demand Data",
    sheet: SHEETS.demand,
    description: "Job posting volumes, ISCO-08 vacancy statistics, sector demand, and shortage indicators.",
    icon: BriefcaseBusiness,
    accent: "text-gold bg-gold/10 border-gold/20"
  },
  {
    title: "Miscellaneous & Mobility Data",
    sheet: SHEETS.misc,
    description: "Alternative indicators, foreign worker datasets, migration flows, and cross-border workforce signals.",
    icon: Globe2,
    accent: "text-indigo-700 bg-indigo-50 border-indigo-100"
  }
];

export default function Home() {
  return (
    <main className="min-h-screen">
      <header className="border-b border-line/80 bg-paper/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-muted">Global Skills Mobility</p>
            <h1 className="mt-2 font-display text-3xl font-bold text-ink md:text-4xl">
              Global Labor Market & Demand Intelligence Hub
            </h1>
          </div>
          <Link
            href="/explorer"
            className="focus-ring inline-flex w-fit items-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-soft hover:bg-teal"
          >
            <Search className="h-4 w-4" />
            Open Explorer
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="flex flex-wrap gap-2">
          {countries.map((country) => (
            <Link
              key={country}
              href={`/explorer?country=${encodeURIComponent(country)}`}
              className="focus-ring rounded-full border border-line bg-white px-3.5 py-2 text-sm font-semibold text-ink shadow-sm hover:border-teal hover:text-teal"
            >
              {country}
            </Link>
          ))}
        </div>

        <div className="grid gap-5 py-10 md:grid-cols-3">
          {categoryCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                href={`/explorer?category=${encodeURIComponent(card.sheet)}`}
                className="group focus-ring rounded-lg border border-line bg-white p-6 shadow-soft transition hover:-translate-y-1 hover:border-teal/60"
              >
                <div className={`mb-7 inline-flex h-12 w-12 items-center justify-center rounded-lg border ${card.accent}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h2 className="font-display text-2xl font-bold text-ink">{card.title}</h2>
                <p className="mt-3 min-h-24 text-sm leading-6 text-muted">{card.description}</p>
                <span className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-teal">
                  Explore datasets
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>

        <section className="rounded-lg border border-line bg-white p-6 shadow-soft">
          <div className="grid gap-6 md:grid-cols-[1.2fr_.8fr] md:items-center">
            <div>
              <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-muted">Excel-powered directory</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-ink">Built around the verified master workbook</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
                The dashboard reads `Master_Vacancy_Data.xlsx` directly from the public asset folder, preserving the four-sheet model produced by the local verification script.
              </p>
            </div>
            <Link
              href="/explorer"
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-md border border-line px-4 py-3 text-sm font-bold text-ink hover:border-teal hover:text-teal"
            >
              Unified country-wise search
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
