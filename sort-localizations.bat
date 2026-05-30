@echo off
setlocal EnableExtensions
cd /d "%~dp0"

set "ROOT=%CD%"
set "TMPPY=%TEMP%\cm-sort-localizations-%RANDOM%.py"

if exist "%TMPPY%" del "%TMPPY%" >nul 2>&1

> "%TMPPY%" (
  echo import json, glob, os
  echo base = os.path.join(r'%ROOT%', 'Localization'^)
  echo if not os.path.isdir(base^):
  echo     raise SystemExit('Localization folder not found: ' + base^)
  echo count = 0
  echo for path in sorted(glob.glob(os.path.join(base, '*.json'^)^)^):
  echo     name = os.path.basename(path^)
  echo     if name == 'languages.json':
  echo         continue
  echo     with open(path, 'r', encoding='utf-8'^) as handle:
  echo         data = json.load(handle^)
  echo     if not isinstance(data, dict^):
  echo         continue
  echo     sorted_data = dict(sorted(data.items(^), key=lambda item: item[0]^)^)
  echo     with open(path, 'w', encoding='utf-8', newline='\n'^) as handle:
  echo         json.dump(sorted_data, handle, ensure_ascii=False, indent=2^)
  echo         handle.write('\n'^)
  echo     print('sorted', name^)
  echo     count += 1
  echo print('Done. Sorted', count, 'files.'^)
)

where py >nul 2>&1
if %ERRORLEVEL%==0 (
  py -3 "%TMPPY%"
  set "ERR=%ERRORLEVEL%"
  goto cleanup
)

where python >nul 2>&1
if %ERRORLEVEL%==0 (
  python "%TMPPY%"
  set "ERR=%ERRORLEVEL%"
  goto cleanup
)

echo [sort-localizations] Python 3 not found on PATH.
set "ERR=1"

:cleanup
if exist "%TMPPY%" del "%TMPPY%" >nul 2>&1
exit /b %ERR%
