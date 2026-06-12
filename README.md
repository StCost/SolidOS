# COLLAPSE MACHINE — Web UI

Browser-based menus for the Unity game, loaded from **StreamingAssets** (transparent background for embedding in a WebView / browser overlay).

Standalone repo: [SolidOS](https://github.com/StCost/SolidOS)

Live preview (GitHub Pages): [stcost.github.io/SolidOS](https://stcost.github.io/SolidOS/)

Pushes to `main` run `.github/workflows/deploy-pages.yml` and publish the main menu at the site root. In the repo settings, set **Pages → Build and deployment → Source** to **GitHub Actions** (first deploy only).

## Direction

- **CRT terminal** presentation: IBM 3270 typography, orange phosphor gradients, scanlines, vignette.
- **Industrial hazard** layer: diagonal orange stripes (`hazard-tile.png`) on the frame and scrollbars — subtle, not loud.
- **Fullscreen shell** shared across pages: animated landscape backdrop, masked stripe field, no OS chrome.
- **Unity bridge** via `window` `CustomEvent`s (no backend); HTML/JS owns layout and local UI state only.
- **Single entry file** `index.html` with in-page subpages (menu + connect); no full document navigation.
- **Localization** in `Localization/` (JSON per language); loaded by Unity in-game and by `menu-locale-loader.js` in the browser.
- **Menu audio** in `audio/` (music, hover, click); played by the web page, not FMOD.

Brand color: `#ff8000`. Keep new UI consistent with terminal rows (`term-row`), dim labels, and uppercase labels.

## Layout

```
StreamingAssets/Web UI/
  README.md
  .gitignore
  Localization/           language JSON + languages.json manifest
  audio/                  menu-music.mp3, ui-hover.wav, ui-click.wav
  Web Main Menu/
    index.html
    menu-background.js    non-repeating backdrop rotation (localStorage)
    menu-locale-loader.js fetch locale when not in Unity
    menu-ui-sounds.js     hover/click in browser
    menu-music.js         menu music loop + fade
    backgrounds/          background-01.png … (cycles without repeat)
    screen-shared.css
    …
  Web Loading/
    index.html
    loading.css
```

In-game HUD (hotbar, health, chat) is embedded in `Web Main Menu/index.html` (`menu-game-hud.js`, `menu-game-hud.css`, `menu-game-hud-layer.css`).

## Menu vs game mode

- `#device.menu-mode--menu` (default in browser): full backdrop and menu music.
- `#device.menu-mode--game` (Unity pause menu): transparent backdrop, no menu music.

In the browser (no Unity), window positions and start lists persist in `localStorage` (`cm-menu-window-layouts`, `cm-menu-start-lists`). The connect screen ships default worlds, IP servers, and sample Steam friends for preview.

## Local development

Browsers block `fetch()` on `file://` pages. Serve this folder over HTTP:

- **Windows:** double-click `serve-local.bat` (opens a terminal and starts the server)
- **Git Bash / macOS / Linux:** `./serve-local.sh`
- **PowerShell:** `.\serve-local.ps1`

Then open `http://localhost:8765/Web%20Main%20Menu/index.html`. Locales load from `Localization/*.json` via `fetch`.

GitHub Pages serves the same menu at the repo root (`index.html`); the workflow copies `Web Main Menu/`, `Localization/`, and `audio/` into the published artifact. `menu-audio-paths.js` picks `audio/` vs `../audio/` from the page URL so menu and extras game music work in both layouts.

Requires [Node.js](https://nodejs.org/) (`npx` on PATH).

Menu music and UI sounds need one click/keypress in the page (browser autoplay policy), then hover/click audio works.

Font: `Web Main Menu/fonts/3270-Regular.otf` (IBM 3270, bundled for standalone serve and Unity StreamingAssets).

## Adding UI

1. Add a new `#pageYourId` block in `index.html` (copy `.menu-page` pattern).
2. Add page CSS/JS as needed under `Web Main Menu/`.
3. Register show/hide in `menu-common.js` (`showPage`, status module label if required).
