import React from "react";
import { motion } from "framer-motion";

/**
 * A striped sunburst halo, inspired by devotional/mystical iconography —
 * decorative backdrop for the Nexus character scene.
 */
export const RadiantHalo: React.FC = () => {
    const rays = 24;

    return (
        <motion.div
            className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ width: 560, height: 560 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
        >
            <svg viewBox="0 0 560 560" className="w-full h-full opacity-[0.14]">
                {Array.from({ length: rays }).map((_, i) => {
                    const angle = (360 / rays) * i;
                    const isGold = i % 3 === 0;
                    return (
                        <rect
                            key={i}
                            x={278}
                            y={0}
                            width={isGold ? 10 : 5}
                            height={280}
                            fill={isGold ? "#b8860f" : "#26315e"}
                            transform={`rotate(${angle} 280 280)`}
                        />
                    );
                })}
            </svg>
        </motion.div>
    );
};

export default RadiantHalo;
