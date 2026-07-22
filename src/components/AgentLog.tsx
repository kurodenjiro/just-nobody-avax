import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AgentLogProps {
    visible: boolean;
    logs: string[];
}

export const AgentLog: React.FC<AgentLogProps> = ({ visible, logs }) => {
    if (!visible) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="absolute inset-x-4 top-[15%] mx-auto w-[700px] z-50 text-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
            >
                <div className="bg-nobody-charcoal border border-nobody-primary/30 shadow-card-lg overflow-hidden pixel-corners">
                    {/* Header */}
                    <div className="bg-slate-50 border-b border-nobody-primary/20 p-3 text-center">
                        <span className="text-nobody-primary font-pixel tracking-wide text-[10px]">[ LOCAL AGENT PROCESSING ]</span>
                    </div>

                    <div className="p-6 space-y-4">
                        {/* Processing Steps */}
                        {logs.map((log, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-1"
                            >
                                <div className="text-nobody-primary text-xs font-mono">
                                    {log}
                                </div>
                                {i === logs.length - 1 && (
                                    <div className="mt-2 h-2 overflow-hidden text-nobody-primary">
                                        <motion.div
                                            className="h-full pixel-progress"
                                            initial={{ width: "0%" }}
                                            animate={{ width: "100%" }}
                                            transition={{ duration: 1.5 }}
                                        />
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
