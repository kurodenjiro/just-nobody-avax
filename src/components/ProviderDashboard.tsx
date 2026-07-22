import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RelayerStatus } from "./RelayerStatus";

interface ProviderDashboardProps {
    visible: boolean;
    onClose: () => void;
    onCreateService: () => void;
}

export const ProviderDashboard: React.FC<ProviderDashboardProps> = ({ visible, onClose, onCreateService }) => {
    const [isRelaying, setIsRelaying] = useState(false);

    const [logs] = useState<string[]>([]);

    useEffect(() => {
        // Real logs handled elsewhere
    }, [visible]);

    if (!visible) return null;

    return (
        <motion.div
            className="absolute inset-0 bg-nobody-dark z-40 text-sm flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Header */}
            <div className="h-14 border-b border-slate-200 flex items-center justify-between px-6 bg-nobody-charcoal">
                <div className="flex items-center gap-4">
                    <span className="text-nobody-primary font-pixel text-[10px] tracking-wide">[ MERCHANT MODE: ACTIVE ]</span>
                    <span className="text-slate-400 text-xs">ID: Nobody_99</span>
                </div>
                <div className="text-nobody-gold font-semibold bg-nobody-gold-soft px-3 py-1 pixel-corners-sm text-xs">
                    🏦 Liquidity: 500 AVAX
                </div>
            </div>

            {/* Main Layout */}
            <div className="flex-1 p-6 grid grid-cols-2 gap-6 overflow-y-auto">

                {/* Left Column: Listings & Strategy */}
                <div className="space-y-6">

                    <DashboardBox title="Active Listings">
                        <div className="space-y-2 pt-2">
                            <ListingItem label="1. 📦 120x ESP32" price="$9.5" />
                            <ListingItem label="2. 🎨 Fox Trait NFT" price="15 AVAX" />
                            <ListingItem label="3. ⚡ bandwidth_relay" price="0.1/kb" />

                            <button
                                onClick={onCreateService}
                                className="w-full text-left text-xs text-slate-400 hover:text-slate-900 border border-dashed border-slate-200 hover:border-slate-300 pixel-corners-sm p-2 mt-2 transition-colors"
                            >
                                + Create New Listing
                            </button>
                        </div>
                    </DashboardBox>

                    {/* Relayer Mode Status */}
                    <RelayerStatus
                        isRelaying={isRelaying}
                        onToggle={setIsRelaying}
                    />

                    <DashboardBox title="🧠 Merchant Agent Strategy">
                        <div className="space-y-2 pt-2 text-xs text-slate-500">
                            <div>Strategy: <span className="text-slate-900 font-medium">"Steady Profit"</span> <span className="text-slate-400">(Min Margin: 10%)</span></div>
                            <div>Auto-Accept: <span className="text-nobody-primary font-medium">If Bid {'>'} $9.3</span></div>
                            <div>Settlement: <span className="text-nobody-gold font-medium">Private Swap (Avalanche Fuji)</span></div>
                        </div>
                    </DashboardBox>

                </div>

                {/* Right Column: Incoming Bids & Log */}
                <div className="space-y-6">

                    <DashboardBox title="🛰️ Incoming Agent Bids">
                        <div className="bg-slate-50 pixel-corners-sm border border-slate-100 p-2 space-y-1">
                            <BidRow user="Nobody_42a8" bid="$9.1" type="shark" />
                            <BidRow user="Nobody_11x9" bid="$9.4" type="user" />
                            <BidRow user="Nobody_zero" bid="$9.0" type="shark" />
                        </div>
                    </DashboardBox>

                    <DashboardBox title="🦈 Live Negotiation Log">
                        <div className="text-xs space-y-2 h-40 overflow-y-auto font-mono">
                            {logs.map((log, i) => (
                                <div key={i} className={`${log.includes('ALERT') ? 'text-nobody-primary bg-nobody-primary-soft pixel-corners-sm p-2 animate-pulse' : 'text-slate-500'}`}>
                                    {log}
                                </div>
                            ))}
                        </div>
                    </DashboardBox>

                </div>
            </div>

            {/* Footer Actions */}
            <div className="h-16 border-t border-slate-200 bg-nobody-charcoal flex items-center justify-between px-6">
                <div className="flex gap-3">
                    <button className="bg-nobody-primary text-nobody-ink font-semibold px-4 py-2 pixel-corners-sm hover:brightness-125 transition-colors text-xs">
                        Accept & Release
                    </button>
                    <button className="bg-slate-100 text-slate-700 font-semibold px-4 py-2 pixel-corners-sm hover:bg-slate-200 transition-colors text-xs">
                        Counter Offer
                    </button>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xs font-semibold border border-slate-200 pixel-corners-sm px-3 py-2 transition-colors">
                    📊 Sales Stats
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

const BidRow = ({ user, bid, type }: { user: string, bid: string, type: 'shark' | 'user' }) => (
    <div className="flex justify-between items-center text-xs p-1.5 hover:bg-nobody-charcoal pixel-corners-sm transition-colors cursor-pointer group">
        <span className="text-slate-500 group-hover:text-slate-900 transition-colors">{user}: <span className="text-slate-900 font-semibold">{bid}</span></span>
        <span className={`${type === 'shark' ? 'text-nobody-primary' : 'text-nobody-gold'}`}>
            {type === 'shark' ? '🦈' : '👤'}
        </span>
    </div>
);
