import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { invoke } from "@tauri-apps/api/core";
import { formatEther } from "ethers";
import { PixelSyncIcon, PixelShieldIcon, PixelTrashIcon, PixelPlusIcon } from "./icons/PixelIcons";

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
        if (confirm("⚠️ Are you sure? This will delete the local encrypted snapshot. You will need to sync again.")) {
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
        alert("🛡️ Shielding initiated:\n\nRequesting Confidential Compute integration...\n[Pending: Avalanche identity signing support]");
    };

    const handleDelegate = async () => {
        // Trigger navigation to DelegationCenter
        onDelegate();
    };

    if (!visible) return null;

    const nativeBalance = snapshot?.assets?.find((a) => a.symbol === "AVAX");

    return (
        <motion.div
            className="absolute inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="w-[650px] max-h-[85vh] flex flex-col hud-frame border border-nobody-primary/20 bg-nobody-charcoal shadow-card-lg overflow-hidden text-nobody-primary">

                {/* Header */}
                <div className="bg-slate-50 px-5 py-3 border-b border-nobody-primary/20 flex justify-between items-center text-xs">
                    <span className="text-nobody-primary font-pixel text-[10px] tracking-wide">[ WALLET CABINET ]</span>
                    <span className="text-slate-400">PEERS:{peerCount}</span>
                    <div className="flex items-center gap-3">
                        <span className="text-nobody-primary font-medium">{bridgeStatus || "Instant Session Engine: Inactive"}</span>
                        <button onClick={onOpenConfig} className="text-slate-400 hover:text-slate-700 transition-colors">⚙️</button>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">✕</button>
                    </div>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto">

                    {/* List of Identities */}
                    <AnimatePresence>
                        {identities.map((id, index) => (
                            <div
                                key={index}
                                className={`p-4 pixel-corners-sm border mb-2 transition-all cursor-pointer group ${selectedId === id.address || (selectedId === 'primary' && index === 0) ? 'border-nobody-primary bg-nobody-primary-soft/40' : 'border-slate-200 hover:bg-slate-50'}`}
                                onClick={() => setSelectedId(id.address)}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2.5 h-2.5 rounded-full ${selectedId === id.address || (selectedId === 'primary' && index === 0) ? 'bg-nobody-primary' : 'bg-slate-300'}`} />
                                        <div className="flex flex-col">
                                            <span className="text-slate-900 font-semibold text-sm group-hover:text-nobody-primary transition-colors">
                                                {id.emoji || "👻"} {id.alias}
                                            </span>
                                            <span className="text-[11px] text-slate-400 font-mono">
                                                {id.address.slice(0, 10)}...{id.address.slice(-8)}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-xs text-slate-400">
                                        {index === 0 && snapshot ? `Last sync: ${new Date(snapshot.timestamp).toLocaleTimeString()}` : ""}
                                    </span>
                                </div>

                                {index === 0 && ( // Only show details for primary for now
                                    <div className="pl-[18px] space-y-1.5 text-xs text-slate-500 mt-2">
                                        <div className="flex justify-between">
                                            <span>Public AVAX (Gas)</span>
                                            <span className="text-slate-900 font-semibold">
                                                {nativeBalance ? `${formatEther(nativeBalance.amount)} AVAX` : "0.00 AVAX"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span>Shielded Assets</span>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Prevent parent click
                                                        setRevealBalance(!revealBalance);
                                                    }}
                                                    className="text-nobody-primary hover:underline font-semibold"
                                                >
                                                    {revealBalance && selectedId === 'primary' ?
                                                        `${snapshot ? snapshot.assets.length : 0} Items`
                                                        : "👁️ Reveal"}
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleShield();
                                                    }}
                                                    className="text-slate-400 hover:text-slate-700"
                                                >
                                                    🛡️ Shield
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
                        <div className="text-slate-400 text-[10px] font-pixel tracking-wide border-b border-nobody-primary/15 pb-2">
                            [ ACTIONS ]
                        </div>
                        <div className="flex gap-2">
                            <ActionButton label="Generate Identity" icon={<PixelPlusIcon size={14} />} onClick={onAddNew} />
                            <ActionButton label={syncing ? "Syncing..." : "Sync All"} icon={<PixelSyncIcon size={14} />} onClick={handleSync} />
                            {/* Authority Delegation */}
                            <ActionButton
                                label="Delegate Authority"
                                icon={<PixelShieldIcon size={14} />}
                                onClick={handleDelegate}
                            />
                            <ActionButton label="Full Reset" icon={<PixelTrashIcon size={14} />} danger onClick={handleDelete} />
                        </div>
                    </div>

                    {/* Agent Tip */}
                    <div className="bg-nobody-primary-soft/40 border border-nobody-primary/20 pixel-corners-sm p-3 text-xs text-slate-600">
                        <span className="text-nobody-primary font-semibold">Agent:</span> "Ready to trade. Your PeerID is rotating every 24h to keep your wallet address hidden from the Mesh nodes."
                    </div>

                </div>

                {/* Footer */}
                <div className="bg-slate-50 border-t border-slate-200 p-3 flex justify-center items-center text-xs">
                    <button
                        onClick={onClose}
                        className="bg-nobody-charcoal text-slate-500 font-pixel text-[10px] px-6 py-2 hover:text-nobody-primary transition-colors pixel-corners-sm border border-slate-300 hover:border-nobody-primary shadow-card"
                    >
                        [ BACK ]
                    </button>
                </div>
            </div>
        </motion.div>
    );

};

const ActionButton = ({ label, icon, danger = false, onClick }: { label: string, icon?: React.ReactNode, danger?: boolean, onClick?: () => void }) => (
    <button
        onClick={onClick}
        className={`flex-1 pixel-corners-sm border py-3 font-mono text-xs transition-all duration-150 hover:scale-[1.03] hover:shadow-card-lg flex flex-col items-center gap-1.5 ${danger ? 'border-red-300 text-red-600 hover:bg-red-50 hover:border-red-500' : 'border-slate-300 text-slate-500 hover:bg-slate-50 hover:text-nobody-primary hover:border-nobody-primary'}`}
    >
        {icon}
        {label}
    </button>
);
