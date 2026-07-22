import React from "react";
import { motion } from "framer-motion";

interface IntentComposerProps {
    intent: string;
    setIntent: (val: string) => void;
    onSubmit: () => void;
    isProcessing: boolean;
}

export const IntentComposer: React.FC<IntentComposerProps> = ({ intent, setIntent, onSubmit, isProcessing }) => {
    return (
        <div className="absolute top-[65%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] z-20 flex flex-col items-center gap-6">
            <div className={`w-full relative bg-nobody-charcoal border transition-all duration-300 shadow-card-lg pixel-corners ${isProcessing ? 'border-nobody-primary' : 'border-nobody-gold/40'} p-1.5`}>

                {/* Processing Spinner */}
                {isProcessing && (
                    <div className="absolute -top-3 -right-3 w-6 h-6 bg-nobody-charcoal border border-nobody-primary pixel-corners-sm flex items-center justify-center z-10 animate-spin shadow-card">
                        <div className="w-2 h-2 bg-nobody-primary" />
                    </div>
                )}

                <input
                    type="text"
                    value={intent}
                    onChange={(e) => setIntent(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            console.log("Enter Key Pressed");
                            onSubmit();
                        }
                    }}
                    placeholder="> describe your intent_"
                    className="w-full bg-slate-50 text-nobody-primary p-4 outline-none text-sm placeholder-slate-500 focus:bg-nobody-charcoal transition-colors pr-24 font-mono"
                    disabled={isProcessing}
                />

                {/* Enter Badge / Submit Button */}
                <button
                    onClick={() => {
                        console.log("Submit Button Clicked");
                        onSubmit();
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-pixel text-slate-500 hover:text-nobody-primary border border-slate-300 hover:border-nobody-primary bg-nobody-charcoal px-2.5 py-1.5 pixel-corners-sm transition-all"
                >
                    [ENT]
                </button>

                {/* Highlight effect for 'Shark Mode' */}
                {intent.toLowerCase().includes("shark mode") && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute right-28 top-1/2 -translate-y-1/2 text-[10px] font-pixel text-nobody-accent bg-nobody-accent-soft px-2 py-1.5 pixel-corners-sm"
                    >
                        SHARK
                    </motion.div>
                )}
            </div>

            {/* Instruction / Help Text */}
            <div className="mt-2 text-center text-slate-400 text-[10px] font-pixel tracking-wide">
                PROTECTED BY CABALMESH PROTOCOL v1.0
            </div>
        </div>
    );
};
