import json
import subprocess
from pathlib import Path


EXCEPTION_KEYS_RESTORE_FROM_HEAD = (
    "settings.title.gameplay",
    "credits.stcost",
)


LOADING3_BY_LOCALE = {
    # Keep format consistent with existing strings: "4/4 ... ...‎ "
    "english": "4/4 Linked to: Emporia...‎ ",
    "russian": "4/4 Подключено к: Emporia...‎ ",
    "ukrainian": "4/4 Підключено до: Emporia...‎ ",
    "bulgarian": "4/4 Свързано с: Emporia...‎ ",
    "czech": "4/4 Připojeno k: Emporia...‎ ",
    "danish": "4/4 Forbundet til: Emporia...‎ ",
    "dutch": "4/4 Verbonden met: Emporia...‎ ",
    "finnish": "4/4 Yhdistetty kohteeseen: Emporia...‎ ",
    "french": "4/4 Relié à : Emporia...‎ ",
    "german": "4/4 Verbunden mit: Emporia...‎ ",
    "greek": "4/4 Συνδεδεμένο με: Emporia...‎ ",
    "hungarian": "4/4 Kapcsolódva: Emporia...‎ ",
    "indonesian": "4/4 Terhubung ke: Emporia...‎ ",
    "italian": "4/4 Collegato a: Emporia...‎ ",
    "japanese": "4/4 接続先：Emporia...‎ ",
    "korean": "4/4 연결됨: Emporia...‎ ",
    "norwegian": "4/4 Koblet til: Emporia...‎ ",
    "polish": "4/4 Połączono z: Emporia...‎ ",
    "portuguese-brazil": "4/4 Conectado a: Emporia...‎ ",
    "portuguese-portugal": "4/4 Ligado a: Emporia...‎ ",
    "romanian": "4/4 Conectat la: Emporia...‎ ",
    "spanish-spain": "4/4 Conectado a: Emporia...‎ ",
    "spanish-latin-america": "4/4 Conectado a: Emporia...‎ ",
    "swedish": "4/4 Ansluten till: Emporia...‎ ",
    "thai": "4/4 เชื่อมต่อกับ: Emporia...‎ ",
    "traditional-chinese": "4/4 已連結至：Emporia...‎ ",
    "simplified-chinese": "4/4 已连接至：Emporia...‎ ",
    "turkish": "4/4 Bağlandı: Emporia...‎ ",
    "vietnamese": "4/4 Đã liên kết tới: Emporia...‎ ",
    "arabic": "4/4 مرتبط بـ: Emporia...‎ ",
}


def _git_show_head_json(relative_path: str) -> dict:
    # Use git to read the original file content at HEAD.
    result = subprocess.run(
        ["git", "show", f"HEAD:{relative_path}"],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="strict",
        check=True,
    )
    return json.loads(result.stdout)


def _load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def _save_json(path: Path, data: dict) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> int:
    localization_dir = Path(__file__).resolve().parent.parent / "Localization"
    changed_files = []

    for path in localization_dir.glob("*.json"):
        if path.name in ("languages.json", "_storepage_696396_all.json"):
            continue

        locale = path.stem
        current = _load_json(path)
        original = _git_show_head_json(f"Localization/{path.name}")

        changed = False

        # Restore requested exceptions exactly as in HEAD.
        for key in EXCEPTION_KEYS_RESTORE_FROM_HEAD:
            if key in original and current.get(key) != original.get(key):
                current[key] = original[key]
                changed = True

        # Set new loading3 text.
        if locale in LOADING3_BY_LOCALE:
            new_loading3 = LOADING3_BY_LOCALE[locale]
            if current.get("loading3") != new_loading3:
                current["loading3"] = new_loading3
                changed = True

        if changed:
            _save_json(path, current)
            changed_files.append(path.name)

    print(f"changed {len(changed_files)}")
    for name in changed_files:
        print(name)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

