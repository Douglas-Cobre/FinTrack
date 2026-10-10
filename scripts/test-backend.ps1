Push-Location (Join-Path $PSScriptRoot "..\backend")
try {
    & "$PSScriptRoot\mvn.ps1" test
    $testExit = $LASTEXITCODE
}
finally {
    Pop-Location
}

exit $testExit
