"use client";

import { ContextMenu } from ".";
import { useContextMenu } from "./ContextMenuContext";

export function ContextMenuRenderer() {
    const { menu, closeContextMenu } = useContextMenu();

    if (!menu) return null;

    return (
        <ContextMenu
            x={menu.x}
            y={menu.y}
            items={menu.items}
            onClose={closeContextMenu}
        />
    );
}
