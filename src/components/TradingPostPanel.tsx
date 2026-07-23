import React, { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { AssetListingView } from "../types";
import { ItemCard } from "./ItemCard";

interface TradingPostPanelProps {
    refreshKey?: number;
    onOpenArsenal: () => void;
    onCreateListing: () => void;
}

/** Always-visible panel on the Nexus screen showing real on-chain Arsenal
 * listings — no click required to see what's for sale, unlike the old
 * "open Arsenal Mode first" flow. Clicking an item (or the header) still
 * opens the full Arsenal for buying/managing. */
export const TradingPostPanel: React.FC<TradingPostPanelProps> = ({ refreshKey, onOpenArsenal, onCreateListing }) => {
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
        <div className="absolute top-28 left-6 w-72 z-20 hud-frame border border-slate-200 bg-nobody-charcoal shadow-card p-3">
            <button onClick={onOpenArsenal} className="w-full flex items-center justify-between text-left mb-2">
                <span className="text-nobody-gold font-pixel text-[10px] tracking-wide">🗡️ TRADING POST</span>
                <span className="text-slate-400 text-[10px]">Open →</span>
            </button>
            {listings.length === 0 ? (
                <div className="text-slate-400 text-xs italic">No active listings yet.</div>
            ) : (
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                    {listings.slice(0, 5).map((l) => (
                        <ItemCard
                            key={l.id}
                            icon="🎫"
                            title={`#${l.token_id} ${l.description}`}
                            priceAvax={parseFloat(l.price_avax) || 0}
                            onClick={onOpenArsenal}
                        />
                    ))}
                </div>
            )}
            <button
                onClick={onCreateListing}
                className="w-full mt-2 text-left text-xs text-slate-400 hover:text-slate-900 border border-dashed border-slate-200 hover:border-slate-300 pixel-corners-sm p-2 transition-colors"
            >
                + Create New Listing
            </button>
        </div>
    );
};

export default TradingPostPanel;
