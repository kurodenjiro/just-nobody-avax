import React from "react";

interface StatusIndicatorProps {
    isOnline: boolean;
    peerCount: number;
    showConfig: () => void;
}

export const Nexus: React.FC<React.PropsWithChildren<StatusIndicatorProps>> = ({ children, showConfig }) => {
    return (
        <div className="h-screen w-screen bg-nobody-dark overflow-hidden flex flex-col relative font-sans selection:bg-nobody-violet selection:text-white">
            {/* Status Bar Title Removed (Moved to Composer) */}

            <div className="absolute top-4 right-4 flex gap-2 z-30">
                <StatusItem
                    icon="⚡"
                    label="4ms"
                />

                <StatusItem
                    icon="🌐"
                    label="Node: Alpha-7"
                />

                <StatusItem
                    icon="👤"
                    label="98% Rep"
                    textColor="text-nobody-mint"
                />

                <button
                    onClick={showConfig}
                    className="h-8 bg-black/40 px-4 rounded border border-gray-800 text-gray-400 hover:text-white hover:border-gray-600 transition-all text-[10px] font-mono uppercase tracking-wider backdrop-blur-sm"
                >
                    [ Config ]
                </button>
            </div>

            {/* Main Content Area */}
            {children}
        </div>
    );
};

const StatusItem = ({ icon, label, textColor = "text-gray-300" }: { icon: string, label: string, textColor?: string }) => (
    <div className="h-8 flex items-center gap-2 bg-black/40 px-3 rounded border border-gray-800 backdrop-blur-sm min-w-[100px] justify-center">
        <span className="text-[10px]">{icon}</span>
        <span className={`text-[10px] uppercase font-mono tracking-wider ${textColor}`}>
            {label}
        </span>
    </div>
);
