# AegisLog: Zero-Trust Cryptographic Logging & Forensic Recovery System

> **Hackathon Track**: Track 02 — B3: Logs the attacker can't erase  
> **Statutory Compliance**: CERT-In 2022 Mandate (Section 70B, Rule 4 & 5)  
> **Court Admissibility**: Bharatiya Sakshya Adhiniyam, 2023 (BSA Section 63 / 63(4) Schedule Certificate)  
> **Core Pipeline**: Continuous Hash-Chaining $\rightarrow$ SHA-256 Merkle Batching $\rightarrow$ AES-256-GCM Vault $\rightarrow$ On-Chain EVM Smart Contract Anchor

---

## 🏛️ The 4-Pillar Security Architecture

```
                    ┌────────────────────────────┐
                    │   data/server.log Stream   │
                    └─────────────┬──────────────┘
                                  │
                                  ▼
               ┌──────────────────────────────────────┐
               │  Continuous Hash Chaining (SHA-256)  │
               │      H_n = SHA256(Line + H_{n-1})    │
               └──────────────────┬───────────────────┘
                                  │ Every 10s Batch
                                  ▼
    ┌─────────────────────────────┴─────────────────────────────┐
    │                                                           │
    ▼                                                           ▼
┌───────────────────────────┐               ┌───────────────────────────────────────┐
│  Pillar 1: Merkle Root    │               │  Pillar 2: AES-256-GCM Vault          │
│  Binary SHA-256 Tree      │               │  128-bit AEAD Encrypted Backup        │
│  Anchored on LogAnchor.sol│               │  vault/batch_<id>.enc                 │
└─────────────┬─────────────┘               └───────────────────┬───────────────────┘
              │                                                 │
              └───────────────────────┬─────────────────────────┘
                                      ▼
                      ┌───────────────────────────────┐
                      │  Pillar 3: Watchtower Switch  │
                      │  Dead Man's Switch (15s TTL)  │
                      │  Catches Agent Process Kills  │
                      └───────────────┬───────────────┘
                                      │
                                      ▼
                      ┌───────────────────────────────┐
                      │  Pillar 4: CERT-In & BSA Sec63│
                      │  - 06:00:00 Incident Timer    │
                      │  - 180-Day Retention Tracking │
                      │  - Schedule 63(4) Part A & B  │
                      │  - In-Browser WebCrypto Audit │
                      └───────────────────────────────┘
```

### 1. Pillar 1: Merkle Batching & On-Chain Anchoring
- Incoming security logs are continuously chained: $H_n = \text{SHA256}(\text{log}_n + H_{n-1})$.
- Every 10 seconds, the agent builds a binary SHA-256 Merkle tree from raw lines and commits the `merkleRoot`, `vaultRef`, `ntpTimestamp`, and `logCount` to `LogAnchor.sol` on the Ethereum/EVM local ledger (Chain ID 31337).

### 2. Pillar 2: AES-256-GCM Off-Chain Vault & Forensic Recovery
- Each batch of logs is encrypted using authenticated AES-256-GCM (12-byte nonce, 16-byte AEAD tag) and stored in an isolated directory (`vault/batch_<id>.enc`).
- If an attacker tampers with or wipes `data/server.log` (`rm -rf /var/log/*`), AegisLog performs pinpoint line-by-line diffs against the vault and provides a 1-click cryptographic recovery that completely restores the original files.

### 3. Pillar 3: Watchtower Dead Man's Switch
- The backend Watchtower monitors the logging agent's heartbeat.
- If an attacker kills or suspends the agent (`kill -9` or SIGSTOP), the Dead Man's Switch trips within 15 seconds, setting `AGENT_KILLED_ALERT = True` with the exact microsecond timestamp of the attack.

### 4. Pillar 4: CERT-In Compliance & BSA Section 63 Independent Auditor
- **CERT-In 2022 Mandate**:
  - **Rule 4 (180-Day Log Retention)**: Live retention counter tracking stored batches and logs under Indian jurisdiction.
  - **Rule 5 (6-Hour Incident Reporting)**: A live countdown timer (`06:00:00`) starts immediately upon detecting tampering or an agent kill.
  - **NTP Time Synchronization**: Dual live timestamps (UTC & IST) synced with NTP time servers.
- **Bharatiya Sakshya Adhiniyam, 2023 (BSA Section 63)**:
  - Generates downloadable, court-admissible forensic packages with pre-filled Section 63(4) statutory schedule certificates (Part A for the system custodian and Part B for the forensic expert).
  - Includes a zero-trust browser auditor portal (Tab 2) that independently computes SHA-256 Merkle roots using native `crypto.subtle` and validates them against the smart contract without trusting the backend.

