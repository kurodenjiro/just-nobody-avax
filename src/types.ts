export interface Peer {
    id: string;
    address: string;
    timestamp: number;
}

export interface ThoughtLog {
    message: string;
    timestamp: number;
    type: "noir" | "confidential-compute" | "private-swap" | "mesh" | "agent";
}

export interface AssetListingView {
    id: number;
    seller: string;
    description: string;
    price_wei: string;
    price_avax: string;
    token_id: number;
}

export interface VoucherView {
    token_id: number;
    voucher_type: string;
    description: string;
    owner: string;
}

export interface MatchResult {
    listing_id: number;
    seller: string;
    description: string;
    price_avax: string;
    price_wei: string;
    token_id: number;
    reason: string;
}

export interface MeshEvent {
    type: string;
    peer_id?: string;
    address?: string;
    intent?: any;
    queue_id?: string;
    raw_tx_hex?: string;
    summary?: string;
    status?: string;
    tx_hash?: string;
}

/** Result of an action that normally hits the chain directly: either it went
 * through immediately, or the RPC was unreachable and it was signed offline
 * and queued for mesh relay instead. */
export type TxResult =
    | { kind: "confirmed"; id: number }
    | { kind: "queued"; queueId: string };

export interface QueuedTx {
    id: string;
    raw_tx_hex: string;
    summary: string;
    created_at: string;
    status: "queued" | "confirmed" | "failed";
    tx_hash: string | null;
}

export type ViewState =
    | "nexus"
    | "config"
    | "provider"
    | "service-creator"
    | "delegation"
    | "wallet-cabinet"
    | "escrow"
    | "redeem"
    | "notification";
