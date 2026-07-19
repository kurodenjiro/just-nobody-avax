import React from "react";
import { motion } from "framer-motion";

interface ArchivesProps {
    visible: boolean;
    onClose: () => void;
}

export const Archives: React.FC<ArchivesProps> = ({ visible, onClose }) => {
    if (!visible) return null;

    const history = [
        { id: "042a", item: "Clueless Fox #04", price: "13.5 SOL", status: "SUCCESS", date: "2026-01-29" },
        { id: "9b1c", item: "Shadow Drive 10GB", price: "2.1 SOL", status: "SHREDDED", date: "2026-01-28" },
        { id: "3f8x", item: "Mesh Compute Unit", price: "0.5 SOL", status: "FAILED", date: "2026-01-28" },
    ];

    return (
        <motion.div
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 font-mono"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <div className="w-[800px] bg-nobody-charcoal border border-gray-700 p-6 shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">X</button>

                <h2 className="text-xl text-white font-bold mb-6 tracking-widest border-b border-gray-700 pb-2 flex items-center gap-2">
                    <span className="text-nobody-violet">📂</span> ARCHIVES // TRANSACTION_LOG
                </h2>

                <div className="space-y-2">
                    <div className="grid grid-cols-5 text-gray-500 text-xs uppercase tracking-wider mb-2 px-2">
                        <div>ID</div>
                        <div className="col-span-2">Item</div>
                        <div>Price</div>
                        <div>Status</div>
                    </div>
                    {history.map((tx) => (
                        <div key={tx.id} className="grid grid-cols-5 text-sm p-2 bg-black/40 border border-gray-800 hover:border-gray-500 transition-colors cursor-default">
                            <div className="text-gray-400">#{tx.id}</div>
                            <div className="col-span-2 text-white font-bold">{tx.item}</div>
                            <div className="text-gray-300">{tx.price}</div>
                            <div className={`font-bold ${tx.status === "SUCCESS" ? "text-green-500" :
                                    tx.status === "SHREDDED" ? "text-gray-600 line-through" : "text-red-500"
                                }`}>
                                [{tx.status}]
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 flex justify-between items-center text-[10px] text-gray-600">
                    <div>TOTAL RECORDS: {history.length}</div>
                    <div className="animate-pulse">AUTO-SHRED ENABLED</div>
                </div>
            </div>
        </motion.div>
    );
};
