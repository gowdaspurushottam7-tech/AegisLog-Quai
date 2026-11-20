// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title LogAnchor
 * @notice Zero-trust, tamper-evident cryptographic log anchoring system
 *         designed for CERT-In compliance and BSA Section 63 admissibility.
 */
contract LogAnchor {
    struct BatchAnchor {
        uint256 batchId;
        bytes32 merkleRoot;
        string vaultRef;
        uint256 ntpTimestamp;
        uint256 logCount;
    }

    uint256 public batchCounter;
    mapping(uint256 => BatchAnchor) public batches;

    event BatchAnchored(
        uint256 indexed batchId,
        bytes32 merkleRoot,
        string vaultRef,
        uint256 ntpTimestamp,
        uint256 logCount
    );

    /**
     * @notice Anchor a batch of security logs to the blockchain
     * @param _merkleRoot SHA-256 Merkle root of the log batch
     * @param _vaultRef Reference identifier or path in the isolated vault (e.g. "vault/batch_1.enc")
     * @param _ntpTimestamp NTP-synchronized timestamp (Unix seconds or milliseconds)
     * @param _logCount Number of log records included in this batch
     */
    function anchorBatch(
        bytes32 _merkleRoot,
        string calldata _vaultRef,
        uint256 _ntpTimestamp,
        uint256 _logCount
    ) external returns (uint256) {
        batchCounter++;
        uint256 currentBatchId = batchCounter;

        batches[currentBatchId] = BatchAnchor({
            batchId: currentBatchId,
            merkleRoot: _merkleRoot,
            vaultRef: _vaultRef,
            ntpTimestamp: _ntpTimestamp,
            logCount: _logCount
        });

        emit BatchAnchored(
            currentBatchId,
            _merkleRoot,
            _vaultRef,
            _ntpTimestamp,
            _logCount
        );

        return currentBatchId;
    }

    /**
     * @notice Retrieve an anchor record by batchId
     * @param _batchId The ID of the batch to retrieve
     */
    function getBatch(uint256 _batchId) external view returns (BatchAnchor memory) {
        require(_batchId > 0 && _batchId <= batchCounter, "LogAnchor: Batch does not exist");
        return batches[_batchId];
    }

    /**
     * @notice Retrieve the latest anchored batch
     */
    function getLatestBatch() external view returns (BatchAnchor memory) {
        require(batchCounter > 0, "LogAnchor: No batches anchored yet");
        return batches[batchCounter];
    }

    /**
     * @notice Get all batches up to a given count or total
     */
    function getTotalBatches() external view returns (uint256) {
        return batchCounter;
    }
}
