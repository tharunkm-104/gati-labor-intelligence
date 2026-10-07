# Global Labor Market & Demand Intelligence Hub

Next.js 14 dashboard for exploring verified public labor market, vacancy demand, and workforce mobility datasets from `public/Master_Vacancy_Data.xlsx`.

## Local Setup

```bash
npm install
npm run dev
```

Open the local URL printed by Next.js, usually `http://localhost:3000`.

## Production Checks

```bash
npm run verify:assets
npm run lint
npm run build
```

## GitHub + Vercel Deployment

1. Create a new GitHub repository.
2. Upload this folder's contents to the repository root.
3. Import the repository into Vercel.
4. Add these GitHub repository secrets if using the included workflow:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
5. Push to `main`.

The GitHub Actions workflow in `.github/workflows/deploy.yml` verifies the Excel asset, runs linting, builds the Next.js app, and deploys to Vercel on pushes to `main`.

## Data File

The app reads:

```text
public/Master_Vacancy_Data.xlsx
```

Expected sheets:

- `Labour Market Data`
- `Demand Data`
- `Miscellaneous Data`
- `Country_Wise_Datasets`

## Responsible Scraping Note

The ingestion script in `scripts/scrape_and_ingest.py` is a conservative template. It does not bypass blocks, authentication, rate limits, or anti-bot systems.
