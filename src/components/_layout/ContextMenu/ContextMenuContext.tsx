"use client";

import {
    createContext,
    useContext,
    useState,
    ReactNode,
    useEffect,
} from "react";
import { MenuState } from "@/types/menuType";

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
    const [menu, setMenu] = useState<MenuState>(null);

    return (
        <ContextMenuContext.Provider
            value={{
                menu,
                openContextMenu: setMenu,
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
