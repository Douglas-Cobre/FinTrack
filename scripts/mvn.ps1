$portableMaven = Join-Path $PSScriptRoot "..\.tools\apache-maven-3.9.16\bin\mvn.cmd"
if (Test-Path -LiteralPath $portableMaven) {
    & $portableMaven @args
} else {
    & mvn.cmd @args
}
exit $LASTEXITCODE
