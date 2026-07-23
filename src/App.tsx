import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import "./styles.css";

// Components
import { Nexus } from "./components/Nexus";
import { MeshCharacterField } from "./components/MeshCharacterField";
import { RadiantHalo } from "./components/RadiantHalo";
import { AmbientParticles } from "./components/AmbientParticles";
import { RelayerStatusCompact } from "./components/RelayerStatusCompact";
import { ActiveListingsCompact } from "./components/ActiveListingsCompact";
import { WalletBalanceCompact } from "./components/WalletBalanceCompact";
import { IntentComposer } from "./components/IntentComposer";
import { AgentLog } from "./components/AgentLog";
import { SearchQueue, SearchJob } from "./components/SearchQueue";
import { OfflineQueue } from "./components/OfflineQueue";
import { OnboardingHint } from "./components/OnboardingHint";
import { RATE_PER_BYTE_AVAX } from "./hooks/useRelayStats";
import { useOllamaStatus } from "./hooks/useOllamaStatus";
import { NodeConfig } from "./components/NodeConfig";
import { NotificationToast } from "./components/NotificationToast";
import { ProviderDashboard } from "./components/ProviderDashboard";
import { TradingPostPanel } from "./components/TradingPostPanel";
import { QuestLogPanel } from "./components/QuestLogPanel";
import { ServiceCreator } from "./components/ServiceCreator";
import { WalletCabinet } from "./components/WalletCabinet";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { SmartEscrow } from "./components/SmartEscrow";
import { RedeemVoucher } from "./components/RedeemVoucher";
import { DealNotification } from "./components/DealNotification";
import { DelegationCenter } from "./components/DelegationCenter";

// Types
import { Peer, MeshEvent, ViewState, MatchResult, AssetListingView, TxResult, QueuedTx, ContentRecord } from "./types";

interface SharkNegotiation {
    user_price_ceiling: number;
    current_market_price: number;
    recommended_bid: number;
    strategy: string;
}

/** Real average AVAX price across currently active on-chain listings — used as the
 * market-price input for the local Shark Agent negotiation, instead of a fake number. */
async function getMarketPriceAvax(): Promise<number> {
    try {
        const listings = await invoke<AssetListingView[]>("get_active_asset_listings");
        if (listings.length === 0) return 0;
        const total = listings.reduce((sum, l) => sum + (parseFloat(l.price_avax) || 0), 0);
        return total / listings.length;
    } catch (e) {
        console.error("Failed to compute market price from listings:", e);
        return 0;
    }
}

