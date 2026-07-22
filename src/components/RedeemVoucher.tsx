import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { invoke } from "@tauri-apps/api/core";
import { VoucherView } from "../types";

interface RedeemVoucherProps {
    visible: boolean;
    onClose: () => void;
}

/** The third page: the buyer proves on-chain they hold a voucher, then burns it to claim the service. */
export const RedeemVoucher: React.FC<RedeemVoucherProps> = ({ visible, onClose }) => {
    const [myAddress, setMyAddress] = useState<string | null>(null);
    const [vouchers, setVouchers] = useState<VoucherView[]>([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<VoucherView | null>(null);
    const [ownerCheck, setOwnerCheck] = useState<"checking" | "verified" | "failed" | null>(null);
    const [redeeming, setRedeeming] = useState(false);
    const [redeemed, setRedeemed] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const identities = await invoke<{ address: string }[]>("get_identity");
            const address = identities[0]?.address;
            setMyAddress(address ?? null);
            if (address) {
                const owned = await invoke<VoucherView[]>("get_owned_vouchers", { owner: address });
                setVouchers(owned);
            }
        } catch (e) {
            console.error("Failed to load owned vouchers:", e);
            setError("Failed to load your vouchers: " + e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (visible) {
            setSelected(null);
            setOwnerCheck(null);
            setRedeemed(null);
            load();
        }
    }, [visible, load]);

    const handleSelect = async (v: VoucherView) => {
        setSelected(v);
        setRedeemed(null);
        setOwnerCheck("checking");
        try {
            const owner = await invoke<string>("get_voucher_owner", { tokenId: v.token_id });
            setOwnerCheck(myAddress && owner.toLowerCase() === myAddress.toLowerCase() ? "verified" : "failed");
        } catch (e) {
            console.error("Ownership check failed:", e);
            setOwnerCheck("failed");
        }
    };

    const handleRedeem = async () => {
        if (!selected || ownerCheck !== "verified") return;
        setRedeeming(true);
        setError(null);
        try {
            await invoke("redeem_voucher", { tokenId: selected.token_id });
            setRedeemed(selected.voucher_type);
            setVouchers((prev) => prev.filter((v) => v.token_id !== selected.token_id));
            setSelected(null);
            setOwnerCheck(null);
        } catch (e) {
            console.error("Redeem failed:", e);
            setError("On-chain redeem failed: " + e);
        } finally {
            setRedeeming(false);
        }
    };

    if (!visible) return null;

    return (
        <motion.div
            className="absolute inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <div className="w-[650px] max-h-[85vh] flex flex-col hud-frame border border-nobody-gold/30 bg-nobody-charcoal shadow-card-lg overflow-hidden">

                {/* Header */}
                <div className="bg-slate-50 px-5 py-3 border-b border-nobody-gold/20 flex justify-between items-center text-xs">
                    <span className="text-nobody-gold font-pixel text-[10px] tracking-wide">REDEEM VOUCHER</span>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">✕</button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">

                    {redeemed && (
                        <div className="bg-nobody-primary-soft/40 border border-nobody-primary/30 pixel-corners-sm p-4 text-center">
                            <div className="text-nobody-primary font-semibold">✓ Claimed: {redeemed}</div>
                            <div className="text-slate-500 text-xs mt-1">Voucher burned on-chain. Service unlocked.</div>
                        </div>
                    )}

                    {error && <div className="text-red-600 text-xs">{error}</div>}

                    <div>
                        <div className="text-slate-400 text-[10px] font-pixel tracking-wide mb-2">
                            VOUCHERS YOU OWN {myAddress && <span className="font-mono normal-case">({myAddress.slice(0, 6)}...{myAddress.slice(-4)})</span>}
                        </div>

                        {loading && <div className="text-slate-400 text-xs italic">Checking on-chain ownership...</div>}
                        {!loading && vouchers.length === 0 && (
                            <div className="text-slate-400 text-xs italic">No vouchers found in your wallet. Buy one from a matched Arsenal listing first.</div>
                        )}

                        <div className="space-y-2">
                            {vouchers.map((v) => (
                                <div
                                    key={v.token_id}
                                    onClick={() => handleSelect(v)}
                                    className={`p-3 pixel-corners-sm border cursor-pointer transition-all flex items-center justify-between ${selected?.token_id === v.token_id ? "border-nobody-gold bg-nobody-gold-soft/30" : "border-slate-200 hover:bg-slate-50"}`}
                                >
                                    <div>
                                        <span className="text-slate-900 font-semibold text-sm">🎫 #{v.token_id} {v.voucher_type}</span>
                                        <div className="text-[11px] text-slate-400">{v.description}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {selected && (
                        <div className="bg-slate-50 pixel-corners-sm p-4 border border-slate-200 space-y-3">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500">On-chain ownership check</span>
                                {ownerCheck === "checking" && <span className="text-slate-400 animate-pulse">Verifying...</span>}
                                {ownerCheck === "verified" && <span className="text-nobody-primary font-semibold">✓ Confirmed — you own this</span>}
                                {ownerCheck === "failed" && <span className="text-red-500 font-semibold">✗ Not confirmed</span>}
                            </div>

                            <button
                                onClick={handleRedeem}
                                disabled={ownerCheck !== "verified" || redeeming}
                                className="w-full bg-nobody-gold text-white font-semibold py-3 pixel-corners-sm hover:brightness-110 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {redeeming ? "Claiming..." : "🎁 Claim / Redeem"}
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-slate-50 border-t border-slate-200 px-5 py-2 flex justify-end items-center text-xs">
                    <button
                        onClick={onClose}
                        className="bg-nobody-charcoal text-slate-500 font-pixel text-[10px] px-6 py-2 hover:text-nobody-gold transition-colors pixel-corners-sm border border-slate-300 hover:border-nobody-gold shadow-card"
                    >
                        [ BACK ]
                    </button>
                </div>
            </div>
        </motion.div>
    );
};
