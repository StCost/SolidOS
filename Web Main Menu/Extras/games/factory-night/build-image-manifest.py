"""
Scan assets/safe and assets/monster, write assets/image-manifest.json.
Run after adding or moving PNGs: python build-image-manifest.py
"""

from __future__ import annotations

import json
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ASSETS_DIR = os.path.join(SCRIPT_DIR, "assets")
SAFE_DIR = os.path.join(ASSETS_DIR, "safe")
MONSTER_DIR = os.path.join(ASSETS_DIR, "monster")
MANIFEST_PATH = os.path.join(ASSETS_DIR, "image-manifest.json")


def list_pngs(folder: str) -> list[str]:
    if not os.path.isdir(folder):
        return []
    names = []
    for name in os.listdir(folder):
        if name.lower().endswith(".png"):
            names.append(name)
    names.sort()
    return names


def main() -> None:
    os.makedirs(SAFE_DIR, exist_ok=True)
    os.makedirs(MONSTER_DIR, exist_ok=True)
    manifest = {
        "safe": list_pngs(SAFE_DIR),
        "monster": list_pngs(MONSTER_DIR),
    }
    with open(MANIFEST_PATH, "w", encoding="utf-8") as handle:
        json.dump(manifest, handle, indent=2)
        handle.write("\n")
    print("Wrote", MANIFEST_PATH)
    print("  safe:", len(manifest["safe"]))
    print("  monster:", len(manifest["monster"]))


if __name__ == "__main__":
    main()
