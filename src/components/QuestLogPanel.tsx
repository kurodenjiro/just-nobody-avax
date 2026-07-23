import React, { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { DealView } from "../types";

interface QuestLogPanelProps {
    refreshKey?: number;
    onOpenArsenal: () => void;
}

function statusIcon(status: DealView["status"]) {
    if (status === "active") return "⚔️";
    if (status === "released") return "✅";
    if (status === "refunded") return "↩️";
    return "•";
}

/** Always-visible panel on the Nexus screen showing real on-chain deals —
 * no click required to see what's in progress, unlike the old
 * "open Arsenal Mode first" flow. Clicking an item (or the header) still
 * opens the full Arsenal for releasing/refunding. */
export const QuestLogPanel: React.FC<QuestLogPanelProps> = ({ refreshKey, onOpenArsenal }) => {
    const [deals, setDeals] = useState<DealView[]>([]);

    const load = useCallback(async () => {
        try {
            const identities = await invoke<{ address: string }[]>("get_identity");
            const address = identities[0]?.address;
            if (address) {
                const myDeals = await invoke<DealView[]>("get_my_deals", { address });
                setDeals(myDeals);
            }
        } catch (e) {
            console.error("Failed to load deals:", e);
        }
    }, []);

    useEffect(() => {
        load();
        const interval = setInterval(load, 10000);
        return () => clearInterval(interval);
    }, [load, refreshKey]);

    return (
        <div className="absolute top-28 right-6 w-72 z-20 hud-frame border border-slate-200 bg-nobody-charcoal shadow-card p-3">
            <button onClick={onOpenArsenal} className="w-full flex items-center justify-between text-left mb-2">
                <span className="text-nobody-primary font-pixel text-[10px] tracking-wide">📜 QUEST LOG</span>
                <span className="text-slate-400 text-[10px]">Open →</span>
            </button>
            {deals.length === 0 ? (
                <div className="text-slate-400 text-xs italic">No deals yet — matched buys/sells show up here.</div>
            ) : (
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                    {deals.slice(-5).reverse().map((d) => (
                        <button
                            key={d.deal_id}
                            onClick={onOpenArsenal}
                            className="w-full text-left bg-slate-50 pixel-corners-sm border border-slate-200 p-2 flex items-center justify-between gap-2 hover:bg-slate-100 transition-colors text-xs"
                        >
                            <span className="text-slate-900 truncate">{statusIcon(d.status)} #{d.deal_id} 🎫 #{d.token_id}</span>
                            <span className="text-nobody-primary font-semibold shrink-0">{d.amount_avax} AVAX</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default QuestLogPanel;
