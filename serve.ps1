$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
Write-Host "NTE Russian Voice Watch: http://localhost:8080" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop." -ForegroundColor DarkGray
python -m http.server 8080
