function Get-ProjectNode {
    $command = Get-Command node -ErrorAction SilentlyContinue
    if ($command) {
        return $command.Source
    }

    $bundled = 'C:\Users\m08ra\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
    if (Test-Path -LiteralPath $bundled) {
        return $bundled
    }

    throw 'Node.js 20以上が必要です。Node.jsをインストールするか、Codex Desktopから実行してください。'
}

