import React, { useState } from "react";
import { motion } from "framer-motion";
import { invoke } from "@tauri-apps/api/core";

interface DelegationCenterProps {
    visible: boolean;
    onComplete: () => void; // Called after successful delegation
    onCancel: () => void;
}

export const DelegationCenter: React.FC<DelegationCenterProps> = ({ visible, onComplete, onCancel }) => {
    const [step, setStep] = useState<"idle" | "signing">("idle");
    const [progress, setProgress] = useState(0);

    const handleSignAndDelegate = async () => {
        setStep("signing");

        // Simulating the sequence from the ASCII art status
        // 1. Generating Ephemeral Keypair
        setTimeout(() => setProgress(30), 500);

        // 2. Initializing Instant Session
        setTimeout(() => setProgress(60), 1200);

        // 3. Signing (Real backend call)
        setTimeout(async () => {
            try {
                await invoke("enable_instant_session");
                setProgress(100);
                setTimeout(onComplete, 1000); // Wait a bit then close
            } catch (e) {
                console.error("Delegation Failed", e);
                alert("Delegation Failed: " + e);
                setStep("idle");
                setProgress(0);
            }
        }, 2000);
    };

    if (!visible) return null;

    return (
        <motion.div
            className="absolute inset-0 z-[60] flex items-center justify-center bg-black/95 font-mono text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="w-[650px] border border-gray-700 bg-nobody-charcoal shadow-2xl relative flex flex-col">

                {/* Header */}
                <div className="bg-gray-900 mx-1 mt-1 p-2 border-b border-gray-700 flex justify-between items-center text-xs tracking-wider">
                    <span className="text-white font-bold">[ 🛡️ DELEGATION CENTER ]</span>
                    <span className="text-gray-500">[ 👤 IDENTITY: CLUELESS FOX ]</span>
                    <span className="text-nobody-mint">[ ⚡ ENGINE: INSTANT SESSION ]</span>
                </div>

                <div className="p-8 space-y-6">

                    {/* Agent Authority Setup */}
                    <div className="space-y-2">
                        <div className="text-nobody-mint font-bold text-xs tracking-widest">[ 🗝️ AGENT AUTHORITY SETUP ]</div>
                        <div className="text-gray-400 text-xs leading-relaxed border-l-2 border-gray-700 pl-3">
                            You are about to authorize your AI Agent to negotiate and sign transactions on your behalf using an Instant Session key.
                        </div>
                    </div>

                    <div className="border-t border-gray-800" />

                    {/* Delegation Limits */}
                    <div className="space-y-4">
                        <div className="text-gray-500 font-bold text-xs tracking-widest mb-3">[ 📊 DELEGATION LIMITS ]</div>

                        <div className="grid grid-cols-2 gap-4 text-xs">
                            <div className="bg-black/30 p-3 border border-gray-800 flex justify-between items-center text-gray-400">
                                <span>- Max Spending Limit:</span>
                                <span className="text-white font-bold">[ 5.00_______ ] AVAX</span>
                            </div>
                            <div className="bg-black/30 p-3 border border-gray-800 flex justify-between items-center text-gray-400">
                                <span>- Session Duration:</span>
                                <span className="text-white font-bold">[ 24_________ ] Hours</span>
                            </div>
                        </div>

                        <div className="bg-black/30 p-3 border border-gray-800 text-xs flex justify-between items-center text-gray-400">
                            <span>- Allowed Protocols:</span>
                            <span className="text-nobody-mint font-bold">[ Instant Session, Private Swap, Starpay ]</span>
                        </div>
                    </div>

                    {/* Security Override */}
                    <div className="space-y-2">
                        <div className="text-gray-500 font-bold text-xs tracking-widest mb-2">[ 🔒 SECURITY OVERRIDE ]</div>
                        <div className="space-y-1 text-xs text-gray-400">
                            <div className="flex items-center gap-2">
                                <span className="text-nobody-mint">[X]</span>
                                <span>Auto-terminate session if Mesh connection is lost.</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-nobody-mint">[X]</span>
                                <span>Require Master Pass for transactions {">"} 1.0 AVAX.</span>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-800" />

                    {/* Delegation Status (Dynamic) */}
                    <div className="bg-black/50 p-4 border border-gray-800 space-y-2 relative overflow-hidden">
                        <div className="text-gray-500 font-bold text-xs tracking-widest mb-2">[ ⚙️ DELEGATION STATUS ]</div>

                        <ul className="text-xs space-y-1 text-gray-400 font-mono">
                            <li className="flex justify-between">
                                <span>- Generating Ephemeral Keypair...</span>
                                <span className={progress >= 30 ? "text-nobody-mint" : "text-gray-600"}>{progress >= 30 ? "[ DONE ]" : "..."}</span>
                            </li>
                            <li className="flex justify-between">
                                <span>- Initializing Instant Session...</span>
                                <span className={progress >= 60 ? "text-nobody-mint" : "text-gray-600"}>{progress >= 60 ? "[ READY ]" : "..."}</span>
                            </li>
                            <li className="flex justify-between">
                                <span>- Waiting for Owner Signature...</span>
                                <span className={progress >= 100 ? "text-nobody-mint" : "text-gray-600"}>{progress >= 100 ? "[ SIGNED ]" : step === "signing" ? "[ PENDING ]" : "[ WAITING ]"}</span>
                            </li>
                        </ul>

                        <div className="mt-4 border-l-2 border-nobody-mint pl-3 py-1 text-xs italic text-gray-400">
                            <span className="text-nobody-mint font-bold not-italic">{">>"} AGENT:</span> "I will manage your intents within these bounds. Once authorized, I can trade even while you are away."
                        </div>

                        {/* Progress Bar overlay if needed, or just relying on text */}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-2">
                        <button
                            onClick={handleSignAndDelegate}
                            disabled={step === "signing"}
                            className={`flex-1 bg-white text-black font-bold py-3 hover:bg-gray-200 transition-colors uppercase tracking-wider ${step === "signing" ? "opacity-70 cursor-wait" : ""}`}
                        >
                            [ {step === "signing" ? "✍️ SIGNING..." : "✍️ SIGN & DELEGATE"} ]
                        </button>
                        <button
                            onClick={onCancel}
                            disabled={step === "signing"}
                            className="px-6 border border-gray-700 text-gray-400 hover:text-white hover:border-white transition-colors font-bold uppercase disabled:opacity-50"
                        >
                            [ 🔙 CANCEL ]
                        </button>
                    </div>

                </div>
            </div>
        </motion.div>
    );

};
