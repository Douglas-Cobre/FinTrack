& "$PSScriptRoot\start-db.ps1"

$setupScript = Join-Path $PSScriptRoot "..\database\setup.sql"
Get-Content $setupScript | docker compose exec -T postgres psql -U postgres -d fintrack

Write-Host "Banco 'fintrack' configurado com sucesso."
