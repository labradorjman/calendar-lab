"use client";

import styles from "@/components/MiniCalendar/MiniCalendar.module.scss";

import { Calendar } from "tsg-calendar-lib";
import type { MonthBlock } from "./types/monthBlock";
import { useEffect, useState } from "react";
import { toMondayMonthBlock } from "@/utils/weekBuilder";
import Cell from "@/components/MiniCalendar/Cell";
import { getDateString, getYearMonthDay } from "@/utils/dateString";
import { shiftMonth } from "@/utils/month";
import { useCalendarContext } from "@/context";
import { getMonthName } from "@/constants/calendar";
import { getNextDates } from "@/utils/days";
import Button from "@/ui/Button";

interface YearMonthState {
    year: number;
    month: number;
}

export default function MiniCalendar() {
    const calendarContext = useCalendarContext();

    const today = new Date();
    const [yearMonth, setYearMonth] = useState<YearMonthState>({
        year: today.getFullYear(),
        month: today.getMonth() + 1,
    });

    const [monthBlock, setMonthBlock] = useState<MonthBlock>(() => {
        const calendar = new Calendar(today.getFullYear(), today.getMonth() + 1);
        return toMondayMonthBlock(calendar);
    });

    useEffect(() => {
        const calendar = new Calendar(yearMonth.year, yearMonth.month);
        setMonthBlock(toMondayMonthBlock(calendar));
    }, [yearMonth]);

    function handleDateSelect(date: string) {
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
            <div className={styles.weekdays}>
                <div className={styles.name}>M</div>
                <div className={styles.name}>T</div>
                <div className={styles.name}>W</div>
                <div className={styles.name}>T</div>
                <div className={styles.name}>F</div>
                <div className={styles.name}>S</div>
                <div className={styles.name}>S</div>
            </div>
            <div className={styles.grid}>
                {monthBlock.days.map((day, index) => {
                    const isPrevMonth = index < monthBlock.startIndex;
                    const isNextMonth = index > monthBlock.endIndex;
                    const delta = isPrevMonth ? -1 : isNextMonth ? 1 : 0;

                    const { year, month } = shiftMonth(yearMonth.year, yearMonth.month, delta);

                    const dateString = getDateString(year, month, day);
                    const todayString = getDateString(today.getFullYear(), today.getMonth() + 1, today.getDate());

                    return (
                        <Cell
                            key={dateString}
                            day={day}
                            dateString={dateString}
                            isSelected={calendarContext.selectedDate === dateString}
                            isToday={todayString === dateString}
                            isCurrentMonth={month === yearMonth.month}
                            onDateSelect={(handleDateSelect)}
                        />
                    );
                })}
            </div>
        </div>
    );
}