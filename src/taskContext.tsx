"use client";

import React, { createContext, useContext, useRef } from "react";
import { Task } from "@/models/task";
import { TimeBlock } from "./models/timeBlock";

export interface TaskDragState {
    hoverId: string | null;
    taskTop: number | null;
    skeletonTop: number | null;
    skeletonHeight: number | null;
}

interface TaskContextProps {
    draggedTaskRef: React.RefObject<{ task: Task; timeBlock?: TimeBlock } | null>;
    taskDragState: React.RefObject<TaskDragState>;
    setTaskDragState: (taskDragState: Partial<TaskDragState>) => void;
    subscribeTaskDrag?: (callback: (taskDragState: TaskDragState) => void) => () => void;
    setTaskDropState: (taskDragState: TaskDragState) => void;
    subscribeDragDrop?: (callback: (taskDragState: TaskDragState) => void) => () => void;
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
    const draggedTaskRef = useRef<{ task: Task; timeBlock?: TimeBlock } | null>(null);

    // Hovered state ref
    const taskDragState = useRef<TaskDragState>({
        hoverId: null,
        taskTop: null,
            skeletonTop: null,
        skeletonHeight: null,
    });

    // Hovered subscription
    const hoveredSubscribers = useRef<((state: TaskDragState) => void)[]>([]);
    const subscribeTaskDrag = (callback: (state: TaskDragState) => void) => {
        hoveredSubscribers.current.push(callback);
        return () => {
            hoveredSubscribers.current = hoveredSubscribers.current.filter(cb => cb !== callback);
        };
    };

    const setTaskDragState = (partialState: Partial<TaskDragState>) => {
        taskDragState.current = {
            ...taskDragState.current,
            ...partialState,
        };
        hoveredSubscribers.current.forEach(cb => cb(taskDragState.current));
    };

    // Drag drop subscription
    const dragDropSubscribers = useRef<((state: TaskDragState) => void)[]>([]);
    const subscribeDragDrop = (callback: (state: TaskDragState) => void) => {
        dragDropSubscribers.current.push(callback);
        return () => {
            dragDropSubscribers.current = dragDropSubscribers.current.filter(cb => cb !== callback);
        };
    };

    const setTaskDropState = (state: TaskDragState) => {
        dragDropSubscribers.current.forEach(cb => cb(state));
    };

    return (
        <TaskContext.Provider
            value={{
                draggedTaskRef,
                taskDragState,
                setTaskDragState,
                subscribeTaskDrag,
                setTaskDropState,
                subscribeDragDrop,
            }}
        >
            {children}
        </TaskContext.Provider>
    );
}
