import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { invoke } from "@tauri-apps/api/core";
import { RelayerStatus } from "./RelayerStatus";
import { DealView } from "../types";

interface ProviderDashboardProps {
    visible: boolean;
    onClose: () => void;
    isRelaying: boolean;
    onToggleRelay: (enabled: boolean) => void;
    refreshKey?: number;
    peerCount?: number;
}

export const ProviderDashboard: React.FC<ProviderDashboardProps> = ({ visible, onClose, isRelaying, onToggleRelay, refreshKey, peerCount = 0 }) => {
    const [deals, setDeals] = useState<DealView[]>([]);
    const [loadingDeals, setLoadingDeals] = useState(false);
    const [selectedDealId, setSelectedDealId] = useState<string>("");

    const loadDeals = useCallback(async () => {
        setLoadingDeals(true);
        try {
            const identities = await invoke<{ address: string }[]>("get_identity");
            const address = identities[0]?.address;
            if (address) {
                const myDeals = await invoke<DealView[]>("get_my_deals", { address });
                setDeals(myDeals);
            }
        } catch (e) {
            console.error("Failed to load deals:", e);
        } finally {
            setLoadingDeals(false);
        }
    }, []);

    useEffect(() => {
        if (visible) {
            loadDeals();
        }
    }, [visible, refreshKey, loadDeals]);

    if (!visible) return null;

    const selectedDeal = deals.find((d) => String(d.deal_id) === selectedDealId) ?? null;
    const activeDealCount = deals.filter((d) => d.status === "active").length;

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
                <div className="flex gap-3">
                    {activeDealCount > 0 && (
                        <div className="text-nobody-primary font-semibold bg-nobody-primary-soft px-3 py-1 pixel-corners-sm text-xs animate-pulse">
                            ⚔️ {activeDealCount} quest{activeDealCount > 1 ? "s" : ""} in progress
                        </div>
                    )}
                </div>
            </div>

            {/* Main Layout */}
            <div className="flex-1 p-6 grid grid-cols-2 gap-6 overflow-y-auto">

                {/* Left Column: Deals */}
                <div className="space-y-6">

                    <DashboardBox title="📜 Quest Log">
                        <div className="space-y-3 pt-2">
                            {loadingDeals && deals.length === 0 && (
                                <div className="text-slate-400 text-xs italic">Checking on-chain deals...</div>
                            )}
                            {!loadingDeals && deals.length === 0 && (
                                <div className="text-slate-400 text-xs italic">No deals yet — matched buys/sells will show up here.</div>
                            )}
                            {deals.length > 0 && (
                                <select
                                    value={selectedDealId}
                                    onChange={(e) => setSelectedDealId(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 pixel-corners-sm p-2 text-sm text-slate-900 outline-none focus:border-nobody-primary"
                                >
                                    <option value="">Select a deal to view...</option>
                                    {deals.map((d) => (
                                        <option key={d.deal_id} value={d.deal_id}>
                                            {statusIcon(d.status)} Deal #{d.deal_id} — 🎫 #{d.token_id} — {d.amount_avax} AVAX ({d.role})
                                        </option>
                                    ))}
                                </select>
                            )}

                            {selectedDeal && (
                                <div className="bg-slate-50 pixel-corners-sm p-3 border border-slate-200 text-xs space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Signal</span>
                                        <span className={`font-semibold ${selectedDeal.status === "active" ? "text-nobody-primary animate-pulse" : selectedDeal.status === "released" ? "text-nobody-primary" : "text-slate-400"}`}>
                                            {statusIcon(selectedDeal.status)} {statusLabel(selectedDeal.status)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between"><span className="text-slate-500">Your role</span><span className="text-slate-900">{selectedDeal.role}</span></div>
                                    <div className="flex justify-between"><span className="text-slate-500">Counterparty</span><span className="text-slate-900 font-mono">{(selectedDeal.role === "seller" ? selectedDeal.buyer : selectedDeal.seller).slice(0, 8)}...</span></div>
                                    <div className="flex justify-between"><span className="text-slate-500">Amount</span><span className="text-nobody-primary font-semibold">{selectedDeal.amount_avax} AVAX</span></div>
                                </div>
                            )}
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

function statusIcon(status: DealView["status"]) {
    if (status === "active") return "⚔️";
    if (status === "released") return "✅";
    if (status === "refunded") return "↩️";
    return "•";
}

function statusLabel(status: DealView["status"]) {
    if (status === "active") return "Quest in progress — funds locked, awaiting release";
    if (status === "released") return "Released — complete";
    if (status === "refunded") return "Refunded";
    return "Unknown";
}

const DashboardBox = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="hud-frame border border-slate-200 bg-nobody-charcoal shadow-card p-4 relative text-nobody-gold">
        <div className="absolute -top-3 left-3 bg-nobody-charcoal px-2 text-slate-400 text-xs font-semibold tracking-wide border border-slate-300 pixel-corners-sm">
            {title}
        </div>
        {children}
    </div>
);
