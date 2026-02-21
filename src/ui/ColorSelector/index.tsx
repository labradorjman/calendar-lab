"use client";

import Input from "@/ui/Input";
import styles from "./ColorSelector.module.scss";
import { HexColorPicker } from "react-colorful";
import { useEffect, useRef, useState } from "react";
import { useSmartFloating } from "@/hooks/useSmartFloating";

interface ColorSelectorProps {
    color: string;
    onColorChange: (newColor: string) => void;
}

export default function ColorSelector({ color, onColorChange }: ColorSelectorProps) {
    const [showPicker, setShowPicker] = useState<boolean>(false);

    const { x, y, strategy, reference, floating } = useSmartFloating();
    const referenceNode = useRef<HTMLElement | null>(null);
    const floatingNode = useRef<HTMLElement | null>(null);

    const setReference = (node: HTMLElement | null) => {
        referenceNode.current = node;
        reference(node);
    };

    const setFloating = (node: HTMLElement | null) => {
        floatingNode.current = node;
        floating(node);
    };

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            const target = e.target as Node;

            if (
                referenceNode.current && 
                !referenceNode.current.contains(target) &&
                floatingNode.current &&
                !floatingNode.current.contains(target)
            ) {
                setShowPicker(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    function isValidHexColor(value: string): boolean {
        return /^#([0-9A-F]{3}){1,2}$/i.test(value);
    }

    return (
        <div
            ref={setReference}
            className={styles.color_selector}
        >
            <Input
                value={color}
                onChange={(e) => {
                    const hex = e.target.value;
                    if (isValidHexColor(hex)) {
                        onColorChange(hex);
                    }
                }}
            />
            <div className={styles.preview_area}>
                <span
                    className={styles.preview}
                    onClick={() => setShowPicker((prev) => !prev)}
                    style={{ 
                        width: "16px",
                        height: "16px",
                        border: "1px solid white",
                        borderRadius: "var(--gap_xsmall)",
                        cursor: "pointer",
                        backgroundColor: `${color}`,
                    }}
                />
            </div>
            {showPicker && (
                <div
                    ref={setFloating}
                    style={{
                        position: strategy,
                        top: y ?? 0,
                        left: x ?? 0,
                        zIndex: 9999,
                    }}
                >
                    <HexColorPicker
                        color={color}
                        onChange={onColorChange}
                    />
                </div>
            )}
        </div>
    );
}