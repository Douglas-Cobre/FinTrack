& "$PSScriptRoot\import-env.ps1"
Push-Location (Join-Path $PSScriptRoot "..\backend")
try {
    & "$PSScriptRoot\mvn.ps1" spring-boot:run
    $backendExit = $LASTEXITCODE
}
finally {
    Pop-Location
}
exit $backendExit
