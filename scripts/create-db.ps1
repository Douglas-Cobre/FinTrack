$databaseName = "fintrack"

$exists = docker compose exec -T postgres psql -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$databaseName'"

if ($exists.Trim() -eq "1") {
    Write-Host "Database '$databaseName' ja existe."
    exit 0
}

docker compose exec -T postgres createdb -U postgres $databaseName
Write-Host "Database '$databaseName' criado."