function App() {
    const [intent, setIntent] = useState("");
    const [peers, setPeers] = useState<Peer[]>([]);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isProcessing, setIsProcessing] = useState(false);
    const aiReady = useOllamaStatus();
    const [showHint, setShowHint] = useState(() => localStorage.getItem("cabalmesh_seen_intent_hint") !== "1");
    const dismissHint = () => {
        localStorage.setItem("cabalmesh_seen_intent_hint", "1");
        setShowHint(false);
    };

    // UI State
    const [view, setView] = useState<ViewState>("nexus");
    const [showConfig, setShowConfig] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [notification, setNotification] = useState<string | null>(null);
    // Tracks whether this node currently has any of its own intents in flight, so the
    // mesh-event listener (registered once) can ignore its own broadcast echoing back.
    // A ref (not state) because the listener's closure would otherwise see a stale value.
    const isSenderRef = useRef(false);
    const activeSearchCountRef = useRef(0);
    const dismissedSearchesRef = useRef<Set<number>>(new Set());
    const nextSearchIdRef = useRef(0);
    const [searches, setSearches] = useState<SearchJob[]>([]);
    const [escrowId, setEscrowId] = useState<number | null>(null);
    const [isRelaying, setIsRelaying] = useState(false);
    const [priceCeiling, setPriceCeiling] = useState("1");
    const [dealItemLabel, setDealItemLabel] = useState("NFT #04");
    const [dealPriceLabel, setDealPriceLabel] = useState("13.5 AVAX");
    const [listingsRefreshKey, setListingsRefreshKey] = useState(0);
    const [dealNegotiation, setDealNegotiation] = useState<SharkNegotiation | null>(null);
    const [receivedIntentText, setReceivedIntentText] = useState("");
    const [dealSource, setDealSource] = useState<"arsenal" | "p2p">("p2p");

    // Content-delivery: which voucher tokenId + seller the currently open deal is
    // for, and any content that's arrived (verified) for it. Refs mirror the state
    // so the mesh-event listener (registered once) never sees a stale value.
    const [dealTokenId, setDealTokenId] = useState<number | null>(null);
    const dealTokenIdRef = useRef<number | null>(null);
    const dealSellerRef = useRef<string | null>(null);
    const [deliveredContent, setDeliveredContent] = useState<Record<number, ContentRecord>>({});

    // Own real wallet address — fetched once, used only for cosmetic class-icon framing
    // in SmartEscrow (which "class" avatar represents "you" in a deal).
    const [myAddress, setMyAddress] = useState<string | null>(null);
    useEffect(() => {
        invoke<{ address: string }[]>("get_identity").then((ids) => setMyAddress(ids[0]?.address ?? null)).catch(console.error);
    }, []);

    // Offline-mesh-relay: transactions signed locally (no RPC reachable) and queued
    // for whichever peer with real connectivity + Relay Mode on submits them.
    const [offlineQueue, setOfflineQueue] = useState<QueuedTx[]>([]);
    // A ref (not state) so the mesh-event listener's closure (registered once) always
    // sees the current Relay Mode toggle, instead of the value at mount time.
    const isRelayingRef = useRef(false);
    useEffect(() => { isRelayingRef.current = isRelaying; }, [isRelaying]);

    useEffect(() => {
        invoke<QueuedTx[]>("get_pending_relay_txs").then(setOfflineQueue).catch(console.error);
    }, []);

    const handleDismissOfflineItem = (id: string) => {
        setOfflineQueue((prev) => prev.filter((t) => t.id !== id));
    };

    useEffect(() => {
        const unlisten = listen<MeshEvent>("mesh-event", async (event) => {
            console.log("🔔 Mesh event received:", event.payload);
            const meshEvent = event.payload;

            if (meshEvent.type === "PeerDiscovered") {
                console.log("✅ PeerDiscovered event");
                setPeers((prev) => [...prev, {
                    id: meshEvent.peer_id || "",
                    address: meshEvent.address || "",
                    timestamp: Date.now(),
                }]);
            } else if (meshEvent.type === "IntentReceived") {
                console.log("✅ IntentReceived event detected!", meshEvent);
                console.log("🔍 isSender:", isSenderRef.current);

                // Only show deal notification if this node is NOT the sender
                if (!isSenderRef.current) {
                    console.log("📥 This node is the RECEIVER - showing deal notification");
                    const incomingText: string = meshEvent.intent?.payload || "";
                    setReceivedIntentText(incomingText);

                    setIsProcessing(true);
                    setLogs([]);
                    addLog(`→ Encrypted intent received from peer`);
                    addLog(`→ Consulting local Shark Agent (Ollama)...`);

                    try {
                        const marketPrice = await getMarketPriceAvax();
                        const ceiling = parseFloat(priceCeiling) || 1;
                        const negotiation = await invoke<SharkNegotiation>("negotiate_with_shark", {
                            intent: incomingText,
                            priceCeiling: ceiling,
                            marketPrice: marketPrice || ceiling,
                        });

                        addLog(`→ Shark Agent strategy: "${negotiation.strategy}"`);
                        addLog(`→ Recommended bid: ${negotiation.recommended_bid.toFixed(4)} AVAX`);

                        setDealNegotiation(negotiation);
                        setIsProcessing(false);
                        setLogs([]);
                        setNotification("📥 New deal opportunity!");
                        setView("notification");
                    } catch (e) {
                        console.error("Shark negotiation failed:", e);
                        addLog(`→ Negotiation failed: ${e}`);
                        setIsProcessing(false);
                    }
                } else {
                    console.log("📤 This node is the SENDER - ignoring own broadcast");
                }

            } else if (meshEvent.type === "DealAccepted") {
                console.log("✅ Deal accepted by peer!", meshEvent);
                setNotification("🤝 Deal accepted! Waiting for settlement...");

            } else if (meshEvent.type === "SettlementComplete") {
                console.log("✅ Settlement confirmation received!", meshEvent);
                setNotification("✅ Funds released! Transaction complete.");

            } else if (meshEvent.type === "RelayTxReceived") {
                const queueId = meshEvent.queue_id || "";
                const rawTxHex = meshEvent.raw_tx_hex || "";
                const summary = meshEvent.summary || "";
                console.log("📡 RelayTxReceived:", queueId, summary, "Relay Mode on?", isRelayingRef.current);

                if (!isRelayingRef.current || !rawTxHex) {
                    // Relay Mode is off on this node — leave it for another peer to pick up.
                    return;
                }

                try {
                    const txHash = await invoke<string>("submit_raw_transaction", { rawTxHex });
                    console.log("✅ Relayed transaction for peer:", queueId, txHash);
                    invoke("send_intent_to_mesh", {
                        payload: JSON.stringify({ type: "RelayConfirmed", queue_id: queueId, status: "confirmed", tx_hash: txHash }),
                    }).catch(console.error);

                    // Real, persisted credit for helping — reward is a deterministic estimate
                    // (bytes relayed × the same rate Relay Mode's own stats use), not an actual payout.
                    const rewardAvax = ((rawTxHex.replace(/^0x/, "").length / 2) * RATE_PER_BYTE_AVAX).toFixed(6);
                    invoke("record_relayed_tx", { summary, txHash, rewardAvax }).catch(console.error);
                } catch (e) {
                    console.error("Failed to relay transaction:", e);
                    invoke("send_intent_to_mesh", {
                        payload: JSON.stringify({ type: "RelayConfirmed", queue_id: queueId, status: "failed" }),
                    }).catch(console.error);
                }

            } else if (meshEvent.type === "RelayConfirmed") {
                const queueId = meshEvent.queue_id || "";
                const status = meshEvent.status || "failed";
                const txHash = meshEvent.tx_hash;
                console.log("📨 RelayConfirmed:", queueId, status, txHash);

                invoke("mark_relay_tx_status", { queueId, status, txHash: txHash ?? null }).catch(console.error);
                setOfflineQueue((prev) => prev.map((t) => (t.id === queueId ? { ...t, status: status as QueuedTx["status"], tx_hash: txHash ?? null } : t)));

            } else if (meshEvent.type === "ContentRequested") {
                const tokenId = meshEvent.token_id;
                if (tokenId == null) return;
                console.log("📨 ContentRequested for token", tokenId);
                try {
                    const content = await invoke<ContentRecord | null>("get_content", { tokenId });
                    if (content) {
                        invoke("send_intent_to_mesh", {
                            payload: JSON.stringify({
                                type: "ContentDelivery",
                                token_id: tokenId,
                                text: content.text,
                                signature: content.signature,
                                signer_address: content.signer_address,
                            }),
                        }).catch(console.error);
                    }
                } catch (e) {
                    console.error("Failed to look up content for delivery:", e);
                }

            } else if (meshEvent.type === "ContentDelivered") {
                const tokenId = meshEvent.token_id;
                const text = meshEvent.text || "";
                const signature = meshEvent.signature || "";
                const signerAddress = meshEvent.signer_address || "";
                if (tokenId == null || !text || tokenId !== dealTokenIdRef.current || !dealSellerRef.current) return;

                console.log("📬 ContentDelivered for token", tokenId, "verifying against seller", dealSellerRef.current);
                try {
                    const verified = await invoke<boolean>("receive_content", {
                        tokenId,
                        text,
                        signature,
                        expectedSeller: dealSellerRef.current,
                    });
                    if (verified) {
                        setDeliveredContent((prev) => ({
                            ...prev,
                            [tokenId]: { token_id: tokenId, text, fingerprint: "", signature, signer_address: signerAddress },
                        }));
                    } else {
                        console.error("Content delivery failed signature verification — rejected.");
                    }
                } catch (e) {
                    console.error("Failed to verify delivered content:", e);
                }

            } else {
                console.log("⚠️ Unknown mesh event type:", meshEvent.type);
            }
        });

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            unlisten.then((fn) => fn());
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    const addLog = (msg: string) => {
        setLogs(prev => [...prev, msg]);
    };

    const updateSearch = (id: number, patch: Partial<SearchJob>) => {
        setSearches(prev => prev.map(j => (j.id === id ? { ...j, ...patch } : j)));
    };

    /** Removes a search from view. For a still-scanning job this is a soft,
     * UI-only cancel — no funds are at risk yet (match_intent_to_listings
     * doesn't spend anything), so we just ignore its result when it resolves. */
    const handleDismissSearch = (id: number) => {
        dismissedSearchesRef.current.add(id);
        setSearches(prev => prev.filter(j => j.id !== id));
    };

    /** Fires one intent search as an independent, cancellable job — multiple
     * of these can be in flight at once, tracked in `searches`. */
    const runSearch = async (id: number, submittedIntent: string, ceiling: number) => {
        activeSearchCountRef.current += 1;
        isSenderRef.current = true;

        const finishSearch = () => {
            activeSearchCountRef.current = Math.max(0, activeSearchCountRef.current - 1);
            if (activeSearchCountRef.current === 0) {
                setTimeout(() => { isSenderRef.current = false; }, 500);
            }
        };

        invoke("send_intent_to_mesh", { payload: submittedIntent }).catch(console.error);

        if (ceiling <= 0) {
            if (!dismissedSearchesRef.current.has(id)) {
                updateSearch(id, { status: "error", message: "Set a max AVAX (≤ field) to enable AI matching." });
            }
            finishSearch();
            return;
        }

        try {
            const match = await invoke<MatchResult | null>("match_intent_to_listings", {
                intent: submittedIntent,
                priceCeiling: ceiling,
            });

            if (dismissedSearchesRef.current.has(id)) {
                finishSearch();
                return; // user dismissed it while it was scanning — no funds were spent
            }

            if (!match) {
                updateSearch(id, { status: "no-match", message: "No matching listing within your price ceiling." });
                finishSearch();
                return;
            }

            updateSearch(id, { status: "buying", message: `⚔️ Closing the deal on voucher #${match.token_id} — locking AVAX...` });

            const result = await invoke<TxResult>("buy_listing", {
                listingId: match.listing_id,
                priceAvax: match.price_avax,
            });

            if (result.kind === "confirmed") {
                updateSearch(id, { status: "matched", message: `Deal #${result.id} created — voucher + funds locked ✓` });
                setEscrowId(result.id);
                setDealSource("arsenal");
                setDealItemLabel(`🎫 #${match.token_id} — ${match.description}`);
                setDealPriceLabel(`${match.price_avax} AVAX`);
                setDealTokenId(match.token_id);
                dealTokenIdRef.current = match.token_id;
                dealSellerRef.current = match.seller;
                setDeliveredContent({});
                setView("escrow");

                // Ask whoever sold this voucher (if online) to deliver the real content.
                invoke("send_intent_to_mesh", {
                    payload: JSON.stringify({ type: "ContentRequest", token_id: match.token_id }),
                }).catch(console.error);

                setTimeout(() => {
                    setSearches(prev => prev.filter(j => j.id !== id));
                }, 1500);
            } else {
                // No network reachable — signed offline and queued for a mesh peer to relay.
                updateSearch(id, { status: "queued", message: `No network — signed offline, queued for relay` });
                setOfflineQueue((prev) => [...prev, {
                    id: result.queueId,
                    raw_tx_hex: "",
                    summary: `Buy: 🎫 #${match.token_id} — ${match.description} (${match.price_avax} AVAX)`,
                    created_at: new Date().toISOString(),
                    status: "queued",
                    tx_hash: null,
                }]);

                setTimeout(() => {
                    setSearches(prev => prev.filter(j => j.id !== id));
                }, 2500);
            }
        } catch (e) {
            console.error("AI matching / buy failed:", e);
            if (!dismissedSearchesRef.current.has(id)) {
                updateSearch(id, { status: "error", message: `Failed: ${e}` });
            }
        } finally {
            finishSearch();
        }
    };

    const handleIntentSubmit = () => {
        if (!intent.trim()) return;
        if (showHint) dismissHint();
        const submittedIntent = intent.trim();
        const ceiling = parseFloat(priceCeiling) || 0;
        setIntent(""); // clear immediately so another intent can be typed right away

        const id = ++nextSearchIdRef.current;
        setSearches(prev => [...prev, { id, intent: submittedIntent, status: "scanning", message: "Broadcasting to mesh + scanning Arsenal listings..." }]);
        runSearch(id, submittedIntent, ceiling);
    };

    const handleAcceptDeal = async () => {
        console.log("🤝 Accepting deal and broadcasting to sender...");
        const dealLabel = receivedIntentText || "Mesh intent";
        const dealPrice = dealNegotiation ? `${dealNegotiation.recommended_bid.toFixed(4)} AVAX` : "0.01 AVAX";

        // Broadcast deal acceptance to the sender
        invoke("send_intent_to_mesh", {
            payload: JSON.stringify({
                type: "DealAccepted",
                deal: dealLabel,
                price: dealPrice
            })
        }).then(() => {
            console.log("✅ Deal acceptance broadcasted!");
        }).catch(console.error);

        // Lock a small real Fuji-testnet amount in the on-chain Escrow contract.
        // Note: the mesh protocol doesn't yet exchange peers' on-chain addresses,
        // so this demo escrows to the buyer's own primary identity as payee. The
        // AI-negotiated price is shown for context but never used as the locked
        // amount, since we never trust the model directly on real fund amounts.
        try {
            const identities = await invoke<{ address: string }[]>("get_identity");
            const payee = identities[0]?.address;
            if (payee) {
                const result = await invoke<TxResult>("create_escrow", { payee, amountAvax: "0.01" });
                if (result.kind === "confirmed") {
                    console.log("✅ On-chain escrow created:", result.id);
                    setEscrowId(result.id);
                    setDealSource("p2p");
                    setDealItemLabel(dealLabel);
                    setDealPriceLabel("0.01 AVAX");
                    setView("escrow");
                } else {
                    console.log("📡 No network — escrow signed offline, queued for relay:", result.queueId);
                    setOfflineQueue((prev) => [...prev, {
                        id: result.queueId,
                        raw_tx_hex: "",
                        summary: `Escrow: ${dealLabel} (0.01 AVAX)`,
                        created_at: new Date().toISOString(),
                        status: "queued",
                        tx_hash: null,
                    }]);
                }
            }
        } catch (e) {
            console.error("Failed to create on-chain escrow:", e);
            setEscrowId(null);
            setView("escrow");
        }
    };

    const handleReleaseFunds = () => {
        console.log("💰 Releasing funds and broadcasting settlement...");
        // Hide logs/processing UI
        setIsProcessing(false);
        setLogs([]);

        // Broadcast settlement confirmation back to the sender
        invoke("send_intent_to_mesh", {
            payload: JSON.stringify({
                type: "SettlementComplete",
                deal: "Fox NFT #04",
                amount: "13.5 AVAX"
            })
        }).then(() => {
            console.log("✅ Settlement confirmation broadcasted!");
        }).catch(console.error);
    };

    const handleSwitchToProvider = () => setView("provider");
    const handleCreateService = () => setView("service-creator");
    const handleDeployService = (listingId: number) => {
        console.log("✅ On-chain listing created:", listingId);
        setListingsRefreshKey((k) => k + 1);
        setView("nexus");
    };

    return (
        <ErrorBoundary>
            <Nexus isOnline={isOnline} peerCount={peers.length} aiReady={aiReady} showConfig={() => setShowConfig(true)}>
                {/* Background mesh scene is always visible in Nexus mode */}
                <AmbientParticles />
                <RadiantHalo />
                <MeshCharacterField peers={peers} />

                {/* Main Menu Bar */}
                {view === "nexus" && (
                    <div className="absolute top-4 left-4 right-4 z-50 flex flex-wrap gap-2 items-start">
                        <MenuButton label="INVENTORY" onClick={() => setView("wallet-cabinet")} active={false} color="nobody-primary" />
                        <MenuButton label="CLAIM LOOT" onClick={() => setView("redeem")} active={false} color="nobody-gold" />
                        <div className="w-px self-stretch bg-slate-300/60 mx-1 hidden sm:block" />
                        <RelayerStatusCompact isRelaying={isRelaying} onToggle={setIsRelaying} peerCount={peers.length} />
                        <ActiveListingsCompact refreshKey={listingsRefreshKey} />
                        <WalletBalanceCompact />
                    </div>
                )}

                {/* Receiver-side processing (evaluating an incoming peer intent) */}
                <AgentLog visible={(logs.length > 0 || isProcessing) && view === "nexus"} logs={logs} />

                {/* Always-visible listings/deals — no need to open Arsenal Mode just to look */}
                {view === "nexus" && (
                    <TradingPostPanel refreshKey={listingsRefreshKey} onOpenArsenal={handleSwitchToProvider} onCreateListing={handleCreateService} />
                )}
                {view === "nexus" && (
                    <QuestLogPanel refreshKey={listingsRefreshKey} onOpenArsenal={handleSwitchToProvider} />
                )}

                {/* Sender-side queue of this node's own in-flight/finished intent searches */}
                {view === "nexus" && (
                    <SearchQueue jobs={searches} onDismiss={handleDismissSearch} />
                )}

                {/* Transactions signed offline, queued for a mesh peer with real connectivity to relay */}
                {view === "nexus" && (
                    <OfflineQueue items={offlineQueue} onDismiss={handleDismissOfflineItem} />
                )}

                {/* One-time onboarding hint for first-time users */}
                {view === "nexus" && (
                    <OnboardingHint visible={showHint} onDismiss={dismissHint} />
                )}

                {/* Main Command Input */}
                {view === "nexus" && (
                    <IntentComposer
                        intent={intent}
                        setIntent={setIntent}
                        priceCeiling={priceCeiling}
                        setPriceCeiling={setPriceCeiling}
                        onSubmit={handleIntentSubmit}
                        isProcessing={searches.some((j) => j.status === "scanning" || j.status === "buying")}
                    />
                )}

                {/* Overlays */}
                <NotificationToast
                    message={notification}
                    onClose={() => setNotification(null)}
                />

                <NodeConfig
                    visible={showConfig}
                    onClose={() => setShowConfig(false)}
                />

                {/* Provider Components */}
                {/* Provider Components */}
                <ProviderDashboard
                    visible={view === "provider"}
                    onClose={() => setView("nexus")}
                    isRelaying={isRelaying}
                    onToggleRelay={setIsRelaying}
                    refreshKey={listingsRefreshKey}
                    peerCount={peers.length}
                />

                {/* Wallet Integration */}
                <WalletCabinet
                    visible={view === "wallet-cabinet"}
                    onClose={() => setView("nexus")}
                    onOpenConfig={() => setShowConfig(true)}
                    onDelegate={() => setView("delegation")}
                    peerCount={peers.length}
                />

                {view === "service-creator" && (
                    <ServiceCreator
                        onClose={() => setView("nexus")}
                        onDeploy={handleDeployService}
                    />
                )}

                <SmartEscrow // Added SmartEscrow component
                    visible={view === "escrow"}
                    escrowId={escrowId}
                    dealSource={dealSource}
                    onClose={() => setView("nexus")}
                    onRelease={handleReleaseFunds}
                    itemLabel={dealItemLabel}
                    priceLabel={dealPriceLabel}
                    deliveredContent={dealTokenId != null ? deliveredContent[dealTokenId] : undefined}
                    buyerAddress={myAddress ?? undefined}
                    sellerAddress={dealSellerRef.current ?? undefined}
                />

                <DealNotification
                    visible={view === "notification"}
                    onClose={() => setView("nexus")}
                    onAccept={handleAcceptDeal}
                    intentText={receivedIntentText}
                    recommendedBid={dealNegotiation?.recommended_bid ?? 0}
                    marketPrice={dealNegotiation?.current_market_price ?? 0}
                    strategy={dealNegotiation?.strategy ?? ""}
                />

                <DelegationCenter
                    visible={view === "delegation"}
                    onComplete={() => setView("wallet-cabinet")}
                    onCancel={() => setView("wallet-cabinet")}
                />

                <RedeemVoucher
                    visible={view === "redeem"}
                    onClose={() => setView("nexus")}
                />
            </Nexus>
        </ErrorBoundary>
    );
}

// Helper Component for Menu Header
const MenuButton = ({ label, onClick, color }: { label: string, onClick: () => void, active: boolean, color: string }) => {
    // Determine color classes
    const colorClass = color === "nobody-primary" ? "text-nobody-primary border-nobody-primary/30 hover:bg-nobody-primary-soft" :
        color === "nobody-gold" ? "text-nobody-gold border-nobody-gold/30 hover:bg-nobody-gold-soft" :
            color === "yellow-500" ? "text-amber-600 border-amber-200 hover:bg-amber-50" :
                color === "purple-500" ? "text-nobody-gold border-nobody-gold/30 hover:bg-nobody-gold-soft" :
                    color === "green-500" ? "text-nobody-primary border-nobody-primary/30 hover:bg-nobody-primary-soft" :
                        "text-slate-500 hover:text-slate-900 border-slate-200 hover:border-slate-300";

    return (
        <button
            onClick={onClick}
            className={`text-[10px] font-pixel px-3 py-2 border transition-all tracking-wide bg-nobody-charcoal shadow-card pixel-corners-sm ${colorClass}`}
        >
            [{label}]
        </button>
    );
};

export default App;
