import * as XLSX from "xlsx";

export const WORKBOOK_PATH = "/Master_Vacancy_Data.xlsx";

export const SHEETS = {
  labour: "Labour Market Data",
  demand: "Demand Data",
  misc: "Miscellaneous Data",
  countryWise: "Country_Wise_Datasets"
} as const;

export type SheetName = (typeof SHEETS)[keyof typeof SHEETS];

export type DatasetRecord = {
  id: string;
  Country: string;
  "Official Agency": string;
  "Data Category": string;
  Sector: string;
  URL: string;
  "Key Variables / Fields": string;
  Description: string;
  "Has Foreign Worker Data": boolean;
  "Ingestion Status": string;
  "Direct Download Link": string;
  "Verification Status": string;
  "HTTP Status": string;
  "Update Frequency": string;
  Language: string;
  "Standardized Category": string;
  [key: string]: string | boolean;
};

type RawRecord = Record<string, unknown>;

let workbookPromise: Promise<XLSX.WorkBook> | null = null;

export function isKnownCategory(sheetName: string | null | undefined): sheetName is SheetName {
  return Boolean(sheetName && Object.values(SHEETS).includes(sheetName as SheetName));
}

async function loadWorkbook() {
  if (!workbookPromise) {
    workbookPromise = fetch(WORKBOOK_PATH)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Could not load ${WORKBOOK_PATH}: ${response.status}`);
        }
        return response.arrayBuffer();
      })
      .then((buffer) => XLSX.read(buffer, { type: "array" }));
  }

  return workbookPromise;
}

function toText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function toBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  const normalized = toText(value).toLowerCase();
  return ["true", "yes", "1", "y"].includes(normalized);
}

function deriveSector(row: RawRecord) {
  const explicit = toText(row.Sector);
  if (explicit) return explicit;

  const haystack = `${toText(row["Data Category"])} ${toText(row["Key Variables / Fields"])} ${toText(row.Description)}`.toLowerCase();
  if (/(health|nurse|doctor|medical|care)/.test(haystack)) return "Healthcare";
  if (/(hospitality|hotel|restaurant|tourism|kitchen|food service)/.test(haystack)) return "Hospitality";
  if (/(construction|building|skilled trades|site labour)/.test(haystack)) return "Construction";
  if (/(logistics|transport|driver|warehouse|supply chain|freight)/.test(haystack)) return "Logistics";
  return "General";
}

function normalizeRecord(row: RawRecord, index: number): DatasetRecord {
  const url = toText(row.URL);
  const agency = toText(row["Official Agency"]);
  const country = toText(row.Country);
  const category = toText(row["Data Category"]);
  const standardizedCategory = toText(row["Standardized Category"]) || category;

  return {
    id: `${country}-${agency}-${category}-${index}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    Country: country || "Unknown",
    "Official Agency": agency || "Unknown agency",
    "Data Category": category || standardizedCategory || "Dataset",
    Sector: deriveSector(row),
    URL: url,
    "Key Variables / Fields": toText(row["Key Variables / Fields"]),
    Description: toText(row.Description),
    "Has Foreign Worker Data": toBoolean(row["Has Foreign Worker Data"]),
    "Ingestion Status": toText(row["Ingestion Status"]) || "Link Only",
    "Direct Download Link": toText(row["Direct Download Link"]),
    "Verification Status": toText(row["Verification Status"]) || "Needs Review",
    "HTTP Status": toText(row["HTTP Status"]),
    "Update Frequency": toText(row["Update Frequency"]) || "Not specified",
    Language: toText(row.Language) || "Source language",
    "Standardized Category": standardizedCategory,
    ...Object.fromEntries(Object.entries(row).map(([key, value]) => [key, typeof value === "boolean" ? value : toText(value)]))
  };
}

export async function getSheetData(sheetName: SheetName): Promise<DatasetRecord[]> {
  const workbook = await loadWorkbook();
  const worksheet = workbook.Sheets[sheetName];

  if (!worksheet) {
    throw new Error(`Sheet "${sheetName}" was not found in ${WORKBOOK_PATH}`);
  }

  const rows = XLSX.utils.sheet_to_json<RawRecord>(worksheet, {
    defval: "",
    raw: false
  });

  return rows.map(normalizeRecord);
}

export async function getCategoryData(sheetName: SheetName) {
  return getSheetData(sheetName);
}

export async function getCountryWiseData() {
  return getSheetData(SHEETS.countryWise);
}
