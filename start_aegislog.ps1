<#
.SYNOPSIS
AegisLog Complete System Orchestrator (Windows PowerShell)

.DESCRIPTION
Starts all 4 services in dedicated windows:
1. Hardhat Local EVM Node (8545) + Deploys LogAnchor.sol
2. Mock Security Log Server (Appends logs every 2s)
3. Cryptographic Log Agent (Batches & Anchors every 10s)
4. FastAPI Forensic Engine (Port 8000)
5. React SOC Command Dashboard (Port 5173)
#>

$root = "c:\aegislog"
Set-Location $root

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "🛡️  AegisLog Zero-Trust Cryptographic Logging System" -ForegroundColor Green
Write-Host "    CERT-In Compliant · BSA Section 63 Admissible" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Start Hardhat Node
Write-Host "`n[1/5] Launching Hardhat local EVM node (port 8545)..." -ForegroundColor Magenta
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\contracts'; npx.cmd hardhat node"

Start-Sleep -Seconds 4

# 2. Deploy LogAnchor Smart Contract
Write-Host "[2/5] Deploying LogAnchor.sol smart contract to local node..." -ForegroundColor Magenta
Set-Location "$root\contracts"
& npx.cmd hardhat run scripts/deploy.js --network localhost

# 3. Start Mock Log Server
Write-Host "`n[3/5] Starting enterprise security log generator (mock_server.py)..." -ForegroundColor Magenta
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\agent'; python mock_server.py"

# 4. Start Cryptographic Log Agent
Write-Host "[4/5] Starting cryptographic log agent & anchorer (agent.py)..." -ForegroundColor Magenta
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\agent'; python agent.py"

# 5. Start FastAPI Backend
Write-Host "[5/5] Launching FastAPI verification engine (port 8000)..." -ForegroundColor Magenta
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; python -m uvicorn main:app --reload --port 8000"

# 6. Start React Frontend Dashboard
Write-Host "`n[+] Starting React SOC Dashboard (port 5173)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm.cmd run dev"

Write-Host "`n✅ All AegisLog modules initiated successfully!" -ForegroundColor Green
Write-Host "🌐 Frontend SOC Dashboard : http://localhost:5173" -ForegroundColor White
Write-Host "⚡ FastAPI Backend Engine : http://localhost:8000" -ForegroundColor White
Write-Host "⛓️  Hardhat RPC Endpoint   : http://localhost:8545" -ForegroundColor White
Write-Host "📖 Interactive API Docs   : http://localhost:8000/docs`n" -ForegroundColor White
