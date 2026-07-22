import React from "react";

interface PixelKnightProps {
    size?: number;
    className?: string;
    color?: string;
    eyeColor?: string;
}

/**
 * A blocky 16x16-grid pixel-art hooded rider silhouette — the mesh's
 * roaming "cabal" avatar. Built from flat rects (no curves) to read as
 * true pixel art at small sizes.
 */
export const PixelKnight: React.FC<PixelKnightProps> = ({ size = 32, className = "", color = "currentColor", eyeColor = "#04140a" }) => {
    return (
        <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges" className={className}>
            {/* hood tip */}
            <rect x={7} y={1} width={2} height={1} fill={color} />
            <rect x={6} y={2} width={4} height={1} fill={color} />
            {/* head */}
            <rect x={5} y={3} width={6} height={3} fill={color} />
            <rect x={6} y={5} width={1} height={1} fill={eyeColor} />
            <rect x={9} y={5} width={1} height={1} fill={eyeColor} />
            {/* shoulders / cloak */}
            <rect x={4} y={6} width={8} height={2} fill={color} />
            <rect x={3} y={8} width={10} height={3} fill={color} />
            {/* cloak hem */}
            <rect x={3} y={11} width={3} height={1} fill={color} />
            <rect x={7} y={11} width={2} height={1} fill={color} />
            <rect x={10} y={11} width={3} height={1} fill={color} />
            {/* legs */}
            <rect x={5} y={12} width={2} height={3} fill={color} />
            <rect x={9} y={12} width={2} height={3} fill={color} />
        </svg>
    );
};

export default PixelKnight;
