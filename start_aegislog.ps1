$ErrorActionPreference = "Stop"

# Use the folder containing this script
$root = $PSScriptRoot
$python = Join-Path $root ".venv\Scripts\python.exe"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "       AegisLog Security Logging System" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan

# Check required files
$required = @(
    ".venv\Scripts\python.exe",
    "agent\mock_server.py",
    "agent\agent.py",
    "backend\main.py",
    "frontend\package.json",
    "contracts\package.json"
)

foreach ($file in $required) {
    if (!(Test-Path (Join-Path $root $file))) {
        Write-Host "Missing required file: $file" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`nAll required files found." -ForegroundColor Green

# 1. Start Hardhat node
Write-Host "`n[1/5] Starting Hardhat blockchain node..." -ForegroundColor Magenta

Start-Process powershell.exe -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location -LiteralPath '$root\contracts'; npx.cmd hardhat node"
)

# Wait for Hardhat RPC
Write-Host "Waiting for blockchain node..." -ForegroundColor Yellow

$ready = $false

for ($i = 0; $i -lt 30; $i++) {
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $client.Connect("127.0.0.1", 8545)
        $client.Close()
        $ready = $true
        break
    }
    catch {
        Start-Sleep -Seconds 1
    }
}

if (!$ready) {
    Write-Host "Hardhat node did not start. Check its window." -ForegroundColor Red
    exit 1
}

# 2. Deploy smart contract
Write-Host "`n[2/5] Deploying LogAnchor smart contract..." -ForegroundColor Magenta

Push-Location "$root\contracts"

try {
    & npx.cmd hardhat run scripts/deploy.js --network localhost

    if ($LASTEXITCODE -ne 0) {
        throw "Smart contract deployment failed."
    }
}
finally {
    Pop-Location
}

# 3. Start mock log server
Write-Host "`n[3/5] Starting mock security log server..." -ForegroundColor Magenta

Start-Process powershell.exe -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location -LiteralPath '$root\agent'; & '$python' mock_server.py"
)

# 4. Start cryptographic agent
Write-Host "`n[4/5] Starting cryptographic log agent..." -ForegroundColor Magenta

Start-Process powershell.exe -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location -LiteralPath '$root\agent'; & '$python' agent.py"
)

# 5. Start FastAPI backend
Write-Host "`n[5/5] Starting FastAPI backend..." -ForegroundColor Magenta

Start-Process powershell.exe -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location -LiteralPath '$root\backend'; & '$python' -m uvicorn main:app --reload --port 8000"
)

# Start React frontend
Write-Host "`nStarting React frontend..." -ForegroundColor Green

Start-Process powershell.exe -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location -LiteralPath '$root\frontend'; npm.cmd run dev"
)

Write-Host "`n============================================" -ForegroundColor Green
Write-Host "AegisLog startup commands initiated." -ForegroundColor Green
Write-Host "Frontend:  http://localhost:5173" -ForegroundColor White
Write-Host "Backend:   http://localhost:8000" -ForegroundColor White
Write-Host "API Docs:  http://localhost:8000/docs" -ForegroundColor White
Write-Host "Hardhat:   http://localhost:8545" -ForegroundColor White
Write-Host "============================================" -ForegroundColor Cyan
