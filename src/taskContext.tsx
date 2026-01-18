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
    setDragDropColumn: (id: string | null) => void;
    subscribeDragDropColumn?: (callback: (id: string | null) => void) => () => void;
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

export default function TaskContextProvider({ children }: TaskContextProviderProps) {
    const draggedTaskRef = useRef<Task | null>(null);
    const hoveredColumnIdRef = useRef<string | null>(null);

    // Hovered subscription
    const hoveredSubcribers = useRef<((id: string | null) => void)[]>([]);
    const subscribeHoveredColumn = (callback: (id: string | null) => void) => {
        hoveredSubcribers.current.push(callback);

        return () => {
            hoveredSubcribers.current = hoveredSubcribers.current.filter(cb => cb !== callback);
        };
    };

    const setHoveredColumn = (id: string | null) => {
        hoveredColumnIdRef.current = id;
        hoveredSubcribers.current.forEach(cb => cb(id));
    };

    // Drag drop subscription
    const dragDropSubscribers = useRef<((id: string | null) => void)[]>([]);
    const subscribeDragDropColumn = (callback: (id: string | null) => void) => {
        dragDropSubscribers.current.push(callback);

        return () => {
            dragDropSubscribers.current = dragDropSubscribers.current.filter(cb => cb !== callback);
        };
    }

    const setDragDropColumn = (id: string | null) => {
        dragDropSubscribers.current.forEach(cb => cb(id));
    }

    return (
        <TaskContext.Provider value={{
            draggedTaskRef,
            hoveredColumnIdRef,
            setHoveredColumn,
            subscribeHoveredColumn,
            setDragDropColumn,
            subscribeDragDropColumn,

        }}>
            {children}
        </TaskContext.Provider>
    );
}
