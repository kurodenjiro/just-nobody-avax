import React from "react";
import { PixelKnight } from "./PixelKnight";
import { CharacterClass, CLASS_COLOR_CLASS, addressClass } from "../../lib/rpgFlavor";

interface PixelClassIconProps {
    /** Either pass a real address to derive the class deterministically, or
     * pass an explicit class directly. */
    address?: string;
    characterClass?: CharacterClass;
    size?: number;
    className?: string;
}

/** Reuses the existing PixelKnight silhouette, recolored per class — same
 * proven pixel art, distinct identity cue per real counterparty address. */
export const PixelClassIcon: React.FC<PixelClassIconProps> = ({ address, characterClass, size = 20, className = "" }) => {
    const cls = characterClass ?? (address ? addressClass(address) : "knight");
    return <PixelKnight size={size} className={`${CLASS_COLOR_CLASS[cls]} ${className}`} />;
};

export default PixelClassIcon;
