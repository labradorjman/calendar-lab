"use client";

import type {  Dispatch, SetStateAction } from "react";
import React, {
    createContext,
    useContext,
    useState
} from "react";
import { Task } from "@/models/task";

interface CalendarContextProps {
    selectedDate: string;
    setSelectedDate: Dispatch<SetStateAction<string>>;

    dateRange: string[];
    setDateRange: Dispatch<SetStateAction<string[]>>;

    isTaskModalOpen: boolean;
    modalTask: Partial<Task> | null;
    openTaskModal: (task?: Partial<Task>) => void;
    closeTaskModal: () => void;
}

interface CalendarContextProviderProps {
    children: React.ReactNode;
    initialSelectedDate: string;
    initialDateRange: string[];
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
    const [selectedDate, setSelectedDate] = useState<string>(initialSelectedDate);
    const [dateRange, setDateRange] = useState<string[]>(initialDateRange);

    const [modalTask, setModalTask] =
        useState<Partial<Task> | null>(null);

    const openTaskModal = (task?: Partial<Task>) => {
        setModalTask(task ?? {});
    };

    const closeTaskModal = () => {
        setModalTask(null);
    };

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
        }}>
            {children}
        </CalendarContext.Provider>
    );
}