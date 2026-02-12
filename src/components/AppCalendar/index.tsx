"use client";

import styles from "@/components/AppCalendar/AppCalendar.module.scss";

import { useState } from "react";
import { shiftMonth } from "@/utils/month";
import { useCalendarContext } from "@/context";
import { getMonthName } from "@/constants/calendar";
import { getNextDates } from "@/utils/days";
import Button from "@/ui/Button";
import CalendarGrid from "@/ui/CalendarGrid";
import { getYearMonthDay } from "@/utils/date";

interface YearMonthState {
    year: number;
    month: number;
}

export default function MiniCalendar() {
    const calendarContext = useCalendarContext();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [yearMonth, setYearMonth] = useState<YearMonthState>({
        year: today.getFullYear(),
        month: today.getMonth() + 1,
    });

    function handleDateSelect(date: Date) {
        if(date === calendarContext.selectedDate) return;

        console.log("Selected date:", date);

        calendarContext.setSelectedDate(date);
        calendarContext.setDateRange(getNextDates(date, 5));

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
        <div className={styles.mini_calendar}>
            <div className={styles.header}>
                <div className={styles.title}>
                    <span className={styles.month}>{getMonthName(yearMonth.month)}</span>
                    <span>{yearMonth.year}</span>
                </div>
                <div className={styles.pagination}>
                    <Button
                        element="button"
                        size="sm"
                        onClick={() => {
                            const { year, month } = shiftMonth(yearMonth.year, yearMonth.month, -1);
                            setYearMonth(() => ({ year, month }));
                        }}
                    >
                        {"<"}
                    </Button>
                    <Button
                        element="button"
                        size="sm"
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
                yearMonth={yearMonth}
                size="lg"
                onDateSelect={handleDateSelect}
            />
        </div>
    );
}