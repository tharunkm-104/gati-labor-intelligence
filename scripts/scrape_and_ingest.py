"""
Template scraper for controlled public-data ingestion.

This draft is intentionally conservative: it respects robots/security boundaries,
uses ordinary HTTP requests, and updates only local files that you own. It does not
attempt to bypass blocks, authentication, rate limits, or bot protections.
"""

from __future__ import annotations

import re
from pathlib import Path
from typing import Iterable
from urllib.parse import urljoin, urlparse

import pandas as pd
import requests

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_DIR = ROOT / "public"
DOWNLOAD_DIR = PUBLIC_DIR / "downloads"
WORKBOOK_PATH = PUBLIC_DIR / "Master_Vacancy_Data.xlsx"


def fetch_page(url: str) -> str:
    response = requests.get(
        url,
        timeout=20,
        headers={"User-Agent": "GlobalLaborDataHub/0.1 (+responsible public data verification)"},
    )
    response.raise_for_status()
    return response.text


def discover_download_links(source_url: str, html: str) -> list[str]:
    candidates = re.findall(r'href=["\']([^"\']+\.(?:csv|xlsx|xls))["\']', html, flags=re.IGNORECASE)
    return [urljoin(source_url, candidate) for candidate in candidates]


def safe_filename(url: str) -> str:
    parsed = urlparse(url)
    name = Path(parsed.path).name or "downloaded_dataset"
    return re.sub(r"[^A-Za-z0-9._-]+", "_", name)


def download_file(url: str) -> Path:
    DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)
    destination = DOWNLOAD_DIR / safe_filename(url)
    with requests.get(url, stream=True, timeout=60) as response:
        response.raise_for_status()
        with destination.open("wb") as file:
            for chunk in response.iter_content(chunk_size=1024 * 256):
                if chunk:
                    file.write(chunk)
    return destination


def update_workbook(record_id: str, direct_link: str, local_path: Path) -> None:
    sheets = pd.read_excel(WORKBOOK_PATH, sheet_name=None)
    updated_sheets = {}

    for sheet_name, frame in sheets.items():
        frame = frame.copy()
        if "id" not in frame.columns:
            frame["id"] = (
                frame.get("Country", "").astype(str)
                + "-"
                + frame.get("Official Agency", "").astype(str)
                + "-"
                + frame.get("Data Category", "").astype(str)
            ).str.lower().str.replace(r"[^a-z0-9]+", "-", regex=True)

        match = frame["id"] == record_id
        if match.any():
            frame.loc[match, "Direct Download Link"] = direct_link
            frame.loc[match, "Ingestion Status"] = "Ingested"
            frame.loc[match, "Local File"] = str(local_path.relative_to(PUBLIC_DIR)).replace("\\", "/")
        updated_sheets[sheet_name] = frame

    with pd.ExcelWriter(WORKBOOK_PATH, engine="openpyxl") as writer:
        for sheet_name, frame in updated_sheets.items():
            frame.to_excel(writer, sheet_name=sheet_name, index=False)


def ingest(record_id: str, source_url: str) -> None:
    html = fetch_page(source_url)
    links = discover_download_links(source_url, html)
    if not links:
        raise RuntimeError(f"No CSV/XLS/XLSX links discovered at {source_url}")

    direct_link = links[0]
    local_path = download_file(direct_link)
    update_workbook(record_id, direct_link, local_path)
    print(f"Ingested {record_id}: {direct_link} -> {local_path}")


if __name__ == "__main__":
    raise SystemExit(
        "Import this template and call ingest(record_id, source_url) from a supervised automation job."
    )
