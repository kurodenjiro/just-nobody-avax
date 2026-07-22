import React from "react";

interface StatusIndicatorProps {
    isOnline: boolean;
    peerCount: number;
    showConfig: () => void;
}

export const Nexus: React.FC<React.PropsWithChildren<StatusIndicatorProps>> = ({ children, isOnline, peerCount, showConfig }) => {
    return (
        <div className="h-screen w-screen bg-nobody-dark overflow-hidden flex flex-col relative font-sans text-slate-900 selection:bg-nobody-primary-soft selection:text-nobody-ink">
            <div className="absolute top-4 right-4 flex gap-2 z-30">
                <StatusItem
                    icon={isOnline ? "🟢" : "🔴"}
                    label={isOnline ? "ONLINE" : "OFFLINE"}
                    textColor={isOnline ? "text-nobody-primary" : "text-red-500"}
                />

                <StatusItem
                    icon="👥"
                    label={`${peerCount} PEERS`}
                />

                <button
                    onClick={showConfig}
                    className="h-8 bg-nobody-charcoal pixel-corners-sm px-4 border border-nobody-primary/30 text-slate-500 hover:text-nobody-primary hover:border-nobody-primary transition-all text-[10px] font-pixel tracking-wide"
                >
                    [CFG]
                </button>
            </div>

            {/* Main Content Area */}
            {children}
        </div>
    );
};

const StatusItem = ({ icon, label, textColor = "text-slate-500" }: { icon: string, label: string, textColor?: string }) => (
    <div className="h-8 flex items-center gap-2 bg-nobody-charcoal pixel-corners-sm px-3 border border-nobody-primary/20 min-w-[110px] justify-center">
        <span className="text-xs">{icon}</span>
        <span className={`text-[10px] font-pixel tracking-wide ${textColor}`}>
            {label}
        </span>
    </div>
);
