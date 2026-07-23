import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { invoke } from "@tauri-apps/api/core";
import { formatEther } from "ethers";
import { PixelShieldIcon } from "./icons/PixelIcons";
import { PixelClassIcon } from "./icons/PixelClassIcon";

interface WalletCabinetProps {
    visible: boolean;
    onClose: () => void;
    onOpenConfig: () => void;
    onDelegate: () => void;
    peerCount?: number;
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

export const WalletCabinet: React.FC<WalletCabinetProps> = ({ visible, onClose, onOpenConfig, onDelegate, peerCount = 0 }) => {
    const [bridgeStatus, setBridgeStatus] = useState<string | null>(null);
    const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
    const [identity, setIdentity] = useState<IdentityView | null>(null);
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
        if (!visible) return;
        invoke("get_bridge_status").then((status: any) => setBridgeStatus(status)).catch(console.error);
        fetchIdentity();
        fetchSnapshot();

        // Auto-refresh the balance while the cabinet is open, instead of only on manual click.
        const interval = setInterval(fetchSnapshot, 15000);
        return () => clearInterval(interval);
    }, [visible]);

    const fetchIdentity = async () => {
        try {
            const ids = await invoke<IdentityView[]>("get_identity");
            setIdentity(ids?.[0] || null);
        } catch (e) {
            console.error("Failed to fetch identity", e);
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

    const handleDelegate = async () => {
        // Trigger navigation to DelegationCenter
        onDelegate();
    };

    if (!visible) return null;

    const nativeBalance = snapshot?.assets?.find((a) => a.symbol === "AVAX");
    const balanceText = nativeBalance ? formatEther(nativeBalance.amount) : "0.00";

    return (
        <motion.div
            className="absolute inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="w-[600px] max-h-[85vh] flex flex-col hud-frame border border-nobody-primary/20 bg-nobody-charcoal shadow-card-lg overflow-hidden text-nobody-primary">

                {/* Header */}
                <div className="bg-slate-50 px-5 py-3 border-b border-nobody-primary/20 flex justify-between items-center text-xs">
                    <span className="text-nobody-primary font-pixel text-[10px] tracking-wide">WALLET</span>
                    <div className="flex items-center gap-3">
                        <span className="text-nobody-primary font-medium">
                            {bridgeStatus?.includes("Active") ? "🟢 Agent Access: On" : "⚪ Agent Access: Off"}
                        </span>
                        <button onClick={onOpenConfig} className="text-slate-400 hover:text-slate-700 transition-colors">⚙️</button>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">✕</button>
                    </div>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">

                    {/* Balance — the single most important number, given its own space */}
                    <div className="pixel-corners-sm bg-nobody-primary-soft/30 border border-nobody-primary/20 p-5 text-center">
                        <div className="text-xs text-slate-500 mb-1">🎒 Your Gold</div>
                        <div className="text-3xl font-bold text-nobody-primary">{balanceText} AVAX</div>
                        {identity && (
                            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-mono mt-2">
                                <PixelClassIcon address={identity.address} size={14} />
                                {identity.emoji || "👻"} {identity.address.slice(0, 10)}...{identity.address.slice(-8)}
                            </div>
                        )}
                        <div className="flex justify-center gap-4 mt-3 text-xs">
                            <button onClick={handleSync} disabled={syncing} className="text-nobody-primary hover:underline font-semibold disabled:opacity-50">
                                {syncing ? "Refreshing..." : "🔄 Refresh Balance"}
                            </button>
                        </div>
                    </div>

                    {/* Primary action — one clear, prominent next step */}
                    <button
                        onClick={handleDelegate}
                        className="w-full flex items-center justify-center gap-2 bg-nobody-primary text-nobody-ink font-semibold py-3.5 pixel-corners-sm hover:brightness-125 transition-all hover:scale-[1.01] shadow-card"
                    >
                        <PixelShieldIcon size={16} /> Let My Agent Trade For Me
                    </button>

                    {/* Danger zone — visually separated and de-emphasized so it's never confused with a normal action */}
                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                        <button
                            onClick={handleDelete}
                            className="text-[11px] text-slate-400 hover:text-red-600 transition-colors"
                        >
                            Erase all local data
                        </button>
                    </div>

                </div>

                {/* Footer */}
                <div className="bg-slate-50 border-t border-slate-200 px-5 py-2 flex justify-between items-center text-xs">
                    <span className="text-slate-400">Mesh: {peerCount} peers connected</span>
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
