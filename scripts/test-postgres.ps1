$ErrorActionPreference = 'Stop'
& "$PSScriptRoot/import-env.ps1"
$projectDir = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$pgBin = $env:PG_BIN
if (!$pgBin) {
    foreach ($version in @(18, 17, 16)) {
        $candidate = "C:/Program Files/PostgreSQL/$version/bin"
        if (Test-Path -LiteralPath "$candidate/psql.exe") { $pgBin = $candidate; break }
    }
}
if (!$pgBin) { throw 'Configure PG_BIN com a pasta bin do PostgreSQL (16 ou superior).' }
$connection = [Uri]($env:DB_URL -replace '^jdbc:', '')
$pgHost = if ($connection.Host) { $connection.Host } else { 'localhost' }
$pgPort = if ($connection.Port -gt 0) { $connection.Port } else { 5432 }
$pgUser = if ($env:DB_USERNAME) { $env:DB_USERNAME } else { 'postgres' }
$saved = @{}
foreach ($key in @('PGPASSWORD', 'PG_TEST_URL', 'PG_TEST_USERNAME', 'PG_TEST_PASSWORD')) {
    $saved[$key] = [Environment]::GetEnvironmentVariable($key, 'Process')
}
$env:PGPASSWORD = $env:DB_PASSWORD
$suffix = [Guid]::NewGuid().ToString('N')
$testDb = "fintrack_test_$suffix"
$restoreDb = "fintrack_restore_$suffix"
$dump = Join-Path $projectDir "backend/target/$testDb.dump"
$created = @()
function Invoke-Pg([string]$program, [string[]]$arguments) {
    & "$pgBin/$program.exe" --host=$pgHost --port=$pgPort --username=$pgUser @arguments
    if ($LASTEXITCODE -ne 0) { throw "$program falhou (codigo $LASTEXITCODE)." }
}
try {
    Invoke-Pg 'createdb' @($testDb)
    $created += $testDb
    $env:PG_TEST_URL = "jdbc:postgresql://${pgHost}:${pgPort}/$testDb"
    $env:PG_TEST_USERNAME = $pgUser
    $env:PG_TEST_PASSWORD = $env:DB_PASSWORD
    Write-Host 'Validando migracoes, regras e concorrencia em banco PostgreSQL temporario.'
    Push-Location (Join-Path $projectDir 'backend')
    try {
        & "$PSScriptRoot/mvn.ps1" -B -Ppostgres verify
        if ($LASTEXITCODE -ne 0) { throw 'A validacao PostgreSQL falhou.' }
    } finally { Pop-Location }
    Invoke-Pg 'pg_dump' @('--format=custom', '--no-owner', "--file=$dump", $testDb)
    Invoke-Pg 'createdb' @($restoreDb)
    $created += $restoreDb
    Invoke-Pg 'pg_restore' @('--no-owner', '--no-privileges', '--exit-on-error', "--dbname=$restoreDb", $dump)
    $query = 'SELECT (SELECT count(*) FROM efetivacao.flyway_schema_history WHERE success AND version IS NOT NULL) + (SELECT count(*) FROM concorrencia.flyway_schema_history WHERE success AND version IS NOT NULL), (SELECT count(*) FROM concorrencia.movimentacoes);'
    $result = & "$pgBin/psql.exe" --host=$pgHost --port=$pgPort --username=$pgUser --dbname=$restoreDb --tuples-only --no-align --set=ON_ERROR_STOP=1 --command=$query
    if ($LASTEXITCODE -ne 0 -or $result.Trim() -ne '10|2') { throw 'O backup restaurado nao corresponde aos dados esperados (10 migracoes, 2 movimentos).' }
    Write-Host 'PostgreSQL e restauracao do backup validados.'
} finally {
    foreach ($database in $created) {
        if ($database -notmatch '^fintrack_(test|restore)_[a-f0-9]{32}$') { throw 'Nome de banco temporario invalido.' }
        Invoke-Pg 'dropdb' @('--force', $database)
    }
    foreach ($key in $saved.Keys) { [Environment]::SetEnvironmentVariable($key, $saved[$key], 'Process') }
}
