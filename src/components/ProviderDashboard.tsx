import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { invoke } from "@tauri-apps/api/core";
import { RelayerStatus } from "./RelayerStatus";
import { AssetListingView } from "../types";

interface ProviderDashboardProps {
    visible: boolean;
    onClose: () => void;
    onCreateService: () => void;
    isRelaying: boolean;
    onToggleRelay: (enabled: boolean) => void;
    refreshKey?: number;
    peerCount?: number;
}

export const ProviderDashboard: React.FC<ProviderDashboardProps> = ({ visible, onClose, onCreateService, isRelaying, onToggleRelay, refreshKey, peerCount = 0 }) => {
    const [listings, setListings] = useState<AssetListingView[]>([]);
    const [loadingListings, setLoadingListings] = useState(false);

    const loadListings = useCallback(() => {
        setLoadingListings(true);
        invoke<AssetListingView[]>("get_active_asset_listings")
            .then(setListings)
            .catch((e) => console.error("Failed to load listings:", e))
            .finally(() => setLoadingListings(false));
    }, []);

    useEffect(() => {
        if (visible) {
            loadListings();
        }
    }, [visible, refreshKey, loadListings]);

    if (!visible) return null;

    const listedValue = listings.reduce((sum, l) => sum + (parseFloat(l.price_avax) || 0), 0);

    return (
        <motion.div
            className="absolute inset-0 bg-nobody-dark z-40 text-sm flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Header */}
            <div className="h-14 border-b border-slate-200 flex items-center justify-between px-6 bg-nobody-charcoal">
                <span className="text-nobody-primary font-pixel text-[10px] tracking-wide">ARSENAL MODE: ACTIVE</span>
                <div className="text-nobody-gold font-semibold bg-nobody-gold-soft px-3 py-1 pixel-corners-sm text-xs">
                    🏦 Listed Value: {listedValue.toFixed(4)} AVAX
                </div>
            </div>

            {/* Main Layout */}
            <div className="flex-1 p-6 grid grid-cols-2 gap-6 overflow-y-auto">

                {/* Left Column: Listings */}
                <div className="space-y-6">

                    <DashboardBox title="Active Listings">
                        <div className="space-y-2 pt-2">
                            {loadingListings && listings.length === 0 && (
                                <div className="text-slate-400 text-xs italic">Loading on-chain listings...</div>
                            )}
                            {!loadingListings && listings.length === 0 && (
                                <div className="text-slate-400 text-xs italic">No active listings yet.</div>
                            )}
                            {listings.map((l, i) => (
                                <ListingItem key={l.id} label={`${i + 1}. 🎫 #${l.token_id} — ${l.description}`} price={`${l.price_avax} AVAX`} />
                            ))}

                            <button
                                onClick={onCreateService}
                                className="w-full text-left text-xs text-slate-400 hover:text-slate-900 border border-dashed border-slate-200 hover:border-slate-300 pixel-corners-sm p-2 mt-2 transition-colors"
                            >
                                + Create New Listing
                            </button>
                        </div>
                    </DashboardBox>

                </div>

                {/* Right Column: Relay Mode */}
                <div className="space-y-6">
                    <RelayerStatus
                        isRelaying={isRelaying}
                        onToggle={onToggleRelay}
                        peerCount={peerCount}
                    />
                </div>
            </div>

            {/* Footer Actions */}
            <div className="h-16 border-t border-slate-200 bg-nobody-charcoal flex items-center justify-end px-6">
                <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xs font-semibold border border-slate-200 pixel-corners-sm px-3 py-2 transition-colors">
                    ← Back to Nexus
                </button>
            </div>
        </motion.div>
    );
};

const DashboardBox = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="hud-frame border border-slate-200 bg-nobody-charcoal shadow-card p-4 relative text-nobody-gold">
        <div className="absolute -top-3 left-3 bg-nobody-charcoal px-2 text-slate-400 text-xs font-semibold tracking-wide border border-slate-300 pixel-corners-sm">
            {title}
        </div>
        {children}
    </div>
);

const ListingItem = ({ label, price }: { label: string, price: string }) => (
    <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2 last:border-0">
        <span className="text-slate-900 font-medium">{label}</span>
        <span className="text-nobody-primary font-medium">{price}</span>
    </div>
);
