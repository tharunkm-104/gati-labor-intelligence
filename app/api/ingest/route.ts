import { NextResponse } from "next/server";

type IngestPayload = {
  url?: string;
  recordId?: string;
  directDownloadLink?: string;
  ingestionStatus?: string;
};

export async function POST(request: Request) {
  let payload: IngestPayload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (!payload.url || !payload.recordId) {
    return NextResponse.json({ error: "`url` and `recordId` are required." }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    message:
      "Ingestion callback accepted. In production, persist this update in a controlled data pipeline and regenerate Master_Vacancy_Data.xlsx.",
    received: {
      recordId: payload.recordId,
      url: payload.url,
      directDownloadLink: payload.directDownloadLink ?? null,
      ingestionStatus: payload.ingestionStatus ?? "Ingested"
    }
  });
}
