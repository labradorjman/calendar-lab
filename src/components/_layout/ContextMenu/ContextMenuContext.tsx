"use client";

import {
    createContext,
    useContext,
    useState,
    ReactNode,
} from "react";
import { MenuState } from "@/types/menuType";
import { useTaskContext } from "@/taskContext";

type ContextMenuContextValue = {
    menu: MenuState;
    openContextMenu: (menu: MenuState) => void;
    closeContextMenu: () => void;
};

const ContextMenuContext = createContext<ContextMenuContextValue | null>(null);

export function ContextMenuProvider({
    children,
}: {
    children: ReactNode;
}) {
    const taskContext = useTaskContext();
    const [menu, setMenu] = useState<MenuState>(null);

    const openContextMenu = (menu: MenuState) => {
        if (taskContext.draggedTaskRef.current) return;

        setMenu(menu);
    };

    return (
        <ContextMenuContext.Provider
            value={{
                menu,
                openContextMenu,
                closeContextMenu: () => setMenu(null),
            }}
        >
            {children}
        </ContextMenuContext.Provider>
    );
}

export function useContextMenu() {
    const ctx = useContext(ContextMenuContext);
    if (!ctx) {
        throw new Error(
            "useContextMenu must be used within ContextMenuProvider"
        );
    }
    return ctx;
}
