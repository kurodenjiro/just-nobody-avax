import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AgentLogProps {
    visible: boolean;
    logs: string[];
}

/** A compact "agent is working" card for one-shot processing (e.g. evaluating
 * an incoming peer intent) — shows only the current status line instead of a
 * full log dump. The sender's own queued searches use SearchQueue instead. */
export const AgentLog: React.FC<AgentLogProps> = ({ visible, logs }) => {
    if (!visible) return null;

    const currentStatus = logs[logs.length - 1] || "Processing...";

    return (
        <AnimatePresence>
            <motion.div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[380px]"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
            >
                <div className="bg-nobody-charcoal border border-nobody-primary/30 shadow-card-lg pixel-corners p-5 flex flex-col items-center gap-3 text-center">
                    <div className="w-8 h-8 border-2 border-nobody-primary border-t-transparent rounded-full animate-spin" />
                    <div className="text-nobody-primary font-pixel tracking-wide text-[10px]">LOCAL AGENT PROCESSING</div>
                    <div className="text-slate-500 text-xs font-mono">{currentStatus}</div>
                    <div className="w-full h-1.5 overflow-hidden text-nobody-primary">
                        <motion.div
                            className="h-full pixel-progress"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        />
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
