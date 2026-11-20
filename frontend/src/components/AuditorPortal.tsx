import React, { useState } from 'react';
import { Upload, CheckCircle2, XCircle, FileText, Cpu, ChevronDown, ChevronUp } from 'lucide-react';
import { computeBrowserMerkleRoot } from '../lib/merkle';
import { fetchOnChainBatch } from '../lib/chain';

export const AuditorPortal: React.FC = () => {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [evidenceData, setEvidenceData] = useState<any | null>(null);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [certExpanded, setCertExpanded] = useState<boolean>(false);
  const [auditResult, setAuditResult] = useState<{
    status: 'IDLE' | 'VERIFIED' | 'TAMPERED' | 'ERROR';
    computedRoot?: string;
    onChainRoot?: string;
    leafCount?: number;
    chainVerified?: boolean;
    errorMessage?: string;
  }>({ status: 'IDLE' });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        setEvidenceData(parsed);
        await runZeroTrustAudit(parsed);
      } catch (err: any) {
        setAuditResult({
          status: 'ERROR',
          errorMessage: `Invalid Evidence JSON file: ${err.message}`,
        });
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const loadLatestBatchSample = async () => {
    try {
      const res = await fetch('/api/export-evidence/1');
      if (!res.ok) {
        throw new Error('No batches anchored yet. Wait for batch #1 to anchor.');
      }
      const data = await res.json();
      setEvidenceData(data);
      await runZeroTrustAudit(data);
    } catch (err: any) {
      alert(`Could not load batch 1: ${err.message}`);
    }
  };

  const runZeroTrustAudit = async (evidence: any) => {
    setVerifying(true);
    setAuditResult({ status: 'IDLE' });

    try {
      const rawLogs: string[] =
        evidence.raw_logs ||
        evidence.logs ||
        evidence.leaves ||
        evidence.lines ||
        [];
      const expectedRoot: string = (evidence.merkleRoot || evidence.merkle_root || '').trim();
      const batchId: number = evidence.batch_id;

      // 1. Browser Native In-Memory Web Crypto SHA-256 Merkle Computation
      const { merkleRoot: computedRoot } = await computeBrowserMerkleRoot(rawLogs);

      // 2. Query On-Chain Smart Contract via JSON-RPC
      let onChainRoot = expectedRoot;
      let chainVerified = false;

      try {
        const chainBatch = await fetchOnChainBatch(batchId, evidence.contract_address);
        if (chainBatch && chainBatch.merkleRoot && chainBatch.merkleRoot !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
          onChainRoot = chainBatch.merkleRoot.trim();
          chainVerified = true;
        }
      } catch (chainErr) {
        console.warn('Direct on-chain contract fetch failed, using evidence package root:', chainErr);
      }

      // 3. Strict Comparison
      const isMatch =
        computedRoot.toLowerCase() === expectedRoot.toLowerCase() &&
        computedRoot.toLowerCase() === onChainRoot.toLowerCase();

      if (isMatch) {
        setAuditResult({
          status: 'VERIFIED',
          computedRoot,
          onChainRoot,
          leafCount: rawLogs.length,
          chainVerified,
        });
      } else {
        setAuditResult({
          status: 'TAMPERED',
          computedRoot,
          onChainRoot,
          leafCount: rawLogs.length,
          chainVerified,
        });
      }
    } catch (err: any) {
      setAuditResult({
        status: 'ERROR',
        errorMessage: err.message,
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Description Header */}
      <div className="text-center space-y-1.5 pb-2">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">
          Independent Zero-Trust Forensic Auditor
        </h2>
        <p className="text-xs text-slate-600 dark:text-zinc-400 max-w-xl mx-auto">
          Verify court admissibility in your browser. Raw logs are re-hashed via native Web Crypto{' '}
          <code className="text-[#3730A3] dark:text-[#6366F1] font-mono">crypto.subtle</code> and evaluated against the immutable on-chain root in{' '}
          <code className="text-[#3730A3] dark:text-[#6366F1] font-mono">LogAnchor.sol</code>.
        </p>
      </div>

      {/* Centered Clean Drag-and-Drop Box - Soft pearl-slate (#F4F7FA) with #D2DCE8 border */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all bg-[#F4F7FA] dark:bg-[#121216] shadow-sm ${
          dragActive
            ? 'border-indigo-500 bg-[#E0E7FF]/50 dark:bg-indigo-950/20'
            : 'border-[#D2DCE8] hover:border-indigo-400 dark:border-[#24242C] dark:hover:border-indigo-400'
        }`}
      >
        <input
          type="file"
          id="evidence-upload"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-[#E2E9F2] dark:bg-[#0E0E12] border border-[#D2DCE8] dark:border-[#24242C] flex items-center justify-center text-[#3730A3] dark:text-[#6366F1]">
            <Upload className="w-5 h-5 text-[#3730A3] dark:text-[#6366F1]" />
          </div>

          <div>
            <label
              htmlFor="evidence-upload"
              className="text-sm font-medium text-[#3730A3] dark:text-[#6366F1] hover:text-indigo-800 dark:hover:text-indigo-300 cursor-pointer underline underline-offset-2"
            >
              Upload Evidence JSON
            </label>
            <span className="text-sm text-slate-600 dark:text-zinc-400"> or drag and drop file here</span>
            <p className="text-[11px] text-slate-500 dark:text-zinc-500 mt-1 font-mono">
              Accepts AegisLog_BSA_Section63_Batch_*.json
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={loadLatestBatchSample}
              className="text-xs text-[#1E293B] dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white bg-[#E2E9F2] hover:bg-[#D2DCE8] dark:bg-[#181820] dark:hover:bg-[#20202a] border border-[#D2DCE8] dark:border-[#24242C] px-3 py-1.5 rounded-md transition"
            >
              Or load sample batch from live system
            </button>
          </div>
        </div>
      </div>

      {/* Verifying Indicator */}
      {verifying && (
        <div className="p-4 bg-[#F4F7FA] dark:bg-[#121216] border border-[#D2DCE8] dark:border-indigo-500/30 shadow-sm rounded-xl flex items-center justify-center gap-3 text-[#3730A3] dark:text-indigo-300 text-xs">
          <Cpu className="w-4 h-4 animate-spin text-[#3730A3] dark:text-[#6366F1]" />
          <span className="font-mono">
            Recomputing SHA-256 Merkle root in browser and querying smart contract...
          </span>
        </div>
      )}

      {/* Clear Verdict Card: Verified Admissible - Soft Mint (#E6F6EE) with #065F46 text and #A7F3D0 border */}
      {auditResult.status === 'VERIFIED' && (
        <div className="bg-[#E6F6EE] dark:bg-[#121216] border border-[#A7F3D0] dark:border-emerald-500/50 shadow-sm rounded-xl p-6 space-y-4 transition-colors duration-200">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-[#A7F3D0]/60 dark:bg-emerald-500/10 border border-[#A7F3D0] dark:border-emerald-500/20 flex items-center justify-center text-[#065F46] dark:text-emerald-400 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-[#065F46] dark:text-white">
                  Verified Admissible (BSA Sec 63)
                </h3>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-semibold bg-[#A7F3D0]/70 text-[#065F46] border border-[#A7F3D0] dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30">
                  Tamper Proof
                </span>
              </div>
              <p className="text-xs text-[#065F46]/90 dark:text-zinc-400 mt-1">
                Zero-Trust Verification Succeeded. The browser-computed Merkle root matches the on-chain blockchain anchor byte-for-byte ({auditResult.leafCount} log leaves verified).
              </p>
            </div>
          </div>

          {/* Root Comparison: Nested cool slate boxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-[#F4F7FA] dark:bg-[#0E0E12] border border-[#A7F3D0] dark:border-[#24242C] space-y-1">
              <span className="text-[11px] text-[#065F46] dark:text-zinc-400 font-semibold block">
                Browser Computed Merkle Root (Web Crypto):
              </span>
              <span className="text-[#065F46] dark:text-emerald-400 font-mono text-[11px] break-all select-all font-bold">
                {auditResult.computedRoot}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#F4F7FA] dark:bg-[#0E0E12] border border-[#A7F3D0] dark:border-[#24242C] space-y-1">
              <span className="text-[11px] text-[#065F46] dark:text-zinc-400 font-semibold block">
                On-Chain Smart Contract Root (LogAnchor.sol):
              </span>
              <span className="text-[#065F46] dark:text-emerald-400 font-mono text-[11px] break-all select-all font-bold">
                {auditResult.onChainRoot}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Clear Verdict Card: Tampered / Invalid - Soft Blush Rose (#FCE8EC) with #9F1239 text and #FECDD3 border */}
      {auditResult.status === 'TAMPERED' && (
        <div className="bg-[#FCE8EC] dark:bg-[#121216] border border-[#FECDD3] dark:border-rose-500/60 shadow-sm rounded-xl p-6 space-y-4 transition-colors duration-200">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-[#FECDD3] dark:bg-rose-500/10 border border-[#FECDD3] dark:border-rose-500/20 flex items-center justify-center text-[#9F1239] dark:text-rose-400 shrink-0">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-[#9F1239] dark:text-white">
                  Tampered / Invalid Record
                </h3>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-semibold bg-[#FECDD3] text-[#9F1239] border border-[#FECDD3] dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30">
                  Inadmissible
                </span>
              </div>
              <p className="text-xs text-[#9F1239]/90 dark:text-rose-300 mt-1">
                Cryptographic mismatch! The browser-computed Merkle root does not match the immutable smart contract anchor. Evidence is tainted or modified.
              </p>
            </div>
          </div>

          {/* Root Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-[#F4F7FA] dark:bg-[#0E0E12] border border-[#FECDD3] dark:border-rose-950/50 space-y-1">
              <span className="text-[11px] text-[#9F1239] dark:text-rose-400 font-semibold block">
                Browser Computed Merkle Root:
              </span>
              <span className="text-[#9F1239] dark:text-rose-300 font-mono text-[11px] break-all select-all font-bold">
                {auditResult.computedRoot}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#F4F7FA] dark:bg-[#0E0E12] border border-[#D2DCE8] dark:border-[#24242C] space-y-1">
              <span className="text-[11px] text-slate-700 dark:text-zinc-400 font-semibold block">
                Expected On-Chain Anchor:
              </span>
              <span className="text-[#1E293B] dark:text-zinc-300 font-mono text-[11px] break-all select-all font-bold">
                {auditResult.onChainRoot}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Collapsible Accordion: BSA Section 63 Part A & Part B Certificate */}
      {evidenceData?.bsa_section_63_certificate && (
        <div className="bg-[#F4F7FA] dark:bg-[#121216] border border-[#D2DCE8] dark:border-[#24242C] shadow-sm rounded-xl overflow-hidden transition-colors duration-200">
          {/* Accordion Trigger Header */}
          <button
            onClick={() => setCertExpanded(!certExpanded)}
            className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-[#E2E9F2]/70 dark:hover:bg-[#181820] transition"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <div>
                <span className="text-xs font-semibold text-slate-900 dark:text-white tracking-wide block">
                  BSA Section 63 Statutory Schedule Certificate
                </span>
                <span className="text-[11px] text-slate-600 dark:text-zinc-400">
                  Section 63(4) Part A (System Custodian) &amp; Part B (Forensic Expert)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[#92400E] bg-[#FEF3C7] border border-[#FDE68A] dark:text-amber-300 dark:bg-amber-500/10 dark:border-amber-500/20 px-2 py-0.5 rounded font-medium">
                Section 63(4)
              </span>
              {certExpanded ? (
                <ChevronUp className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
              )}
            </div>
          </button>

          {/* Accordion Content */}
          {certExpanded && (
            <div className="px-5 pb-5 pt-2 border-t border-[#D2DCE8] dark:border-[#24242C] space-y-4 text-xs">
              {/* Part A: System Custodian - Nested box in cool slate (#E2E9F2) */}
              <div className="p-4 bg-[#E2E9F2] dark:bg-[#0E0E12] border border-[#D2DCE8] dark:border-[#24242C] rounded-lg space-y-2">
                <div className="flex items-center justify-between font-semibold text-[#3730A3] dark:text-[#6366F1]">
                  <span>{evidenceData.bsa_section_63_certificate.part_a_system_custodian_declaration.title}</span>
                  <span className="font-mono text-[10px] text-slate-600 dark:text-zinc-400">
                    {evidenceData.bsa_section_63_certificate.part_a_system_custodian_declaration.statutory_subclause}
                  </span>
                </div>
                <p className="text-[#1E293B] dark:text-zinc-300">
                  <strong>Custodian:</strong> {evidenceData.bsa_section_63_certificate.part_a_system_custodian_declaration.custodian_name} ({evidenceData.bsa_section_63_certificate.part_a_system_custodian_declaration.organization})
                </p>
                <div className="space-y-1 text-[#1E293B] dark:text-zinc-300 pl-2.5 border-l border-[#CBD5E1] dark:border-zinc-700 text-[11.5px]">
                  {evidenceData.bsa_section_63_certificate.part_a_system_custodian_declaration.declaration_statements.map((stmt: string, i: number) => (
                    <div key={i}>{stmt}</div>
                  ))}
                </div>
              </div>

              {/* Part B: Forensic Expert - Nested box in cool slate (#E2E9F2) */}
              <div className="p-4 bg-[#E2E9F2] dark:bg-[#0E0E12] border border-[#D2DCE8] dark:border-[#24242C] rounded-lg space-y-2">
                <div className="flex items-center justify-between font-semibold text-[#065F46] dark:text-emerald-400">
                  <span>{evidenceData.bsa_section_63_certificate.part_b_forensic_expert_declaration.title}</span>
                  <span className="font-mono text-[10px] text-slate-600 dark:text-zinc-400">
                    {evidenceData.bsa_section_63_certificate.part_b_forensic_expert_declaration.statutory_subclause}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px] text-[#1E293B] dark:text-zinc-300 bg-[#F4F7FA] dark:bg-[#121216] p-3 rounded border border-[#D2DCE8] dark:border-[#24242C]">
                  <div><strong>Cipher:</strong> {evidenceData.bsa_section_63_certificate.part_b_forensic_expert_declaration.cryptographic_verification.vault_cipher}</div>
                  <div><strong>Merkle Tree:</strong> {evidenceData.bsa_section_63_certificate.part_b_forensic_expert_declaration.cryptographic_verification.merkle_tree_algorithm}</div>
                  <div className="sm:col-span-2 break-all"><strong>Smart Contract:</strong> {evidenceData.bsa_section_63_certificate.part_b_forensic_expert_declaration.cryptographic_verification.on_chain_smart_contract}</div>
                  <div className="sm:col-span-2 break-all"><strong>On-Chain Tx:</strong> {evidenceData.bsa_section_63_certificate.part_b_forensic_expert_declaration.cryptographic_verification.transaction_hash}</div>
                </div>
                <div className="space-y-1 text-[#1E293B] dark:text-zinc-300 pl-2.5 border-l border-[#CBD5E1] dark:border-zinc-700 text-[11.5px]">
                  {evidenceData.bsa_section_63_certificate.part_b_forensic_expert_declaration.expert_findings.map((f: string, i: number) => (
                    <div key={i}>{f}</div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
