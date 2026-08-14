. "$PSScriptRoot\resolve-node.ps1"
$projectRoot = Split-Path -Parent $PSScriptRoot
$nodePath = Get-ProjectNode
Push-Location $projectRoot
try {
    & $nodePath --test
} finally {
    Pop-Location
}

