"use client";

import React, { createContext, useContext, useRef } from "react";
import { Task } from "@/models/task";

export interface HoveredColumnState {
    columnId: string | null;
    columnRight: number | null;
    topOffset: number | null;
    columnContentTop: number | null;
}

interface TaskContextProps {
    draggedTaskRef: React.RefObject<Task | null>;
    hoveredColumnState: React.RefObject<HoveredColumnState>;
    setHoveredColumn: (columnState: Partial<HoveredColumnState>) => void;
    subscribeHoveredColumn?: (callback: (columnState: HoveredColumnState) => void) => () => void;
    setDragDropColumn: (columnState: HoveredColumnState) => void;
    subscribeDragDropColumn?: (callback: (columnState: HoveredColumnState) => void) => () => void;
}

interface TaskContextProviderProps {
    children: React.ReactNode;
}

export const TaskContext = createContext<TaskContextProps | undefined>(undefined);

export function useTaskContext() {
    const context = useContext(TaskContext);
    if (!context) {
        throw new Error("useTaskContext must be used within TaskContextProvider");
    }
    return context;
}

export default function TaskContextProvider({ children }: TaskContextProviderProps) {
    const draggedTaskRef = useRef<Task | null>(null);

    // Hovered state ref
    const hoveredColumnState = useRef<HoveredColumnState>({
        columnId: null,
        columnRight: null,
        topOffset: null,
        columnContentTop: null,
    });

    // Hovered subscription
    const hoveredSubscribers = useRef<((state: HoveredColumnState) => void)[]>([]);
    const subscribeHoveredColumn = (callback: (state: HoveredColumnState) => void) => {
        hoveredSubscribers.current.push(callback);
        return () => {
            hoveredSubscribers.current = hoveredSubscribers.current.filter(cb => cb !== callback);
        };
    };

    const setHoveredColumn = (partialState: Partial<HoveredColumnState>) => {
        hoveredColumnState.current = {
            ...hoveredColumnState.current,
            ...partialState,
        };
        hoveredSubscribers.current.forEach(cb => cb(hoveredColumnState.current));
    };

    // Drag drop subscription
    const dragDropSubscribers = useRef<((state: HoveredColumnState) => void)[]>([]);
    const subscribeDragDropColumn = (callback: (state: HoveredColumnState) => void) => {
        dragDropSubscribers.current.push(callback);
        return () => {
            dragDropSubscribers.current = dragDropSubscribers.current.filter(cb => cb !== callback);
        };
    };

    const setDragDropColumn = (state: HoveredColumnState) => {
        dragDropSubscribers.current.forEach(cb => cb(state));
    };

    return (
        <TaskContext.Provider
            value={{
                draggedTaskRef,
                hoveredColumnState,
                setHoveredColumn,
                subscribeHoveredColumn,
                setDragDropColumn,
                subscribeDragDropColumn,
            }}
        >
            {children}
        </TaskContext.Provider>
    );
}
