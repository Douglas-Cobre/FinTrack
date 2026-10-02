Push-Location (Join-Path $PSScriptRoot "..\backend")
try {
    & "$PSScriptRoot\mvn.ps1" spring-boot:run
}
finally {
    Pop-Location
}
