docker compose up -d postgres
docker compose ps postgres
& "$PSScriptRoot\create-db.ps1"
