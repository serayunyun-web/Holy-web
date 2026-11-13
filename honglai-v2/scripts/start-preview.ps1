$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "[ERROR] Node.js was not found. Install the project Node.js runtime and try again." -ForegroundColor Red
  Read-Host "Press Enter to close"
  exit 1
}
if (-not (Test-Path -LiteralPath "node_modules\next\package.json")) {
  Write-Host "[ERROR] Project dependencies are missing. Run npm install in this folder first." -ForegroundColor Red
  Read-Host "Press Enter to close"
  exit 1
}

$previewUrl = "http://127.0.0.1:3000"
try {
  $existing = Invoke-WebRequest -UseBasicParsing -Uri $previewUrl -TimeoutSec 2
  if ($existing.Content -match "honglai-logo.png") {
    Write-Host "Honglai preview is already running. Opening the browser." -ForegroundColor Green
    Start-Process $previewUrl
    exit 0
  }
  Write-Host "[ERROR] Port 3000 is already used by another site or application." -ForegroundColor Red
  Write-Host "This launcher will not stop the existing process. Close it manually, then try again."
  Read-Host "Press Enter to close"
  exit 1
} catch [System.Net.Http.HttpRequestException] {
  # No service is listening; continue with startup.
} catch [System.Threading.Tasks.TaskCanceledException] {
  Write-Host "[ERROR] The service on port 3000 did not respond. This launcher will not stop it." -ForegroundColor Red
  Read-Host "Press Enter to close"
  exit 1
}

Write-Host "Starting Honglai development preview. Please wait..."
$escapedRoot = $projectRoot.Replace("'", "''")
$command = "Set-Location -LiteralPath '$escapedRoot'; npm run dev -- --hostname 127.0.0.1 --port 3000"
Start-Process -FilePath "powershell.exe" -ArgumentList @("-NoExit", "-NoProfile", "-Command", $command) -WindowStyle Normal

for ($attempt = 1; $attempt -le 45; $attempt++) {
  Start-Sleep -Seconds 1
  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $previewUrl -TimeoutSec 2
    if ($response.Content -match "honglai-logo.png") {
      Write-Host "Preview is ready: $previewUrl" -ForegroundColor Green
      Start-Process $previewUrl
      exit 0
    }
  } catch { }
}

Write-Host "[ERROR] Preview did not start within 45 seconds." -ForegroundColor Red
Write-Host "Check the development preview window for the full error message."
Read-Host "Press Enter to close"
exit 1
