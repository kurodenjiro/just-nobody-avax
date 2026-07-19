import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { invoke } from "@tauri-apps/api/core";

interface SmartEscrowProps {
    visible: boolean;
    escrowId: number | null;
    onClose: () => void;
    onRelease?: () => void;
}

export const SmartEscrow: React.FC<SmartEscrowProps> = ({ visible, escrowId, onClose, onRelease }) => {
    const [released, setReleased] = useState(false);
    const [releasing, setReleasing] = useState(false);
    const [finality, setFinality] = useState<"pending" | "confirmed">("pending");

    useEffect(() => {
        if (visible) {
            setReleased(false);
            setReleasing(false);
            setFinality("pending");

            if (escrowId != null) {
                invoke("get_escrow_status", { escrowId })
                    .then(() => setFinality("confirmed"))
                    .catch((e) => {
                        console.error("Failed to fetch escrow status:", e);
                        setFinality("pending");
                    });
            }
        }
    }, [visible, escrowId]);

    const handleRelease = async () => {
        if (escrowId == null) {
            alert("No on-chain escrow is associated with this deal.");
            return;
        }

        setReleasing(true);
        try {
            await invoke("release_escrow", { escrowId });
            setReleased(true);
            onRelease?.();
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (e) {
            console.error("On-chain release failed:", e);
            alert("On-chain release failed: " + e);
        } finally {
            setReleasing(false);
        }
    };

    if (!visible) return null;

    return (
        <motion.div
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 font-mono"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <div className="w-[700px] bg-gray-900 border border-yellow-500/30 p-8 shadow-[0_0_50px_rgba(234,179,8,0.1)] relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">Esc</button>

                <div className="text-center mb-10">
                    <div className="text-yellow-500 text-xs font-bold tracking-[0.3em] mb-2">SMART ESCROW PROTOCOL</div>
                    <h1 className="text-3xl text-white font-bold">
                        {released ? "SETTLEMENT COMPLETE" : "SETTLEMENT IN PROGRESS"}
                    </h1>
                </div>

                <div className="flex justify-between items-center mb-12 px-10">
                    {/* Left Vault */}
                    <div className="text-center">
                        <div className="w-24 h-24 border-2 border-yellow-500 rounded-full flex items-center justify-center text-3xl mb-4 shadow-[0_0_20px_rgba(234,179,8,0.2)] bg-black">
                            💰
                        </div>
                        <div className="text-white font-bold">13.5 AVAX</div>
                        <div className="text-xs text-gray-500 sm:mt-1">
                            {released ? "RELEASED ✓" : "ZK-VAULT LOCKED"}
                        </div>
                    </div>

                    {/* Bridge */}
                    <div className="flex-1 px-4 flex flex-col items-center">
                        <div className="h-[2px] w-full bg-yellow-500/20 relative">
                            <motion.div
                                className="absolute top-1/2 -translate-y-1/2 w-full h-[2px] bg-yellow-500"
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: released ? 1 : [0, 1] }}
                                transition={{ duration: 2, repeat: released ? 0 : Infinity }}
                            />
                        </div>
                        <div className="mt-2 text-[10px] text-yellow-500">
                            {released ? "COMPLETE ✓" : <span className="animate-pulse">VERIFYING INTEGRITY...</span>}
                        </div>
                    </div>

                    {/* Right Vault */}
                    <div className="text-center">
                        <div className="w-24 h-24 border-2 border-purple-500 rounded-full flex items-center justify-center text-3xl mb-4 shadow-[0_0_20px_rgba(168,85,247,0.2)] bg-black">
                            🦊
                        </div>
                        <div className="text-white font-bold">NFT #04</div>
                        <div className="text-xs text-gray-500 sm:mt-1">
                            {released ? "TRANSFERRED ✓" : "MESH PROXY HELD"}
                        </div>
                    </div>
                </div>

                {/* Status Items */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-black/50 p-3 border border-gray-800 flex justify-between items-center">
                        <span className="text-gray-500 text-xs">Avalanche Finality</span>
                        <span className={`text-xs font-bold ${finality === "confirmed" ? "text-green-500" : "text-gray-500"}`}>
                            {finality === "confirmed" ? "[CONFIRMED]" : "[PENDING]"}
                        </span>
                    </div>
                    <div className="bg-black/50 p-3 border border-gray-800 flex justify-between items-center">
                        <span className="text-gray-500 text-xs">Mesh Signatures</span>
                        <span className="text-green-500 text-xs font-bold">[VALID 3/3]</span>
                    </div>
                </div>

                <button
                    onClick={handleRelease}
                    disabled={released || releasing || escrowId == null}
                    className={`w-full font-bold py-3 uppercase tracking-widest transition-colors shadow-lg ${released
                        ? "bg-green-500 text-white cursor-default"
                        : "bg-yellow-500 text-black hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                        }`}
                >
                    {released ? "✓ FUNDS RELEASED" : releasing ? "RELEASING..." : "RELEASE FUNDS"}
                </button>

            </div>
        </motion.div>
    );
};
