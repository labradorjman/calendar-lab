import { useEffect, useRef } from "react";
import styles from "./ContextMenu.module.scss";
import { MenuItem } from "@/types/menuType";

type ContextMenuProps = {
    x: number;
    y: number;
    items: MenuItem[];
    onClose: () => void;
};

export function ContextMenu({
    x,
    y,
    items,
    onClose,
}: ContextMenuProps) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
        if (!ref.current?.contains(e.target as Node)) {
            onClose();
        }
        };

        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };

        window.addEventListener("mousedown", handleClick);
        window.addEventListener("keydown", handleKey);

        return () => {
            window.removeEventListener("mousedown", handleClick);
            window.removeEventListener("keydown", handleKey);
        };
    }, [onClose]);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const rect = el.getBoundingClientRect();
        let newX = x;
        let newY = y;

        if (x + rect.width > window.innerWidth) {
            newX = window.innerWidth - rect.width - 8;
        }

        if (y + rect.height > window.innerHeight) {
            newY = window.innerHeight - rect.height - 8;
        }

        el.style.left = `${newX}px`;
        el.style.top = `${newY}px`;
    }, [x, y]);

    return (
        <div
            ref={ref}
            className={styles.menu}
            onMouseDown={(e) => e.stopPropagation()}
        >
            {items.map(item => (
            <button
                key={item.id}
                className={styles.item}
                onClick={() => {
                item.onSelect();
                onClose();
                }}
            >
                {item.label}
            </button>
            ))}
        </div>
    );
}
