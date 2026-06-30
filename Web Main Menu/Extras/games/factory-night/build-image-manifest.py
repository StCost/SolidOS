"""
Scan assets/safe and assets/monster, write assets/image-manifest.json.
Run after adding or moving feed JPEGs: python build-image-manifest.py
"""

from __future__ import annotations

import json
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ASSETS_DIR = os.path.join(SCRIPT_DIR, "assets")
SAFE_DIR = os.path.join(ASSETS_DIR, "safe")
MONSTER_DIR = os.path.join(ASSETS_DIR, "monster")
MANIFEST_PATH = os.path.join(ASSETS_DIR, "image-manifest.json")
MANIFEST_JS_PATH = os.path.join(ASSETS_DIR, "image-manifest.js")
MANIFEST_JS_GLOBAL = "FACTORY_NIGHT_IMAGE_MANIFEST"


def list_feed_images(folder: str) -> list[str]:
    if not os.path.isdir(folder):
        return []
    names = []
    for name in os.listdir(folder):
        lower = name.lower()
        if lower.endswith(".jpg") or lower.endswith(".jpeg"):
            names.append(name)
    names.sort()
    return names


def main() -> None:
    os.makedirs(SAFE_DIR, exist_ok=True)
    os.makedirs(MONSTER_DIR, exist_ok=True)
    manifest = {
        "safe": list_feed_images(SAFE_DIR),
        "monster": list_feed_images(MONSTER_DIR),
    }
    with open(MANIFEST_PATH, "w", encoding="utf-8") as handle:
        json.dump(manifest, handle, indent=2)
        handle.write("\n")
    with open(MANIFEST_JS_PATH, "w", encoding="utf-8") as handle:
        handle.write("window.")
        handle.write(MANIFEST_JS_GLOBAL)
        handle.write("=")
        json.dump(manifest, handle, separators=(",", ":"))
        handle.write(";\n")
    print("Wrote", MANIFEST_PATH)
    print("Wrote", MANIFEST_JS_PATH)
    print("  safe:", len(manifest["safe"]))
    print("  monster:", len(manifest["monster"]))


if __name__ == "__main__":
    main()
