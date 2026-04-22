"use client";

import React, { createContext, useContext, useEffect, useRef } from "react";
import { Task } from "@/models/task";
import { TimeBlock } from "@/models/timeBlock";
import { formatDuration } from "@/utils/time";

export interface TaskDragState {
    hoverId: string | null;
    taskTop: number | null;
    skeletonTop: number | null;
    skeletonHeight: number | null;
}

export interface DragPlaceholderControls {
    show: (options: { left: number; top: number; width: number; height: number; bgColor: string }) => void;
    move: (top: number, left: number) => void;
    update: (options: { timeDisplay?: string; bgColor?: string }) => void;
    hide: () => void;
}

interface TaskContextProps {
    draggedTaskRef: React.RefObject<{ task: Task; timeBlock?: TimeBlock } | null>;
    taskDragState: React.RefObject<TaskDragState>;
    setTaskDragState: (taskDragState: Partial<TaskDragState>) => void;
    subscribeTaskDrag?: (callback: (taskDragState: TaskDragState) => void) => () => void;
    setTaskDropState: (taskDragState: TaskDragState) => void;
    subscribeDragDrop?: (callback: (taskDragState: TaskDragState) => void) => () => void;
    placeholder: DragPlaceholderControls;
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

    const taskDragState = useRef<TaskDragState>({
        hoverId: null,
        taskTop: null,
        skeletonTop: null,
        skeletonHeight: null,
    });

    // Global placeholder element in <body>
    const placeholderElRef = useRef<HTMLDivElement | null>(null);

    // Default values
    useEffect(() => {
        const el = document.createElement("div");

        el.style.cssText = `
            position: fixed;
            z-index: 9999;
            pointer-events: none;
            display: none;
            border-radius: 4px;
            opacity: 0.85;
        `;

        document.body.appendChild(el);
        placeholderElRef.current = el;

        return () => el.remove();
    }, []);

    const placeholder = useRef<DragPlaceholderControls>({
        show({ left, top, width, height, bgColor }) {
            const el = placeholderElRef.current;
            if (!el) return;

            const task = draggedTaskRef.current?.task;
            const timeBlock = draggedTaskRef.current?.timeBlock;
            const name = task?.name ?? "";
            const durationDisplay = timeBlock?.duration
                ? formatDuration(timeBlock.duration)
                : "";

            // Container styles
            el.style.cssText = `
                position: fixed;
                z-index: 9999;
                pointer-events: none;
                left: ${left}px;
                top: ${top}px;
                width: ${width}px;
                height: ${height}px;
                background-color: ${bgColor};
                padding: var(--gap_xsmall);
                border-radius: var(--gap_xsmall);
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                gap: var(--gap_xsmall);
                opacity: 0.85;
            `;

            // Build child structure once — update() mutates these directly
            el.innerHTML = `
                <span class="ph-name" style="
                    height: 20px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    color: #fff;
                ">${name}</span>
                <span class="ph-time" style="
                    color: color-mix(in srgb, #fff 75%, ${bgColor});
                    max-height: 20px;
                    font-size: var(--font_medium);
                "></span>
                <span class="ph-duration" style="
                    color: color-mix(in srgb, #fff 75%, ${bgColor});
                    font-family: 'Satoshi-Regular', sans-serif;
                    font-size: var(--font_medium);
                    margin-top: auto;
                    display: none;
                ">${durationDisplay}</span>
            `;
        },

        move(top, left) {
            const el = placeholderElRef.current;
            if (!el) return;

            el.style.top = `${top}px`;
            el.style.left = `${left}px`;
        },

        update({ timeDisplay }) {
            const el = placeholderElRef.current;
            if (!el) return;

            if (timeDisplay !== undefined) {
                const timeEl = el.querySelector<HTMLElement>(".ph-time");
                if (timeEl) timeEl.textContent = timeDisplay;
            }
        },

        hide() {
            if (placeholderElRef.current) {
                placeholderElRef.current.style.display = "none";
            }
        },
    });

    // Hovered subscription
    const hoveredSubscribers = useRef<Set<(state: TaskDragState) => void>>(new Set());

    const subscribeTaskDrag = (callback: (state: TaskDragState) => void) => {
        hoveredSubscribers.current.add(callback);
        return () => hoveredSubscribers.current.delete(callback);
    };

    const setTaskDragState = (partialState: Partial<TaskDragState>) => {
        taskDragState.current = {
            ...taskDragState.current,
            ...partialState,
        };
        hoveredSubscribers.current.forEach(cb => cb(taskDragState.current));
    };

    // Drag drop subscription
    const dragDropSubscribers = useRef<Set<(state: TaskDragState) => void>>(new Set());

    const subscribeDragDrop = (callback: (state: TaskDragState) => void) => {
        dragDropSubscribers.current.add(callback);
        return () => dragDropSubscribers.current.delete(callback);
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
                placeholder: placeholder.current,
            }}
        >
            {children}
        </TaskContext.Provider>
    );
}