import React, { useState } from "react";
import { motion } from "framer-motion";
import { invoke } from "@tauri-apps/api/core";

interface IdentityInitializationProps {
    onComplete: () => void;
    onBack: () => void;
}

export const IdentityInitialization: React.FC<IdentityInitializationProps> = ({ onComplete, onBack }) => {
    const [mode, setMode] = useState<"create" | "import">("create");
    const [alias, setAlias] = useState("");
    const [step, setStep] = useState<"form" | "generating">("form");
    const [progress, setProgress] = useState(0);

    const handleCreate = async () => {
        console.log("🖱️ Generate Identity Clicked");
        setStep("generating");
        try {
            console.log("⚡ Invoking generate_new_identity...");
            // Pass the alias state to the backend
            await invoke("generate_new_identity", { alias: alias || "Anonymous Fox" });
            console.log("✅ Identity Generated");
            setProgress(100);
            setTimeout(onComplete, 1500);
        } catch (e) {
            console.error("❌ Generation Failed:", e);
            alert("Generation Failed: " + e);
            setStep("form");
        }
    };

    // Auto-generate alias on mount
    React.useEffect(() => {
        const adjectives = ["Silent", "Neon", "Hidden", "Digital", "Quantum", "Shadow"];
        const nouns = ["Fox", "Ghost", "Specter", "Wraith", "Signal", "Node"];
        const randomAlias = `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
        setAlias(randomAlias);
    }, []);

    return (
        <motion.div
            className="absolute inset-0 z-[60] flex items-center justify-center bg-black/95 font-mono text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="w-[600px] border border-gray-700 bg-nobody-charcoal shadow-2xl relative">

                {/* Header */}
                <div className="bg-gray-900 mx-1 mt-1 p-2 border-b border-gray-700 flex justify-between items-center text-xs tracking-wider">
                    <span className="text-white font-bold">[ 🛡️ IDENTITY CREATION ]</span>
                    <span className="text-gray-500">[ 👤 MODE: {mode === "create" ? "NEW" : "IMPORT"} ]</span>
                    <span className="text-nobody-mint">[ 🔒 SECURITY: HIGH ]</span>
                </div>

                <div className="p-8 space-y-8">

                    {/* Mode Selection */}
                    <div className="flex gap-4">
                        <button
                            onClick={() => setMode("create")}
                            disabled={step === "generating"}
                            className={`flex-1 border p-4 text-left transition-colors group ${mode === "create" ? "border-nobody-mint bg-nobody-mint/10" : "border-gray-700 hover:border-gray-500"} ${step === "generating" ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                            <div className={`font-bold mb-1 ${mode === "create" ? "text-nobody-mint" : "text-gray-400 group-hover:text-white"}`}>[ 🆕 GENERATE NEW IDENTITY ]</div>
                            <div className="text-xs text-gray-500">(Generate fresh ZK-keys)</div>
                        </button>
                    </div>

                    <div className="border-t border-gray-800" />

                    <div className={`space-y-6 ${step === "generating" ? "opacity-50 pointer-events-none" : ""}`}>
                        <div className="space-y-2">
                            <div className="text-gray-400 text-xs font-bold">[ 👻 ASSIGN LOCAL ALIAS ]</div>
                            <input
                                type="text"
                                value={alias}
                                onChange={(e) => setAlias(e.target.value)}
                                placeholder="Name: [ The Clueless Fox_______ ]"
                                disabled={step === "generating"}
                                className="w-full bg-black/50 border border-gray-700 p-3 text-white focus:border-nobody-mint focus:outline-none placeholder-gray-600 disabled:bg-gray-900 disabled:text-gray-500"
                            />
                            <div className="text-[10px] text-gray-600 text-right">(Local only - Not leaked to Mesh)</div>
                        </div>

                        <div className="space-y-2">
                            <div className="text-gray-400 text-xs font-bold">[ 🛡️ SET MASTER PASSWORD ]</div>
                            <input
                                type="password"
                                placeholder="Pass: [ •••••••••••••••••• ]"
                                disabled={step === "generating"}
                                className="w-full bg-black/50 border border-gray-700 p-3 text-white focus:border-nobody-mint focus:outline-none placeholder-gray-600 disabled:bg-gray-900"
                            />
                            <input
                                type="text"
                                placeholder="Hint: [ My first hardware... ]"
                                disabled={step === "generating"}
                                className="w-full bg-black/50 border border-gray-700 p-3 text-gray-400 focus:border-gray-500 focus:outline-none placeholder-gray-600 text-xs disabled:bg-gray-900"
                            />
                        </div>
                    </div>

                    <div className="border-t border-gray-800" />

                    {/* Progression / Action */}
                    {step === "generating" ? (
                        <div className="space-y-4">
                            <div className="text-nobody-mint font-bold animate-pulse">[ ⚙️ GENERATING CRYPTO ASSETS... ]</div>
                            <ul className="text-xs space-y-2 text-gray-400">
                                <li className="flex items-center justify-between">
                                    <span>- Creating Avalanche Keypair...</span>
                                    <span className={progress > 30 ? "text-nobody-mint" : "text-gray-600"}>{progress > 30 ? "[ DONE ]" : "..."}</span>
                                </li>
                                <li className="flex items-center justify-between">
                                    <span>- Deriving Mesh PeerID...</span>
                                    <span className={progress > 60 ? "text-nobody-mint" : "text-gray-600"}>{progress > 60 ? "[ DONE ]" : "..."}</span>
                                </li>
                                <li className="flex items-center justify-between">
                                    <span>- Setting AES-256 Vault...</span>
                                    <span className={progress >= 100 ? "text-nobody-mint" : "text-gray-600"}>{progress >= 100 ? "[ DONE ]" : "..."}</span>
                                </li>
                            </ul>

                            {progress >= 100 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="bg-nobody-mint/20 border border-nobody-mint p-3 text-xs text-nobody-mint italic mt-4"
                                >
                                    {">>"} AGENT: "Your local identity is ready. Remember: Master Pass is the ONLY way to unlock your ZK-Proofs."
                                </motion.div>
                            )}

                            {progress >= 100 && (
                                <button
                                    onClick={onComplete}
                                    className="w-full bg-nobody-mint text-black font-bold py-3 hover:bg-white transition-colors uppercase tracking-wider mt-4"
                                >
                                    [ 🚀 INITIALIZE & SHRED RAM ]
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="flex gap-4">
                            <button
                                onClick={handleCreate}
                                className="flex-1 bg-white text-black font-bold py-3 hover:bg-gray-200 transition-colors uppercase tracking-wider"
                            >
                                [ {mode === "create" ? "GENERATE IDENTITY" : "RESTORE FROM SEED"} ]
                            </button>
                            <button
                                onClick={onBack}
                                className="px-6 border border-gray-700 text-gray-400 hover:text-white hover:border-white transition-colors font-bold uppercase"
                            >
                                [ 🔙 BACK ]
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </motion.div>
    );
};
