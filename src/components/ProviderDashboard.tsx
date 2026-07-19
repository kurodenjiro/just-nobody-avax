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
            className="absolute inset-0 bg-black z-40 font-mono text-sm flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Header */}
            <div className="h-14 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-900/50">
                <div className="flex items-center gap-4">
                    <span className="text-nobody-mint font-bold tracking-wider">[ 💰 MERCHANT MODE: ACTIVE ]</span>
                    <span className="text-gray-500 text-xs">[ 👤 ID: Nobody_99 ]</span>
                </div>
                <div className="text-nobody-violet font-bold bg-nobody-violet/10 px-3 py-1 border border-nobody-violet/20">
                    [ 🏦 LIQUIDITY: 500 AVAX ]
                </div>
            </div>

            {/* Main Layout */}
            <div className="flex-1 p-6 grid grid-cols-2 gap-6 overflow-y-auto">

                {/* Left Column: Listings & Strategy */}
                <div className="space-y-6">

                    <DashboardBox title="ACTIVE LISTINGS">
                        <div className="space-y-2 pt-2">
                            <ListingItem label="1. [📦] 120x ESP32" price="$9.5" />
                            <ListingItem label="2. [🎨] Fox Trait NFT" price="15 AVAX" />
                            <ListingItem label="3. [⚡] bandwidth_relay" price="0.1/kb" />

                            <button
                                onClick={onCreateService}
                                className="w-full text-left text-xs text-gray-500 hover:text-white border border-dashed border-gray-700 hover:border-white p-2 mt-2"
                            >
                                [+] Create New Listing
                            </button>
                        </div>
                    </DashboardBox>

                    {/* Relayer Mode Status */}
                    <RelayerStatus
                        isRelaying={isRelaying}
                        onToggle={setIsRelaying}
                    />

                    <DashboardBox title="🧠 MERCHANT AGENT STRATEGY">
                        <div className="space-y-2 pt-2 text-xs text-gray-300">
                            <div>- Strategy: <span className="text-white">"Steady Profit"</span> <span className="text-gray-500">(Min Margin: 10%)</span></div>
                            <div>- Auto-Accept: <span className="text-nobody-mint">If Bid {'>'} $9.3</span></div>
                            <div>- Settlement: <span className="text-nobody-violet">Private Swap (Avalanche Fuji)</span></div>
                        </div>
                    </DashboardBox>

                </div>

                {/* Right Column: Incoming Bids & Log */}
                <div className="space-y-6">

                    <DashboardBox title="🛰️ INCOMING AGENT BIDS">
                        <div className="bg-black/40 border border-gray-800 p-2 space-y-1">
                            <BidRow user="Nobody_42a8" bid="$9.1" type="shark" />
                            <BidRow user="Nobody_11x9" bid="$9.4" type="user" />
                            <BidRow user="Nobody_zero" bid="$9.0" type="shark" />
                        </div>
                    </DashboardBox>

                    <DashboardBox title="🦈 LIVE NEGOTIATION LOG">
                        <div className="text-xs space-y-2 h-40 overflow-y-auto font-mono">
                            {logs.map((log, i) => (
                                <div key={i} className={`${log.includes('ALERT') ? 'text-nobody-mint bg-nobody-mint/10 p-2 border border-nobody-mint/20 animate-pulse' : 'text-gray-400'}`}>
                                    {log}
                                </div>
                            ))}
                        </div>
                    </DashboardBox>

                </div>
            </div>

            {/* Footer Actions */}
            <div className="h-16 border-t border-gray-800 bg-gray-900/50 flex items-center justify-between px-6">
                <div className="flex gap-3">
                    <button className="bg-nobody-mint text-black font-bold px-4 py-2 hover:bg-white transition-colors text-xs uppercase">
                        [ ACCEPT & RELEASE ]
                    </button>
                    <button className="bg-gray-800 text-white font-bold px-4 py-2 hover:bg-gray-700 transition-colors text-xs uppercase border border-gray-600">
                        [ COUNTER OFFER ]
                    </button>
                </div>
                <button onClick={onClose} className="text-gray-500 hover:text-white text-xs font-bold border border-gray-800 px-3 py-2">
                    [ 📊 SALES STATS ]
                </button>
            </div>
        </motion.div>
    );
};

const DashboardBox = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="border border-gray-700 bg-nobody-charcoal p-4 relative shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
        <div className="absolute -top-3 left-3 bg-nobody-charcoal px-2 text-gray-500 text-xs font-bold tracking-wider border border-gray-800">
            [ {title} ]
        </div>
        {children}
    </div>
);

const ListingItem = ({ label, price }: { label: string, price: string }) => (
    <div className="flex justify-between items-center text-sm border-b border-gray-800/50 pb-2 last:border-0">
        <span className="text-white font-bold">{label}</span>
        <span className="text-nobody-mint">{price}</span>
    </div>
);

const BidRow = ({ user, bid, type }: { user: string, bid: string, type: 'shark' | 'user' }) => (
    <div className="flex justify-between items-center text-xs p-1 hover:bg-white/5 cursor-pointer group">
        <span className="text-gray-400 group-hover:text-white transition-colors">{user}: <span className="text-white font-bold">{bid}</span></span>
        <span className={`${type === 'shark' ? 'text-nobody-mint' : 'text-nobody-violet'}`}>
            [ {type === 'shark' ? '🦈' : '👤'} ]
        </span>
    </div>
);