---

## 📁 Monorepo Structure

```
aegislog/
├── contracts/          # Hardhat + LogAnchor.sol + deploy scripts + unit tests
├── agent/              # mock_server.py (generator) + agent.py (Merkle + AES-256 + JSON-RPC)
├── backend/            # FastAPI (Forensics + Watchtower + Red Team + BSA Export)
├── frontend/           # React + Vite + Tailwind (Linear-style SOC & Auditor Portal)
├── data/               # Live server.log (target of simulated attacks)
├── vault/              # Isolated AES-256 encrypted off-chain backup batches
└── shared/             # contract_config.json (address + ABI) & crypto_engine.py
```

---

## ⚡ Quick Start Guide (Run All 4 Modules)

### Prerequisites
- Node.js 18+ & npm
- Python 3.10+
- PowerShell or Bash

---

### Terminal 1: Smart Contract Node (Hardhat)
```powershell
cd c:\aegislog\contracts
npm install
npx hardhat node
```
*Local EVM node starts at `http://127.0.0.1:8545` (Chain ID 31337).*

---

### Terminal 2: Deploy LogAnchor Contract
```powershell
cd c:\aegislog\contracts
npx hardhat run scripts/deploy.js --network localhost
```
*Deploys `LogAnchor.sol` and writes deployed address & ABI to `shared/contract_config.json`.*

---

### Terminal 3: Mock Log Stream Generator
```powershell
cd c:\aegislog\agent
python mock_server.py
```
*Appends realistic Linux security logs (`SSH_LOGIN`, `SUDO_EXEC`, `DB_ACCESS`, `FIREWALL_DROP`) to `data/server.log` every 2s.*

---

### Terminal 4: Cryptographic Log Agent
```powershell
cd c:\aegislog\agent
python agent.py
```
*Chains logs, generates AES-256-GCM vault backups, and anchors Merkle roots on-chain every 10s.*

---

### Terminal 5: FastAPI Verification & Forensics Engine
```powershell
cd c:\aegislog\backend
uvicorn main:app --reload --port 8000
```
*Engine runs at `http://127.0.0.1:8000`. Swagger API docs available at `http://127.0.0.1:8000/docs`.*

---

### Terminal 6: React SOC Dashboard & Auditor Portal
```powershell
cd c:\aegislog\frontend
npm install
npm run dev
```
*Open `http://localhost:5173` in your browser.*

---

## 🎯 Red Team Attack Simulation & Admissibility Demo

1. **Simulate Log Edit (Covert Tampering)**
   - Click **`Edit 1 Line`** in the *Live Attack Simulator* bar on the dashboard.
   - An attacker covertly alters `FAILED_ROOT_LOGIN` to `USER_LOGIN` in `data/server.log`.
   - **Result**: The dashboard flags a **Tamper Alert**. The Progressive Disclosure Hero Card expands to show the pinpoint line-by-line diff between the tampered disk file and the blockchain-proven vault original, and starts the **CERT-In 06:00:00 countdown**.

2. **Simulate `rm -rf` Log Wipe**
   - Click **`Wipe File`**.
   - Empties `data/server.log` (0 bytes).
   - **Result**: Immediate tamper alert. Click **`Recover Logs`** to restore all erased records from the AES-256-GCM vault.

3. **Kill Logging Agent (Dead Man's Switch)**
   - Click **`Kill Agent`**.
   - Agent heartbeat is halted.
   - **Result**: Watchtower Dead Man's Switch trips in 15 seconds: `AGENT_KILLED_ALERT = TRUE` with the microsecond timestamp. Click **`Resume Heartbeat`** to clear.

4. **Zero-Trust Independent Auditor Verification (Tab 2)**
   - In Tab 1, click **`Export BSA Sec 63 Proof`** to download the court-ready evidence JSON.
   - Switch to **Tab 2: Auditor Verify**.
   - Drag and drop the downloaded JSON file into the portal (or click *Load sample batch*).
   - **Result**: The browser uses native `crypto.subtle` Web Crypto to independently re-hash every log line and verify the Merkle root directly against `LogAnchor.sol` on-chain, displaying **`VERIFIED ADMISSIBLE (BSA SEC 63)`** alongside the collapsible statutory certificate.

5. **Reset Demo for Judges**
   - Click the subtle **`Reset Demo`** button in the header at any time to instantly restore logs from vault, reset alerts, and return to a 100% clean green state.
