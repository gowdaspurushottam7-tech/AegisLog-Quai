import { ethers } from 'ethers';
import defaultConfig from '../contract_config.json';

export interface ContractConfig {
  address: string;
  abi: any[];
  rpcUrl?: string;
  chainId?: number;
}

const DEFAULT_RPC = 'http://127.0.0.1:8545';

export function getProvider(customRpc?: string) {
  const rpc = customRpc || defaultConfig.rpcUrl || DEFAULT_RPC;
  return new ethers.JsonRpcProvider(rpc);
}

export async function fetchOnChainBatch(
  batchId: number,
  customContractAddress?: string,
  customRpc?: string
): Promise<{
  batchId: number;
  merkleRoot: string;
  vaultRef: string;
  ntpTimestamp: number;
  logCount: number;
  verifiedFromChain: boolean;
}> {
  const address = customContractAddress || defaultConfig.address;
  const abi = defaultConfig.abi;

  if (!address || !abi || abi.length === 0) {
    throw new Error('Contract configuration (address or ABI) not found. Deploy contract first.');
  }

  const provider = getProvider(customRpc);
  const contract = new ethers.Contract(address, abi, provider);

  const batch = await contract.getBatch(batchId);
  return {
    batchId: Number(batch[0]),
    merkleRoot: batch[1],
    vaultRef: batch[2],
    ntpTimestamp: Number(batch[3]),
    logCount: Number(batch[4]),
    verifiedFromChain: true,
  };
}
