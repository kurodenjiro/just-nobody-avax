import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { invoke } from "@tauri-apps/api/core";
import { formatEther } from "ethers";

interface WalletCabinetProps {
    visible: boolean;
    onClose: () => void;
    onOpenConfig: () => void;
    onAddNew: () => void;
    onDelegate: () => void;
}

interface CompressedAsset {
    id: string;
    amount: string; // decimal wei string
    symbol: string;
    owner: string;
}

interface Snapshot {
    timestamp: string;
    assets: CompressedAsset[];
    signature: string;
}

interface IdentityView {
    alias: string;
    emoji: string;
    address: string;
}

export const WalletCabinet: React.FC<WalletCabinetProps> = ({ visible, onClose, onOpenConfig, onAddNew, onDelegate }) => {
    const [revealBalance, setRevealBalance] = useState(false);
    const [bridgeStatus, setBridgeStatus] = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState("primary");
    const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
    const [identities, setIdentities] = useState<IdentityView[]>([]); // Array of IdentityView
    const [peerCount, setPeerCount] = useState<number>(0);
    const [syncing, setSyncing] = useState(false);

    const fetchSnapshot = async () => {
        try {
            const data = await invoke<Snapshot>("get_wallet_snapshot");
            if (data && data.assets) {
                setSnapshot(data);
            }
        } catch (e) {
            console.error("Failed to load snapshot", e);
        }
    };

    useEffect(() => {
        if (visible) {
            invoke("get_bridge_status").then((status: any) => setBridgeStatus(status)).catch(console.error);
            invoke("get_active_peers").then((count: any) => setPeerCount(count)).catch(console.error);
            fetchIdentities();
            fetchSnapshot();
        }
    }, [visible]);

    const fetchIdentities = async () => {
        try {
            const ids = await invoke<IdentityView[]>("get_identity");
            setIdentities(ids || []);
        } catch (e) {
            console.error("Failed to fetch identities", e);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            console.log("🔄 Syncing Blockchain state...");
            // Backend ignores the argument now, uses internal identity
            await invoke("sync_blockchain_state", { wallet: "" });

            // Auto-enable Instant Session once synced
            const session = await invoke("enable_instant_session");
            console.log("⚡ Instant Session:", session);

            // Update UI
            const status = await invoke("get_bridge_status");
            setBridgeStatus(status as string);

            // Allow time for FS write then fetch
            setTimeout(fetchSnapshot, 1000);
        } catch (e) {
            console.error("Sync failed:", e);
        } finally {
            setSyncing(false);
        }
    };

    const handleDelete = async () => {
        if (confirm("⚠️ ARE YOU SURE? This will delete the local encrypted snapshot. You will need to sync again.")) {
            try {
                await invoke("delete_wallet_snapshot");
                setSnapshot(null);
                setBridgeStatus(null);
                alert("Local data deleted.");
            } catch (e) {
                console.error("Delete failed:", e);
                alert("Failed to delete local data.");
            }
        }
    };

    const handleShield = () => {
        // Real logic would require a confidential-compute SDK + keys
        // Since we are strictly "No Mock", we indicate the requirement
        alert("🛡️ SHIELDING INITIATED:\n\nRequesting Confidential Compute integration...\n[Pending: Avalanche identity signing support]");
    };

    const handleDelegate = async () => {
        // Trigger navigation to DelegationCenter
        onDelegate();
    };

    if (!visible) return null;

    const nativeBalance = snapshot?.assets?.find((a) => a.symbol === "AVAX");

    return (
        <motion.div
            className="absolute inset-0 z-[60] flex items-center justify-center bg-black/95 font-mono text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="w-[650px] border border-gray-700 bg-nobody-charcoal shadow-2xl relative flex flex-col">

                {/* Header */}
                <div className="bg-gray-900 mx-1 mt-1 p-2 border-b border-gray-700 flex justify-between items-center text-xs tracking-wider">
                    <span className="text-white font-bold">[ 👛 WALLET CABINET ]</span>
                    <span className="text-gray-500">[ 🌐 MESH PEERS: {peerCount} ]</span>
                    <div className="flex items-center gap-3">
                        <span className="text-nobody-mint">[ {bridgeStatus || "Instant Session Engine: Inactive"} ]</span>
                        <button onClick={onOpenConfig} className="text-gray-500 hover:text-white">⚙️</button>
                        <button onClick={onClose} className="text-gray-500 hover:text-white">Esc</button>
                    </div>
                </div>

                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">

                    {/* List of Identities */}
                    <AnimatePresence>
                        {identities.map((id, index) => (
                            <div
                                key={index}
                                className={`p-4 border mb-2 ${selectedId === id.address || (selectedId === 'primary' && index === 0) ? 'border-nobody-mint bg-nobody-mint/5' : 'border-gray-700 hover:bg-gray-800'} transition-all cursor-pointer group`}
                                onClick={() => setSelectedId(id.address)}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${selectedId === id.address || (selectedId === 'primary' && index === 0) ? 'bg-nobody-mint' : 'bg-gray-600'}`} />
                                        <div className="flex flex-col">
                                            <span className="text-white font-bold text-sm group-hover:text-nobody-mint transition-colors tracking-wide">
                                                [ {id.emoji || "👻"} ] {id.alias}
                                            </span>
                                            <span className="text-[10px] text-gray-500 font-mono">
                                                {id.address.slice(0, 10)}...{id.address.slice(-8)}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        {index === 0 && snapshot ? `Last Sync: ${new Date(snapshot.timestamp).toLocaleTimeString()}` : ""}
                                    </span>
                                </div>

                                {index === 0 && ( // Only show details for primary for now
                                    <div className="pl-5 space-y-1 text-xs text-gray-400 mt-2">
                                        <div className="flex justify-between">
                                            <span>- Public AVAX (Gas):</span>
                                            <span className="text-white font-bold">
                                                {nativeBalance ? `${formatEther(nativeBalance.amount)} AVAX` : "0.00 AVAX"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span>- Shielded Assets:</span>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Prevent parent click
                                                        setRevealBalance(!revealBalance);
                                                    }}
                                                    className="text-nobody-mint hover:underline font-bold"
                                                >
                                                    {revealBalance && selectedId === 'primary' ?
                                                        `${snapshot ? snapshot.assets.length : 0} Items`
                                                        : "[👁️ Reveal]"}
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleShield();
                                                    }}
                                                    className="text-gray-500 hover:text-white"
                                                >
                                                    [🛡️ Shield]
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </AnimatePresence>

                    {/* Actions */}
                    <div className="space-y-2">
                        <div className="text-gray-500 text-xs font-bold tracking-widest border-b border-gray-800 pb-2">
                            [ ⚡ ACTIONS ]
                        </div>
                        <div className="flex gap-2">
                            <ActionButton label="➕ GENERATE IDENTITY" onClick={onAddNew} />
                            <ActionButton label={syncing ? "🔄 SYNCING..." : "🔄 SYNC ALL"} onClick={handleSync} />
                            {/* Authority Delegation */}
                            <ActionButton
                                label="🛡️ DELEGATE AUTHORITY"
                                onClick={handleDelegate}
                            />
                            <ActionButton label="🗑️ FULL RESET" danger onClick={handleDelete} />
                        </div>
                    </div>

                    {/* Agent Tip */}
                    <div className="bg-black/40 border-l-2 border-nobody-mint p-3 text-xs italic text-gray-400">
                        <span className="text-nobody-mint font-bold not-italic">{">>"} AGENT:</span> "Ready to trade. Your PeerID is rotating every 24h to keep your wallet address hidden from the Mesh nodes."
                    </div>

                </div>

                {/* Footer */}
                <div className="bg-gray-900 mx-1 mb-1 p-3 border-t border-gray-700 flex justify-center items-center text-xs">
                    <button
                        onClick={onClose}
                        className="bg-transparent text-gray-400 font-bold px-6 py-2 hover:text-white transition-colors uppercase tracking-widest border border-gray-700 hover:border-gray-500"
                    >
                        [ 🔙 BACK ]
                    </button>
                </div>
            </div>
        </motion.div>
    );

};

const ActionButton = ({ label, danger = false, onClick }: { label: string, danger?: boolean, onClick?: () => void }) => (
    <button
        onClick={onClick}
        className={`flex-1 border ${danger ? 'border-red-900/50 text-red-500 hover:bg-red-900/20' : 'border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white'} py-3 font-bold text-xs transition-colors`}
    >
        [ {label} ]
    </button>
);
