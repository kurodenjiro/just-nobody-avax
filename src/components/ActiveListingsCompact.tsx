import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { invoke } from "@tauri-apps/api/core";
import { AssetListingView } from "../types";

interface ActiveListingsCompactProps {
    refreshKey?: number;
}

/** Small always-visible badge showing real on-chain Arsenal listings, mirroring RelayerStatusCompact's pattern. */
export const ActiveListingsCompact: React.FC<ActiveListingsCompactProps> = ({ refreshKey }) => {
    const [showInfo, setShowInfo] = useState(false);
    const [listings, setListings] = useState<AssetListingView[]>([]);

    const load = useCallback(() => {
        invoke<AssetListingView[]>("get_active_asset_listings")
            .then(setListings)
            .catch((e) => console.error("Failed to load listings:", e));
    }, []);

    useEffect(() => {
        load();
        const interval = setInterval(load, 10000);
        return () => clearInterval(interval);
    }, [load, refreshKey]);

    return (
        <div className="relative">
            <button
                onClick={() => setShowInfo(!showInfo)}
                className="h-8 flex items-center gap-2 bg-nobody-charcoal pixel-corners-sm px-3 border border-nobody-gold/20 shadow-card"
            >
                <span className="text-[10px] text-slate-500 font-medium">📦 {listings.length} LISTINGS</span>
            </button>

            <AnimatePresence>
                {showInfo && (
                    <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute top-10 right-0 w-64 pixel-corners-sm bg-nobody-charcoal border border-nobody-gold/30 shadow-card-lg p-3 z-50 text-xs"
                    >
                        {listings.length === 0 ? (
                            <div className="text-slate-500">No active on-chain listings yet. Open Arsenal to create one.</div>
                        ) : (
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {listings.map((l) => (
                                    <div key={l.id} className="flex justify-between gap-2">
                                        <span className="text-slate-700 truncate">🎫 #{l.token_id} {l.description}</span>
                                        <span className="text-nobody-gold font-mono font-semibold shrink-0">{l.price_avax} AVAX</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ActiveListingsCompact;
