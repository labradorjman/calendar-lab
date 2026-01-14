"use client";

import { createContext, useContext, useMemo } from "react";
import { ScrollSyncManager } from "@/scrollSync/ScrollSyncManager";

interface ScrollSyncProviderProps {
    children: React.ReactNode;
}

export const ScrollSyncContext =
    createContext<ScrollSyncManager | null>(null);

export function useScrollSyncContext() {
    const context = useContext(ScrollSyncContext);

    if (!context) {
        throw new Error("useScrollSync must be used inside ScrollSyncProvider");
    }

    return context;
}

export default function ScrollSyncContextProvider({ children }: ScrollSyncProviderProps) {
    const manager = useMemo(() => new ScrollSyncManager(), []);

    return (
        <ScrollSyncContext.Provider value={manager}>
            {children}
        </ScrollSyncContext.Provider>
    );
}
