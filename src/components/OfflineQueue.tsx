import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QueuedTx } from "../types";

interface OfflineQueueProps {
    items: QueuedTx[];
    onDismiss: (id: string) => void;
}

/** Transactions signed locally while the RPC was unreachable, waiting for a
 * mesh peer with real connectivity (and Relay Mode on) to broadcast them. */
export const OfflineQueue: React.FC<OfflineQueueProps> = ({ items, onDismiss }) => {
    if (items.length === 0) return null;

    return (
        <div className="absolute bottom-6 right-6 w-[380px] z-20 flex flex-col-reverse gap-2 max-h-64 overflow-y-auto">
            <AnimatePresence>
                {items.map((item) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className={`bg-nobody-charcoal border shadow-card pixel-corners-sm px-3 py-2 flex items-center gap-3 text-xs ${item.status === "confirmed" ? "border-nobody-primary" :
                            item.status === "failed" ? "border-red-300" : "border-nobody-gold"
                            }`}
                    >
                        {item.status === "queued" && (
                            <span className="shrink-0 animate-pulse">📡</span>
                        )}
                        {item.status === "confirmed" && <span className="shrink-0">✅</span>}
                        {item.status === "failed" && <span className="shrink-0">⚠️</span>}

                        <div className="flex-1 min-w-0">
                            <div className="text-slate-900 font-medium truncate">{item.summary}</div>
                            <div className="text-slate-400 text-[11px] truncate">
                                {item.status === "queued" && "Waiting for a mesh peer with network to relay this..."}
                                {item.status === "confirmed" && (item.tx_hash ? `Confirmed: ${item.tx_hash.slice(0, 10)}...` : "Confirmed on-chain")}
                                {item.status === "failed" && "Relay failed — try again once you have network"}
                            </div>
                        </div>

                        {item.status !== "queued" && (
                            <button
                                onClick={() => onDismiss(item.id)}
                                className="text-slate-400 hover:text-red-500 transition-colors shrink-0"
                            >
                                ✕
                            </button>
                        )}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};
