"use client";

import styles from "./AppCalendar.module.scss";

import { useEffect, useState } from "react";
import { shiftMonth } from "@/utils/month";
import { useCalendarContext } from "@/context";
import { getMonthName } from "@/constants/calendar";
import Button from "@/components/ui/Button";
import CalendarGrid from "@/components/ui/CalendarGrid";
import { getYearMonthDay } from "@/utils/date";
import { useTimer } from "@/timerContext";
import { unixToPostgresTimestamptz } from "@/utils/time";

interface YearMonthState {
    year: number;
    month: number;
}

export default function AppCalendar() {
    const calendarContext = useCalendarContext();
    const { now, onMinuteTick } = useTimer();

    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    const [yearMonth, setYearMonth] = useState<YearMonthState>({
        year: today.getFullYear(),
        month: today.getMonth() + 1,
    });

    useEffect(() => {
        return onMinuteTick(unixSeconds => {
            
        });
    }, [onMinuteTick]);

    function handleDateSelect(date: Date) {
        if(date === calendarContext.selectedDate) return;

        console.log("handle date select app calendar");
        const { year, month } = getYearMonthDay(date);
        setYearMonth(prev => {
            if (prev.year === year && prev.month === month) {
                return prev;
            }

            return {
                ...prev,
                year,
                month,
            };
        });
    }

    return (
        <div className={styles.app_calendar}>
            <div className={styles.header}>
                <div className={styles.title}>
                    <span className={styles.month}>{getMonthName(yearMonth.month)}</span>
                    <span>{yearMonth.year}</span>
                </div>
                <div className={styles.pagination}>
                    <Button
                        element="button"
                        size="min"
                        onClick={() => {
                            const { year, month } = shiftMonth(yearMonth.year, yearMonth.month, -1);
                            setYearMonth(() => ({ year, month }));
                        }}
                    >
                        {"<"}
                    </Button>
                    <Button
                        element="button"
                        size="min"
                        onClick={() => {
                            const { year, month } = shiftMonth(yearMonth.year, yearMonth.month, 1);
                            setYearMonth(() => ({ year, month }));
                        }}
                    >
                        {">"}
                    </Button>
                </div>
            </div>
            <CalendarGrid
                className={styles.calendar}
                selectedDate={calendarContext.selectedDate}
                yearMonth={yearMonth}
                size="lg"
                onDateSelect={handleDateSelect}
            />
        </div>
    );
}