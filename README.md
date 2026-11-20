# AegisLog: Zero-Trust Cryptographic Logging & Forensic Recovery System

> **Statutory Compliance**: CERT-In 2022 Directions (Section 70B, Rule 4 & 5)  
> **Evidentiary Standard**: Bharatiya Sakshya Adhiniyam, 2023 (BSA Section 63 / 63(4) Schedule Certificate)  
> **Security Architecture**: Continuous Hash-Chaining $\rightarrow$ SHA-256 Merkle Tree $\rightarrow$ AES-256-GCM Vault $\rightarrow$ On-Chain EVM Smart Contract Anchor

---

## 🏛️ Legal & Regulatory Foundation

### 1. Bharatiya Sakshya Adhiniyam, 2023 (BSA Section 63)
The Bharatiya Sakshya Adhiniyam, 2023 replaced the Indian Evidence Act, 1872. Section 63 governs the **admissibility of electronic records** (formerly Section 65B of IEA).
- **Section 63(4) Schedule Certificate**: Every log batch anchored in AegisLog is packaged with a pre-filled, cryptographically verified Schedule Certificate containing:
  - **Part A (System Custodian Declaration)**: Statement by the lawful custodian certifying uninterrupted normal system operation and custody.
  - **Part B (Forensic Expert Declaration)**: Statement by the technical examiner certifying SHA-256 Merkle root verification against the immutable distributed ledger (`LogAnchor.sol`) and cryptographic integrity.

### 2. CERT-In Cybersecurity Directions (2022)
- **Rule 4 (180-Day Log Retention)**: Mandates secure, tamper-evident retention of enterprise security logs within Indian jurisdiction. AegisLog stores encrypted logs in an isolated vault with automatic retention tracking.
- **Rule 5 (6-Hour Mandatory Reporting)**: Mandates notification of cybersecurity incidents to CERT-In within 6 hours. AegisLog's **Incident Reporting Countdown Timer** automatically begins a `06:00:00` countdown the second tampering or an agent termination is detected.
- **NTP Synchronization**: Logs are synchronized against NTP servers with sub-second UTC and IST timestamps.

---

## 🏗️ Monorepo Architecture

```
aegislog/
├── contracts/          # Hardhat + LogAnchor.sol + deploy script
├── agent/              # mock_server.py + agent.py (Merkle + AES-256 + Web3)
├── backend/            # FastAPI server (Forensics + Recovery + Red Team + BSA Export)
├── frontend/           # React + Vite + Tailwind (SOC Dashboard + Auditor Portal)
├── data/               # Live server.log (target of simulated attacks)
├── vault/              # Isolated AES-256 encrypted off-chain backup batches
└── shared/             # Auto-generated contract_config.json (address + ABI)
```

---

## ⚡ Quick Start Guide (Step-by-Step)

### Terminal 1: Start Hardhat Node
```powershell
cd c:\aegislog\contracts
npx hardhat node
```
*Node will start listening on `http://127.0.0.1:8545` (Chain ID 31337).*

### Terminal 2: Deploy LogAnchor Smart Contract
```powershell
cd c:\aegislog\contracts
npx hardhat run scripts/deploy.js --network localhost
```
*Writes contract address and ABI to `shared/contract_config.json`.*

### Terminal 3: Start Enterprise Mock Log Generator
```powershell
cd c:\aegislog\agent
python mock_server.py
```
*Generates SSH_LOGIN, SUDO_EXEC, DB_ACCESS, FIREWALL_DROP logs every 2 seconds.*

### Terminal 4: Start Cryptographic Log Agent
```powershell
cd c:\aegislog\agent
python agent.py
```
*Computes hash chain, batches logs every 10s, encrypts via AES-256-GCM, and anchors to blockchain.*

### Terminal 5: Start FastAPI Backend Engine
```powershell
cd c:\aegislog\backend
uvicorn main:app --reload --port 8000
```
*Starts API on `http://127.0.0.1:8000` with Swagger docs at `http://127.0.0.1:8000/docs`.*

### Terminal 6: Start React SOC Dashboard
```powershell
cd c:\aegislog\frontend
npm run dev
```
*Open `http://localhost:5173` in your browser.*

---

## 🎯 Red Team Attack Simulation & Verification Walkthrough

1. **Simulate Log Edit (Covert Tampering)**
   - Click **`1. Simulate Log Edit`** on the SOC Dashboard.
   - Attacker secretly alters `FAILED_ROOT_LOGIN` to `SSH_LOGIN SUCCESS` in `data/server.log`.
   - **Result**: The dashboard immediately flashes RED. Pinpoint Forensics identifies the exact line number, shows the altered string side-by-side with the original, and triggers the CERT-In 6-hour incident countdown timer.

2. **Simulate `rm -rf` Wipe**
   - Click **`2. Simulate rm -rf Wipe`**.
   - Empties `data/server.log` (0 bytes).
   - **Result**: Alarm sounds. Click **`1-Click Recover Erased Logs`** to instantly restore every erased record from the AES-256-GCM encrypted vault.

3. **Kill Logging Agent (Dead Man's Switch)**
   - Click **`3. Kill Logging Agent`**.
   - Agent heartbeat is halted.
   - **Result**: Watchtower Dead Man's Switch trips after 15 seconds, alerting: `AGENT_KILLED_ALERT = TRUE` with the exact kill timestamp.

4. **Zero-Trust Independent Auditor Verification (Tab 2)**
   - Click **`Export BSA Sec 63 Bundle`** in Tab 1 to download the court evidence JSON.
   - Switch to **Tab 2: Independent Auditor Portal**.
   - Drag and drop the downloaded JSON file into the auditor portal.
   - **Result**: The browser uses native `crypto.subtle` Web Crypto to independently re-hash every log line and check the Merkle Root against the on-chain smart contract, displaying **`VERIFIED ADMISSIBLE (BSA SEC 63)`**.
