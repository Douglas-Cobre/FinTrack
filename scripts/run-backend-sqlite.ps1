$projectRoot = Split-Path -Parent $PSScriptRoot
$databaseDirectory = Join-Path $projectRoot "backend\data"
New-Item -ItemType Directory -Force -Path $databaseDirectory | Out-Null

$env:SPRING_PROFILES_ACTIVE = "sqlite"
if (-not $env:FINTRACK_DB_FILE) {
    $env:FINTRACK_DB_FILE = Join-Path $databaseDirectory "fintrack.db"
}

Push-Location (Join-Path $projectRoot "backend")
try {
    & "$PSScriptRoot\mvn.ps1" spring-boot:run
    $backendExit = $LASTEXITCODE
}
finally {
    Pop-Location
}
exit $backendExit
