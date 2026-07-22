import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRelayStats } from "../hooks/useRelayStats";

interface RelayerStatusProps {
    isRelaying: boolean;
    onToggle: (enabled: boolean) => void;
    peerCount?: number;
}

export const RelayerStatus: React.FC<RelayerStatusProps> = ({ isRelaying, onToggle, peerCount = 0 }) => {
    const { traffic, earnings } = useRelayStats(isRelaying);
    const activeConnections = Math.min(peerCount, 5);

    return (
        <div className="pixel-corners border border-slate-200 bg-nobody-charcoal shadow-card p-4 relative overflow-hidden">
            {/* Background Glow when Active */}
            <AnimatePresence>
                {isRelaying && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.06 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-nobody-primary z-0"
                    />
                )}
            </AnimatePresence>

            <div className="relative z-10 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${isRelaying ? "bg-nobody-primary animate-pulse" : "bg-slate-300"}`} />
                        <span className="text-slate-900 font-semibold tracking-wide text-sm">Relayer Mode</span>
                    </div>

                    {/* Toggle Switch */}
                    <button
                        onClick={() => onToggle(!isRelaying)}
                        className={`w-12 h-6 rounded-full p-1 transition-colors ${isRelaying ? "bg-nobody-primary" : "bg-slate-200"}`}
                    >
                        <motion.div
                            layout
                            className="w-4 h-4 rounded-full bg-nobody-charcoal shadow-md"
                            animate={{ x: isRelaying ? 24 : 0 }}
                        />
                    </button>
                </div>

                {isRelaying ? (
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                            <div className="text-slate-400 text-xs font-medium mb-1">Data Processed</div>
                            <div className="text-nobody-primary font-mono font-semibold">{traffic}</div>
                        </div>
                        <div>
                            <div className="text-slate-400 text-xs font-medium mb-1">Relay Earnings</div>
                            <div className="text-nobody-gold font-mono font-semibold">{earnings}</div>
                        </div>
                        <div className="col-span-2">
                            <div className="text-slate-400 text-xs font-medium mb-1">Active Hop Connections</div>
                            <div className="flex gap-1 h-2">
                                {[...Array(5)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`flex-1 rounded-full transition-colors duration-300 ${i < activeConnections ? "bg-nobody-primary" : "bg-slate-100"}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-slate-400 text-xs italic pt-2">
                        Enable Relayer Mode to earn incentives by forwarding mesh traffic.
                    </div>
                )}
            </div>
        </div>
    );
};
