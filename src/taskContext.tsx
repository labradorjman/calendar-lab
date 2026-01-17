"use client";

import React, {
    createContext,
    useContext,
    useRef,
} from "react";
import { Task } from "@/models/task";

interface TaskContextProps {
    draggedTaskRef: React.RefObject<Task | null>;
    hoveredColumnIdRef: React.RefObject<string | null>;
    setHoveredColumn: (id: string | null) => void;
    subscribeHoveredColumn?: (callback: (id: string | null) => void) => () => void;
}

interface TaskContextProviderProps {
    children: React.ReactNode;
}

export const TaskContext =
    createContext<TaskContextProps | undefined>(undefined);

export function useTaskContext() {
    const context = useContext(TaskContext);

        if (!context) {
        throw new Error(
            "useTaskContext must be used within TaskContextProvider"
        );
    }

    return context;
}

export default function TaskContextProvider({ children }: { children: React.ReactNode }) {
    const draggedTaskRef = useRef<Task | null>(null);
    const hoveredColumnIdRef = useRef<string | null>(null);

    const subscribers = useRef<((id: string | null) => void)[]>([]);

    const subscribeHoveredColumn = (callback: (id: string | null) => void) => {
        subscribers.current.push(callback);

        // Return a proper unsubscribe function
        return () => {
            subscribers.current = subscribers.current.filter(cb => cb !== callback);
        };
    };

    const setHoveredColumn = (id: string | null) => {
        hoveredColumnIdRef.current = id;
        subscribers.current.forEach(cb => cb(id));
    };

    return (
        <TaskContext.Provider value={{
            draggedTaskRef,
            hoveredColumnIdRef,
            subscribeHoveredColumn,
            setHoveredColumn
        }}>
            {children}
        </TaskContext.Provider>
    );
}
