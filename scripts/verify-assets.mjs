import { existsSync, statSync } from "node:fs";
import { join } from "node:path";

const workbook = join(process.cwd(), "public", "Master_Vacancy_Data.xlsx");

if (!existsSync(workbook)) {
  console.error("Missing public/Master_Vacancy_Data.xlsx");
  process.exit(1);
}

if (statSync(workbook).size < 1024) {
  console.error("public/Master_Vacancy_Data.xlsx is unexpectedly small");
  process.exit(1);
}

console.log("Verified public/Master_Vacancy_Data.xlsx");
