"use client";

import { useTimer } from "@/timerContext";
import CalendarContextProvider from "@/context";
import { getNextDates } from "@/utils/days";

export default function CalendarProvider({ children }: { children: React.ReactNode }) {
    const { now } = useTimer();

    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    return (
        <CalendarContextProvider
            initialSelectedDate={today}
            initialDateRange={getNextDates(today, 5)}
        >
            {children}
        </CalendarContextProvider>
    );
}