import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { invoke } from "@tauri-apps/api/core";
import { formatEther } from "ethers";

interface CompressedAsset {
    id: string;
    amount: string;
    symbol: string;
    owner: string;
}

interface Snapshot {
    timestamp: string;
    assets: CompressedAsset[];
    signature: string;
}

/** Small always-visible AVAX balance badge, sourced from the same wallet snapshot WalletCabinet uses. */
export const WalletBalanceCompact: React.FC = () => {
    const [showInfo, setShowInfo] = useState(false);
    const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

    const load = useCallback(() => {
        invoke<Snapshot>("get_wallet_snapshot")
            .then((data) => data?.assets && setSnapshot(data))
            .catch((e) => console.error("Failed to load wallet snapshot:", e));
    }, []);

    useEffect(() => {
        load();
        const interval = setInterval(load, 15000);
        return () => clearInterval(interval);
    }, [load]);

    const nativeBalance = snapshot?.assets?.find((a) => a.symbol === "AVAX");
    const balanceText = nativeBalance ? formatEther(nativeBalance.amount) : "0.00";

    return (
        <div className="relative">
            <button
                onClick={() => setShowInfo(!showInfo)}
                className="h-8 flex items-center gap-2 bg-nobody-charcoal pixel-corners-sm px-3 border border-nobody-primary/20 shadow-card"
            >
                <span className="text-[10px] text-slate-500 font-medium">💰 {balanceText} AVAX</span>
            </button>

            <AnimatePresence>
                {showInfo && (
                    <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute top-10 right-0 w-56 pixel-corners-sm bg-nobody-charcoal border border-nobody-primary/30 shadow-card-lg p-3 z-50 text-xs"
                    >
                        <div className="text-slate-500">
                            Real on-chain balance for your primary identity on Avalanche Fuji. Open Wallet for full detail and other identities.
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default WalletBalanceCompact;
