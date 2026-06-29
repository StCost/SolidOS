"""
Bake trading-terminal-preview.html to trading-terminal-preview.jpg using Chromium.

Usage (from this folder or repo root):
  python bake_trading_terminal_preview.py
"""

from __future__ import annotations

import asyncio
from pathlib import Path

from playwright.async_api import async_playwright

PREVIEW_WIDTH = 768
PREVIEW_HEIGHT = 768


async def main_async() -> None:
    folder = Path(__file__).resolve().parent
    html_path = folder / "trading-terminal-preview.html"
    output_path = folder / "trading-terminal-preview.jpg"

    if not html_path.is_file():
        raise FileNotFoundError(f"Missing preview HTML: {html_path}")

    html_url = html_path.resolve().as_uri()

    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch()
        page = await browser.new_page(
            viewport={"width": PREVIEW_WIDTH, "height": PREVIEW_HEIGHT},
            device_scale_factor=1,
        )
        await page.goto(html_url, wait_until="networkidle")
        await page.wait_for_timeout(500)
        await page.screenshot(
            path=str(output_path),
            type="jpeg",
            quality=92,
            full_page=False,
        )
        await browser.close()

    print(f"Baked {output_path.name} ({PREVIEW_WIDTH}x{PREVIEW_HEIGHT})")


def main() -> None:
    asyncio.run(main_async())


if __name__ == "__main__":
    main()
