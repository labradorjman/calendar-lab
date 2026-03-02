"use client";

import type {  Dispatch, SetStateAction } from "react";
import React, {
    createContext,
    useContext,
    useState
} from "react";
import { Task } from "@/models/task";
import { WorkSession } from "./models/workSession";
import { TimeBlock } from "./models/timeBlock";

type TaskModalState =
    | {
        mode: "create";
        task?: Partial<Omit<Task, "id">>;
        startsAt?: string;
        duration?: number;
    }
    | {
        mode: "edit";
        task: Task;
        timeBlock?: TimeBlock;
    };
    
type WorkSessionModalState =
    | {
        mode: "create";
        workSession?: Partial<Omit<WorkSession, "id">>;
        startsAt?: string;
        duration?: number;
    }
    | {
        mode: "edit";
        workSession: WorkSession;
        timeBlock?: TimeBlock;
    }; {
};

interface CalendarContextProps {
    selectedDate: Date;
    setSelectedDate: Dispatch<SetStateAction<Date>>;

    dateRange: Date[];
    setDateRange: Dispatch<SetStateAction<Date[]>>;

    isTaskModalOpen: boolean;
    modalTask: TaskModalState | null;
    openTaskModal: (initialState?: TaskModalState) => void;
    closeTaskModal: () => void;

    isWorkSessionModalOpen: boolean;
    modalWorkSession: WorkSessionModalState | null;
    openWorkSessionModal: (initialState?: WorkSessionModalState) => void;
    closeWorkSessionModal: () => void;
}

interface CalendarContextProviderProps {
    children: React.ReactNode;
    initialSelectedDate: Date;
    initialDateRange: Date[];
}

export const CalendarContext =
    createContext<CalendarContextProps | undefined>(undefined);

export function useCalendarContext() {
    const context = useContext(CalendarContext);

    if (!context) {
        throw new Error(
            "useCalendarContext must be used within CalendarContextProvider"
        );
    }

    return context;
}

export default function CalendarContextProvider({
    children,
    initialSelectedDate,
    initialDateRange,
}: CalendarContextProviderProps) {
    const [selectedDate, setSelectedDate] = useState<Date>(initialSelectedDate);
    const [dateRange, setDateRange] = useState<Date[]>(initialDateRange);

    // Task modal
    const [modalTask, setModalTask] =
        useState<TaskModalState | null>(null);

    const openTaskModal = (initialState?: TaskModalState) => {
        setModalTask({
            mode: "create",
            ...initialState,
        });
    };

    const closeTaskModal = () => {
        setModalTask(null);
    };

    const [modalWorkSession, setModalWorkSession] =
        useState<WorkSessionModalState | null>(null);

    const openWorkSessionModal = (initialState?: WorkSessionModalState) => {
        setModalWorkSession({
            mode: "create",
            ...initialState,
        });
    };

    const closeWorkSessionModal = () => {
        setModalWorkSession(null);
    }

    return (
        <CalendarContext.Provider value={{
            selectedDate,
            setSelectedDate,
            dateRange,
            setDateRange,
            modalTask,
            isTaskModalOpen: modalTask !== null,
            openTaskModal,
            closeTaskModal,
            modalWorkSession,
            isWorkSessionModalOpen: modalWorkSession !== null,
            openWorkSessionModal,
            closeWorkSessionModal,
        }}>
            {children}
        </CalendarContext.Provider>
    );
}