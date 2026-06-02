"""
Move existing flat assets/*.png into assets/safe or assets/monster, then rebuild manifest.
Run once: python migrate-assets-to-folders.py
"""

from __future__ import annotations

import json
import os
import re
import shutil

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ASSETS_DIR = os.path.join(SCRIPT_DIR, "assets")
SAFE_DIR = os.path.join(ASSETS_DIR, "safe")
MONSTER_DIR = os.path.join(ASSETS_DIR, "monster")
JS_PATH = os.path.join(SCRIPT_DIR, "factory-night.js")

KEEP_IN_ROOT = {
    "office-booth.png",
    "door-clean.png",
    "door-threat.png",
}


def load_monster_names_from_js() -> set[str]:
    with open(JS_PATH, encoding="utf-8") as handle:
        text = handle.read()
    names: set[str] = set()
    for match in re.finditer(
        r'\{\s*name:\s*"([^"]+\.png)"\s*,\s*isMonster:\s*true\s*\}',
        text,
    ):
        names.add(match.group(1))
    return names


def main() -> None:
    os.makedirs(SAFE_DIR, exist_ok=True)
    os.makedirs(MONSTER_DIR, exist_ok=True)
    monster_names = load_monster_names_from_js()
    moved = 0
    for name in os.listdir(ASSETS_DIR):
        if not name.lower().endswith(".png"):
            continue
        if name in KEEP_IN_ROOT:
            continue
        source = os.path.join(ASSETS_DIR, name)
        if not os.path.isfile(source):
            continue
        if name in monster_names or name == "jumpscare.png" or name.startswith("screamer-"):
            target_dir = MONSTER_DIR
        else:
            target_dir = SAFE_DIR
        target = os.path.join(target_dir, name)
        if os.path.abspath(source) == os.path.abspath(target):
            continue
        if os.path.exists(target):
            os.remove(source)
            continue
        shutil.move(source, target)
        moved += 1
        print("->", os.path.basename(target_dir) + "/", name)
    safe = sorted(
        n for n in os.listdir(SAFE_DIR) if n.lower().endswith(".png")
    )
    monster = sorted(
        n for n in os.listdir(MONSTER_DIR) if n.lower().endswith(".png")
    )
    manifest = {"safe": safe, "monster": monster}
    manifest_path = os.path.join(ASSETS_DIR, "image-manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as handle:
        json.dump(manifest, handle, indent=2)
        handle.write("\n")
    print("Moved", moved, "files. Manifest:", len(safe), "safe,", len(monster), "monster")


if __name__ == "__main__":
    main()
