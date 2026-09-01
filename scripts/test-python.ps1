$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$toolRoot = Join-Path $projectRoot '.tools'
$downloadRoot = Join-Path $toolRoot 'downloads'
$uvRoot = Join-Path $toolRoot 'uv-0.12.6'
$uvPath = Join-Path $uvRoot 'uv.exe'
$archivePath = Join-Path $downloadRoot 'uv-x86_64-pc-windows-msvc-0.12.6.zip'
$archiveUrl = 'https://github.com/astral-sh/uv/releases/download/0.12.6/uv-x86_64-pc-windows-msvc.zip'
$archiveSha256 = 'DF7CB9F243EAE1621400D4FCF5B1B3D90F20E264ECE91B64DEB3B0078ABCA6EF'
$pythonVersion = '3.13.15'
$venvRoot = Join-Path $toolRoot 'python-test-venv'
$pythonPath = Join-Path $venvRoot 'Scripts\python.exe'

function Invoke-Checked {
  param([scriptblock]$Command)

  & $Command
  if ($LASTEXITCODE -ne 0) {
    throw "Managed Python command failed with exit code $LASTEXITCODE"
  }
}

New-Item -ItemType Directory -Force -Path $downloadRoot | Out-Null
if (-not (Test-Path -LiteralPath $uvPath)) {
  Invoke-WebRequest -Uri $archiveUrl -OutFile $archivePath
  $actualHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $archivePath).Hash
  if ($actualHash -ne $archiveSha256) {
    throw "Pinned uv archive hash mismatch: expected $archiveSha256, received $actualHash"
  }
  Expand-Archive -LiteralPath $archivePath -DestinationPath $uvRoot -Force
}

$env:UV_PYTHON_INSTALL_DIR = Join-Path $toolRoot 'python'
$env:UV_CACHE_DIR = Join-Path $toolRoot 'uv-cache'
Invoke-Checked { & $uvPath python install $pythonVersion }
if (-not (Test-Path -LiteralPath $pythonPath)) {
  Invoke-Checked { & $uvPath venv --python $pythonVersion $venvRoot }
}
Invoke-Checked { & $uvPath pip sync --python $pythonPath --require-hashes (Join-Path $projectRoot 'requirements.lock') }
Invoke-Checked { & $pythonPath -m pytest }
