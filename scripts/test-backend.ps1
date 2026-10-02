Push-Location (Join-Path $PSScriptRoot "..\backend")
try {
    & "$PSScriptRoot\mvn.ps1" test
}
finally {
    Pop-Location
}
