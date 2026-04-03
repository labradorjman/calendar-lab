"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { isEqual } from "lodash";
import { Task } from "@/models/task";
import { WorkSession } from "./models/workSession";
import { TimeBlock } from "./models/timeBlock";

type WorkSessionState = {
    workSession: WorkSession | null;
    timeBlock: TimeBlock | null;
    tasks: Task[];
}

type HistoryAction =
    | { type: 'SESSION_NAME'; value: string }
    | { type: 'TASK_NAME'; taskId: number; value: string }
    | { type: 'TASK_DELETE'; taskId: number }
    | { type: 'TASK_REORDER'; tasks: Task[] }

const applyAction = (state: WorkSessionState, action: HistoryAction): WorkSessionState => {
    switch (action.type) {
        case 'SESSION_NAME':
        if (!state.workSession) return state;
            return { ...state, workSession: { ...state.workSession, name: action.value } };
        case 'TASK_NAME':
            return { ...state, tasks: state.tasks.map(t => t.id === action.taskId ? { ...t, name: action.value } : t) };
        case 'TASK_DELETE':
            return { ...state, tasks: state.tasks.filter(t => t.id !== action.taskId) };
        case 'TASK_REORDER':
            return { ...state, tasks: action.tasks };
    }
};

type WorkSessionContextProps = {
    workSession: WorkSession | null;
    timeBlock: TimeBlock | null;
    tasks: Task[];
    savedSnapshot: WorkSessionState;
    push: (action: HistoryAction) => void;
    revert: () => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    isDirty: boolean;
    markSaved: () => void;
    isSelected: boolean;
    select: (initial: WorkSessionState) => void;
    deselect: () => void;
}

const WorkSessionContext = createContext<WorkSessionContextProps | undefined>(undefined);

export function useWorkSessionContext() {
    const context = useContext(WorkSessionContext);
    if (!context) throw new Error("useWorkSessionContext must be used within WorkSessionContextProvider");
    return context;
}
const EMPTY: WorkSessionState = {
    workSession: null,
    timeBlock: null,
    tasks: [],
};

export default function WorkSessionContextProvider({ children }: { children: React.ReactNode }) {
    const [selected, setSelected] = useState<WorkSessionState | null>(null);
    const [stack, setStack] = useState<WorkSessionState[]>([EMPTY]);
    const [cursor, setCursor] = useState(0);
    const [savedSnapshot, setSavedSnapshot] = useState<WorkSessionState>(EMPTY);

    const select = useCallback((initial: WorkSessionState) => {
        setSelected(prev => {
            // Same session — preserve history
            if (prev?.workSession?.id === initial.workSession?.id) return prev;

            // New session — reset stack
            setStack([initial]);
            setCursor(0);
            setSavedSnapshot(initial);
            return initial;
        });
    }, []);

    const deselect = useCallback(() => {
        setSelected(null);
        setStack([EMPTY]);
        setCursor(0);
        setSavedSnapshot(EMPTY);
    }, []);

    const current = stack[cursor];

    const push = useCallback((action: HistoryAction) => {
        setStack(prev => {
            const next = applyAction(prev[cursor], action);
            return [...prev.slice(0, cursor + 1), next];
        });
        setCursor(prev => prev + 1);
    }, [cursor]);

    const revert = useCallback(() => {
        setStack([savedSnapshot]);
        setCursor(0);
    }, [savedSnapshot]);

    const undo = useCallback(() => setCursor(p => Math.max(0, p - 1)), []);
    const redo = useCallback(() => setCursor(p => Math.min(stack.length - 1, p + 1)), [stack.length]);
    const isDirty = useMemo(() => !isEqual(current, savedSnapshot), [current, savedSnapshot]);
    const markSaved = useCallback(() => {
        const snapshot = stack[cursor];
        setSavedSnapshot(snapshot);
    }, [stack, cursor]);

    return (
        <WorkSessionContext.Provider value={{
            workSession: current.workSession,
            timeBlock: current.timeBlock,
            tasks: current.tasks,
            savedSnapshot,
            push,
            revert,
            undo,
            redo,
            canUndo: cursor > 0,
            canRedo: cursor < stack.length - 1,
            isDirty,
            markSaved,
            isSelected: selected !== null,
            select,
            deselect,
        }}>
            {children}
        </WorkSessionContext.Provider>
    );
}