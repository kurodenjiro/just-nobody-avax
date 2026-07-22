import React, { useState } from "react";
import { motion } from "framer-motion";
import { invoke } from "@tauri-apps/api/core";

interface ServiceCreatorProps {
    onClose: () => void;
    onDeploy: (listingId: number) => void;
}

const VOUCHER_TYPES = ["AI Compute Credit", "Relay Bandwidth Credit", "Custom"];

type Step = "idle" | "minting" | "approving" | "listing" | "done";

const STEP_LABEL: Record<Step, string> = {
    idle: "",
    minting: "Minting voucher NFT (proof of possession)...",
    approving: "Approving Marketplace to hold the voucher...",
    listing: "Creating on-chain listing...",
    done: "Listed ✓",
};

export const ServiceCreator: React.FC<ServiceCreatorProps> = ({ onClose, onDeploy }) => {
    const [voucherType, setVoucherType] = useState(VOUCHER_TYPES[0]);
    const [customType, setCustomType] = useState("");
    const [description, setDescription] = useState("");
    const [priceAvax, setPriceAvax] = useState("");
    const [step, setStep] = useState<Step>("idle");
    const [error, setError] = useState<string | null>(null);

    const effectiveType = voucherType === "Custom" ? customType.trim() : voucherType;
    const isDeploying = step !== "idle" && step !== "done";
    const canDeploy = effectiveType.length > 0 && description.trim().length > 0 && parseFloat(priceAvax) > 0 && !isDeploying;

    const handleDeploy = async () => {
        if (!canDeploy) return;
        setError(null);
        try {
            setStep("minting");
            const tokenId = await invoke<number>("mint_voucher", {
                voucherType: effectiveType,
                description: description.trim(),
            });

            setStep("approving");
            await invoke("approve_voucher", { tokenId });

            setStep("listing");
            const listingId = await invoke<number>("create_asset_listing", {
                description: description.trim(),
                priceAvax,
                tokenId,
            });

            setStep("done");
            onDeploy(listingId);
        } catch (e) {
            console.error("Failed to create asset-backed listing:", e);
            setError("On-chain listing failed: " + e);
            setStep("idle");
        }
    };

    return (
        <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
        >
            <div className="w-full max-w-2xl pixel-corners border border-slate-200 bg-nobody-charcoal shadow-card-lg overflow-hidden flex flex-col">

                {/* Header */}
                <div className="bg-slate-50 p-3 border-b border-slate-200 flex justify-between items-center">
                    <span className="text-nobody-gold font-pixel tracking-wide text-[10px]">[ ✨ CREATE NEW LISTING ]</span>
                    <div className="flex gap-4 text-xs">
                        <span className="text-slate-500">Mode: Arsenal</span>
                        <span className="text-nobody-primary font-medium">🛡️ On-chain: Fuji</span>
                    </div>
                </div>

                <div className="p-6 space-y-6">

                    {/* Voucher Type */}
                    <div className="space-y-2">
                        <label className="text-slate-500 text-xs font-semibold">Voucher Type (mints a real NFT — proves you're the one offering it)</label>
                        <div className="flex gap-2">
                            {VOUCHER_TYPES.map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setVoucherType(t)}
                                    disabled={isDeploying}
                                    className={`flex-1 text-xs font-semibold py-2 pixel-corners-sm border transition-colors ${voucherType === t ? "border-nobody-primary bg-nobody-primary-soft text-nobody-primary" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                        {voucherType === "Custom" && (
                            <input
                                type="text"
                                value={customType}
                                onChange={(e) => setCustomType(e.target.value)}
                                disabled={isDeploying}
                                placeholder="Custom voucher type name"
                                className="w-full bg-slate-50 border border-slate-200 pixel-corners-sm p-3 text-sm text-slate-900 focus:border-nobody-primary focus:bg-nobody-charcoal outline-none transition-colors"
                            />
                        )}
                    </div>

                    {/* Description Input */}
                    <div className="space-y-2">
                        <label className="text-slate-500 text-xs font-semibold">What are you offering?</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={isDeploying}
                            placeholder='Example: "1 hour of Ollama compute time over the mesh"'
                            className="w-full h-24 bg-slate-50 border border-slate-200 pixel-corners-sm p-3 text-sm text-slate-900 focus:border-nobody-primary focus:bg-nobody-charcoal outline-none resize-none transition-colors"
                        />
                    </div>

                    {/* Price Input */}
                    <div className="space-y-2">
                        <label className="text-slate-500 text-xs font-semibold">Price (AVAX)</label>
                        <input
                            type="number"
                            min="0"
                            step="0.001"
                            value={priceAvax}
                            onChange={(e) => setPriceAvax(e.target.value)}
                            disabled={isDeploying}
                            placeholder="0.1"
                            className="w-full bg-slate-50 border border-slate-200 pixel-corners-sm p-3 text-sm text-slate-900 focus:border-nobody-primary focus:bg-nobody-charcoal outline-none transition-colors"
                        />
                    </div>

                    {description && parseFloat(priceAvax) > 0 && step === "idle" && (
                        <div className="bg-nobody-gold-soft pixel-corners-sm p-3 text-center text-sm text-nobody-gold font-semibold">
                            Preview: "{effectiveType}" — "{description}" — {priceAvax} AVAX
                        </div>
                    )}

                    {isDeploying && (
                        <div className="border-l-2 border-nobody-primary pl-4 space-y-1">
                            <div className="text-nobody-primary font-semibold text-xs animate-pulse">
                                {STEP_LABEL[step]}
                            </div>
                            <div className="text-slate-400 text-[11px]">
                                3 real on-chain transactions: mint → approve → list
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="text-red-600 text-xs">{error}</div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="border-t border-slate-200 p-4 flex justify-between bg-slate-50">
                    <button onClick={onClose} disabled={isDeploying} className="text-slate-400 hover:text-slate-700 transition-colors text-xs font-semibold disabled:opacity-50">🗑️ Discard</button>
                    <button
                        onClick={handleDeploy}
                        disabled={!canDeploy}
                        className={`text-white text-xs font-semibold px-4 py-2 pixel-corners-sm transition-colors ${canDeploy ? 'bg-nobody-primary hover:brightness-125' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                    >
                        {isDeploying ? STEP_LABEL[step] : "🚀 Mint & List"}
                    </button>
                </div>

            </div>
        </motion.div>
    );
};
