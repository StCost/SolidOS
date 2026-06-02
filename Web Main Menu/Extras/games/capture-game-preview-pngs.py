"""
Capture 16:9 list preview PNGs from each extras game (gameplay screenshot).
Writes {game-id}-preview.png only.

Run from repo: python "Assets/StreamingAssets/Web UI/Web Main Menu/Extras/games/capture-game-preview-pngs.py"
Requires: pip install playwright && playwright install chromium
"""

from __future__ import annotations

import http.server
import os
import socket
import threading
import time

from playwright.sync_api import sync_playwright

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MENU_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "..", ".."))
PREVIEW_WIDTH = 640
PREVIEW_HEIGHT = 360

GAMES = [
    ("atom-clicker", 2200),
    ("deep-collapse", 2800),
    ("citrus-slice", 2200),
    ("last-run", 2200),
    ("factory-night", 3500),
    ("orbital-golf", 2800),
    ("trouble-drivers", 2800),
    ("sector-vector", 2800),
    ("playing-cards", 1800),
    ("calculator", 1200),
]


def get_free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


def start_http_server(port: int) -> http.server.ThreadingHTTPServer:
    menu_root = MENU_ROOT

    class MenuHandler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, request, client_address, server):
            super().__init__(request, client_address, server, directory=menu_root)

    server = http.server.ThreadingHTTPServer(("127.0.0.1", port), MenuHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server


def main() -> None:
    port = get_free_port()
    server = start_http_server(port)
    base_url = "http://127.0.0.1:" + str(port) + "/Extras/games/"

    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch()
            page = browser.new_page(
                viewport={"width": PREVIEW_WIDTH, "height": PREVIEW_HEIGHT},
                device_scale_factor=1,
            )
            for game_id, wait_ms in GAMES:
                url = base_url + game_id + "/index.html"
                output_path = os.path.join(SCRIPT_DIR, game_id, game_id + "-preview.png")
                page.goto(url, wait_until="load", timeout=60000)
                page.wait_for_timeout(wait_ms)
                page.screenshot(path=output_path, type="png")
                print("Wrote " + output_path)
            browser.close()
    finally:
        server.shutdown()


if __name__ == "__main__":
    main()
