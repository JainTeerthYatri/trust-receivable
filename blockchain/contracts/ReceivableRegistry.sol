// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ReceivableRegistry
/// @notice Stores cryptographic proofs and lifecycle state for MSME receivables.
/// Sensitive invoice documents and personal data remain off-chain.
contract ReceivableRegistry {
    enum InvoiceState {
        None,
        Registered,
        Verified,
        Accepted,
        Delivered,
        FinancingRequested,
        Financed,
        Paid,
        Disputed
    }

    struct InvoiceProof {
        bytes32 invoiceHash;
        InvoiceState state;
        address lastActor;
        uint256 registeredAt;
        uint256 updatedAt;
        bool exists;
    }

    address public owner;
    mapping(bytes32 => InvoiceProof) private invoices;
    mapping(bytes32 => bool) public hashRegistered;

    event InvoiceRegistered(bytes32 indexed invoiceId, bytes32 indexed invoiceHash, address indexed registrar, uint256 timestamp);
    event InvoiceVerified(bytes32 indexed invoiceId, address indexed actor, uint256 timestamp);
    event InvoiceAccepted(bytes32 indexed invoiceId, address indexed actor, uint256 timestamp);
    event InvoiceDelivered(bytes32 indexed invoiceId, address indexed actor, uint256 timestamp);
    event FinancingRequested(bytes32 indexed invoiceId, address indexed actor, uint256 timestamp);
    event InvoiceFinanced(bytes32 indexed invoiceId, address indexed actor, uint256 timestamp);
    event InvoicePaid(bytes32 indexed invoiceId, address indexed actor, uint256 timestamp);
    event InvoiceDisputed(bytes32 indexed invoiceId, address indexed actor, uint256 timestamp);

    modifier onlyExisting(bytes32 invoiceId) {
        require(invoices[invoiceId].exists, "Invoice not registered");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function registerInvoice(bytes32 invoiceId, bytes32 invoiceHash) external {
        require(invoiceId != bytes32(0), "Invalid invoice id");
        require(invoiceHash != bytes32(0), "Invalid invoice hash");
        require(!invoices[invoiceId].exists, "Invoice already registered");
        require(!hashRegistered[invoiceHash], "Hash already registered");

        invoices[invoiceId] = InvoiceProof({
            invoiceHash: invoiceHash,
            state: InvoiceState.Registered,
            lastActor: msg.sender,
            registeredAt: block.timestamp,
            updatedAt: block.timestamp,
            exists: true
        });
        hashRegistered[invoiceHash] = true;

        emit InvoiceRegistered(invoiceId, invoiceHash, msg.sender, block.timestamp);
    }

    function verifyInvoice(bytes32 invoiceId) external onlyExisting(invoiceId) {
        _setState(invoiceId, InvoiceState.Verified);
        emit InvoiceVerified(invoiceId, msg.sender, block.timestamp);
    }

    function acceptInvoice(bytes32 invoiceId) external onlyExisting(invoiceId) {
        _setState(invoiceId, InvoiceState.Accepted);
        emit InvoiceAccepted(invoiceId, msg.sender, block.timestamp);
    }

    function markDelivered(bytes32 invoiceId) external onlyExisting(invoiceId) {
        _setState(invoiceId, InvoiceState.Delivered);
        emit InvoiceDelivered(invoiceId, msg.sender, block.timestamp);
    }

    function requestFinancing(bytes32 invoiceId) external onlyExisting(invoiceId) {
        _setState(invoiceId, InvoiceState.FinancingRequested);
        emit FinancingRequested(invoiceId, msg.sender, block.timestamp);
    }

    function markFinanced(bytes32 invoiceId) external onlyExisting(invoiceId) {
        _setState(invoiceId, InvoiceState.Financed);
        emit InvoiceFinanced(invoiceId, msg.sender, block.timestamp);
    }

    function markPaid(bytes32 invoiceId) external onlyExisting(invoiceId) {
        _setState(invoiceId, InvoiceState.Paid);
        emit InvoicePaid(invoiceId, msg.sender, block.timestamp);
    }

    function markDisputed(bytes32 invoiceId) external onlyExisting(invoiceId) {
        _setState(invoiceId, InvoiceState.Disputed);
        emit InvoiceDisputed(invoiceId, msg.sender, block.timestamp);
    }

    function getInvoice(bytes32 invoiceId) external view returns (
        bytes32 invoiceHash,
        InvoiceState state,
        address lastActor,
        uint256 registeredAt,
        uint256 updatedAt,
        bool exists
    ) {
        InvoiceProof storage rec = invoices[invoiceId];
        return (rec.invoiceHash, rec.state, rec.lastActor, rec.registeredAt, rec.updatedAt, rec.exists);
    }

    function _setState(bytes32 invoiceId, InvoiceState newState) internal {
        InvoiceProof storage rec = invoices[invoiceId];
        rec.state = newState;
        rec.lastActor = msg.sender;
        rec.updatedAt = block.timestamp;
    }
}
