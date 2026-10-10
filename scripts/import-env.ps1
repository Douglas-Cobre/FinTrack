param([string]$Path = (Join-Path $PSScriptRoot '..\.env'))
if (Test-Path -LiteralPath $Path) {
    foreach ($line in Get-Content -LiteralPath $Path) {
        if ($line -match '^\s*([A-Z][A-Z0-9_]*)=(.*)$') {
            [Environment]::SetEnvironmentVariable($Matches[1], $Matches[2].Trim().Trim('"').Trim("'"), 'Process')
        }
    }
}
