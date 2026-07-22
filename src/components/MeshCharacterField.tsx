import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Peer } from "../types";
import { PixelKnight } from "./icons/PixelKnight";

interface MeshCharacterFieldProps {
    peers: Peer[];
}

const NODE_COLORS = [
    { text: "text-nobody-primary", bg: "bg-nobody-primary", glow: "rgba(57,255,143,0.55)" },
    { text: "text-nobody-gold", bg: "bg-nobody-gold", glow: "rgba(192,77,255,0.55)" },
    { text: "text-nobody-accent", bg: "bg-nobody-accent", glow: "rgba(255,63,164,0.55)" },
];

const peerPosition = (peer: Peer, index: number, total: number) => {
    const seed = peer.id.charCodeAt(0) % 360;
    const angle = (index * (360 / Math.max(total, 1))) + seed;
    const radius = 140 + (index % 3) * 70;
    const x = Math.cos((angle * Math.PI) / 180) * radius;
    const y = Math.sin((angle * Math.PI) / 180) * radius * 0.5 - 60;
    const distance = Math.sqrt(x * x + y * y);
    const lineAngle = (Math.atan2(y, x) * 180) / Math.PI;
    return { x, y, distance, lineAngle };
};

export const MeshCharacterField: React.FC<MeshCharacterFieldProps> = ({ peers }) => {
    return (
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
            {/* Perspective ground grid */}
            <div
                className="absolute left-0 right-0 bottom-[28%] h-[220px] opacity-20"
                style={{
                    backgroundImage:
                        "repeating-linear-gradient(90deg, rgba(57,255,143,0.5) 0px, rgba(57,255,143,0.5) 1px, transparent 1px, transparent 40px)," +
                        "repeating-linear-gradient(0deg, rgba(57,255,143,0.5) 0px, rgba(57,255,143,0.5) 1px, transparent 1px, transparent 40px)",
                    transform: "perspective(400px) rotateX(60deg)",
                    maskImage: "linear-gradient(to top, black, transparent)",
                }}
            />

            {/* Ground line / mesh horizon */}
            <div className="absolute left-[10%] right-[10%] bottom-[28%] h-px bg-nobody-primary/40" style={{ boxShadow: "0 0 12px rgba(57,255,143,0.4)" }} />

            {/* Central beacon (mesh hub) */}
            <motion.div
                className="absolute bottom-[28%] left-1/2 -translate-x-1/2 translate-y-1/2 z-10"
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
                <div className="w-2 h-2 bg-nobody-primary pixel-corners-sm" style={{ boxShadow: "0 0 16px rgba(57,255,143,0.7)" }} />
            </motion.div>

            {/* Tether lines from beacon to each peer */}
            {peers.map((peer, index) => {
                const { distance, lineAngle } = peerPosition(peer, index, peers.length);
                const color = NODE_COLORS[index % NODE_COLORS.length];
                return (
                    <motion.div
                        key={`tether-${peer.id}`}
                        className="absolute left-1/2 bottom-[28%] h-px origin-left"
                        style={{
                            width: distance,
                            transform: `rotate(${lineAngle}deg)`,
                            backgroundImage: `repeating-linear-gradient(to right, ${color.glow} 0 4px, transparent 4px 8px)`,
                        }}
                        initial={{ opacity: 0, scaleX: 0 }}
                        animate={{ opacity: 0.6, scaleX: 1 }}
                        transition={{ duration: 0.8 }}
                    />
                );
            })}

            {/* Peer nodes */}
            <AnimatePresence>
                {peers.map((peer, index) => {
                    const { x, y } = peerPosition(peer, index, peers.length);
                    const color = NODE_COLORS[index % NODE_COLORS.length];

                    return (
                        <motion.div
                            key={peer.id}
                            className="absolute left-1/2 bottom-[28%] z-10"
                            initial={{ scale: 0, opacity: 0, x, y }}
                            animate={{ scale: 1, opacity: 1, x, y }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 120 }}
                        >
                            <div className={`w-2.5 h-2.5 rotate-45 ${color.bg}`} style={{ boxShadow: `0 0 10px ${color.glow}` }} />
                            <div className={`absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-mono whitespace-nowrap ${color.text}`}>
                                NODE
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>

            {/* Roaming pixel character */}
            <motion.div
                className="absolute bottom-[28%] text-nobody-primary z-20"
                style={{ filter: "drop-shadow(0 0 10px rgba(57,255,143,0.6))" }}
                animate={{ x: [-180, 180, -180] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            >
                <div className="animate-walk">
                    <PixelKnight size={40} eyeColor="#04140a" />
                </div>
            </motion.div>
        </div>
    );
};

export default MeshCharacterField;
