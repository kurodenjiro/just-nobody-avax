import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface SmartMeshChatProps {
    visible: boolean;
    onComplete: () => void;
    context?: any;
}

export const SmartMeshChat: React.FC<SmartMeshChatProps> = ({ visible, onComplete, context }) => {
    const [messages, setMessages] = useState<any[]>([]);

    useEffect(() => {
        if (visible) {
            // Determine scenario based on context
            // Default (Generic Intent)
            let initialMessages: any[] = [
                { id: 1, sender: 'User A', text: 'Hi B, can you send me the logo file?', type: 'text' },
                { id: 2, sender: 'User B', text: 'Sure, wait a sec.', type: 'text' }
            ];

            // Specific Scenarios
            if (context?.user === 'User_C') { // ESP32 Case
                initialMessages = [
                    { id: 1, sender: 'User A', text: 'Hi, I have standard ESP32-WROOM-32 modules available.', type: 'text' },
                    { id: 2, sender: 'User_C', text: 'great, how much for 10 units?', type: 'text' }
                ];
            } else if (context?.user === 'BEYOND_US NFT') { // NFT Case
                initialMessages = [
                    { id: 1, sender: 'User A', text: 'Love the new collection! Is #42 available?', type: 'text' },
                    { id: 2, sender: 'User_X', text: 'Yes, setting up an escrow swap now.', type: 'text' }
                ];
            }

            setMessages(initialMessages);

            // Simulate Flow
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    id: 3,
                    type: 'ai-separator',
                    text: '<<<< AI NODE MONITORING TRANSACTION >>>>'
                }]);
            }, 1000);

            setTimeout(() => {
                setMessages(prev => [...prev, {
                    id: 4,
                    sender: 'AI',
                    type: 'ai-msg',
                    text: context?.user === 'User_C'
                        ? 'Detected bulk component sale. Checking market rates... Median is 8 NEAR.'
                        : 'I detected a purchase intent. Escrow initialized for safety.'
                }]);
            }, 2500);

            setTimeout(() => {
                setMessages(prev => [...prev, {
                    id: 5,
                    type: 'widget',
                    data: {
                        item: context?.content || 'Logo_Design_v1.zip',
                        price: context?.fee || '50 $NEAR'
                    }
                }]);
            }, 4000);
        }
    }, [visible, context]);

    if (!visible) return null;

    return (
        <motion.div
            className="absolute inset-0 bg-nobody-dark z-40 flex flex-col font-mono"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Header */}
            <div className="h-10 border-b border-gray-800 flex items-center justify-between px-4 bg-black/40">
                <div className="text-xs text-nobody-mint font-bold tracking-wider">
                    [M] Mesh: 4ms | AI-Node: Active (x402)
                </div>
                <div className="flex gap-2">
                    <button onClick={onComplete} className="text-[10px] text-gray-500 hover:text-white mr-4">
                        [ END CHAT ]
                    </button>
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <div className="w-2 h-2 rounded-full bg-nobody-violet animate-pulse delay-75" />
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div key={msg.id} className="flex flex-col animate-fadeIn">

                        {msg.type === 'ai-separator' && (
                            <div className="flex items-center gap-2 my-4 text-nobody-violet text-[10px] font-bold justify-center opacity-80">
                                <div className="h-px w-10 bg-nobody-violet" />
                                {msg.text}
                                <div className="h-px w-10 bg-nobody-violet" />
                            </div>
                        )}

                        {msg.type === 'text' && (
                            <div className={`flex flex-col max-w-[70%] ${msg.sender === 'User A' ? 'self-end items-end' : 'self-start items-start'}`}>
                                <div className="text-[10px] text-gray-500 mb-1">
                                    {msg.sender === 'User A' ? 'You' : msg.sender}
                                </div>
                                <div className={`px-3 py-2 rounded ${msg.sender === 'User A' ? 'bg-nobody-violet/20 text-white border border-nobody-violet/30' : 'bg-gray-800 text-gray-300 border border-gray-700'}`}>
                                    {msg.text}
                                </div>
                            </div>
                        )}

                        {msg.type === 'ai-msg' && (
                            <div className="self-center w-[80%] bg-nobody-mint/5 border border-nobody-mint/20 rounded p-3 my-2 text-xs">
                                <strong className="text-nobody-mint">{'{ AI }: '}</strong>
                                <span className="text-gray-300">{msg.text}</span>
                            </div>
                        )}

                        {msg.type === 'widget' && (
                            <div className="self-center w-[80%] my-2">
                                <EscrowWidget data={msg.data} />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Input Area */}
            <div className="h-14 border-t border-gray-800 bg-black/60 flex items-center px-4 gap-3">
                <span className="text-gray-500">[ / ]</span>
                <input
                    type="text"
                    placeholder="Type AI mandate or chat..."
                    className="flex-1 bg-transparent outline-none text-sm text-white placeholder-gray-600 font-mono"
                />
            </div>
        </motion.div>
    );
};

const EscrowWidget = ({ data }: { data: any }) => (
    <div className="border border-gray-600 bg-nobody-charcoal rounded overflow-hidden">
        <div className="bg-gray-800 px-3 py-1 flex justify-between items-center border-b border-gray-600">
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Smart Escrow Widget</span>
        </div>
        <div className="p-4 space-y-2">
            <div className="flex justify-between text-xs text-gray-400">
                <span>Item:</span>
                <span className="text-white font-bold">{data.item}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
                <span>Price:</span>
                <span className="text-nobody-mint font-bold">{data.price}</span>
            </div>

            <div className="flex gap-2 mt-3 pt-2 border-t border-gray-700/50">
                <button className="flex-1 bg-nobody-mint/10 border border-nobody-mint/50 text-nobody-mint text-[10px] font-bold py-2 hover:bg-nobody-mint hover:text-black transition-colors uppercase">
                    [ USER A: DEPOSIT ]
                </button>
                <button className="flex-1 bg-gray-800 border border-gray-600 text-gray-400 text-[10px] font-bold py-2 hover:bg-gray-700 hover:text-white transition-colors uppercase">
                    [ USER B: SEND ]
                </button>
            </div>
        </div>
    </div>
);
