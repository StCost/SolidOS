Factory Night camera images
===========================

Folders
  assets/safe/     — normal feeds (not reportable)
  assets/monster/  — anomalies (valid REPORT)

Filename must start with cam01- … cam06- for camera feeds.

After adding or moving PNGs, rebuild the manifest:
  python build-image-manifest.py

Feed images are JPEG (max 800x600, aspect preserved). To batch-convert PNGs:
  python resize-assets-to-jpg.py
  python build-image-manifest.py

The game loads assets/image-manifest.json at runtime.
Move files between safe/ and monster/ to change report behavior — no code edits needed.

UI-only images stay in assets/ root (office-booth.jpg, door-*.jpg).
