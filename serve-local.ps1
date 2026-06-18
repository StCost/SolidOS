$port = 8765
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root
Write-Host "Serving Web UI at http://localhost:$port/"
Write-Host "Main Menu: http://localhost:$port/Web%20Main%20Menu/index.html"
Write-Host "Main Menu (folder): http://localhost:$port/Web%20Main%20Menu/"
Write-Host "Trading Terminal: http://localhost:$port/Trading%20Terminal/"
npx --yes serve -l $port .
