"use client";

import styles from "./CalendarGrid.module.scss";

import { Calendar } from "tsg-calendar-lib";
import type { MonthBlock } from "@/types/monthBlock";
import { useEffect, useState } from "react";
import { toMondayMonthBlock } from "@/utils/weekBuilder";
import CalendarCell from "@/ui/CalendarCell";
import { getDateString } from "@/utils/dateString";
import { shiftMonth } from "@/utils/month";
import { useCalendarContext } from "@/context";
import { YearMonthState } from "@/types/yearMonthState";

interface CalendarGridProps {
    yearMonth: YearMonthState;
    size: "sm" | "md" | "lg";
    onDateSelect: (date: string) => void;
}

export default function CalendarGrid({ yearMonth, size, onDateSelect }: CalendarGridProps) {
    console.log("size", size);
    const calendarContext = useCalendarContext();

    const today = new Date();

    const [monthBlock, setMonthBlock] = useState<MonthBlock>(() => {
        const calendar = new Calendar(today.getFullYear(), today.getMonth() + 1);
        return toMondayMonthBlock(calendar);
    });

    useEffect(() => {
        const calendar = new Calendar(yearMonth.year, yearMonth.month);
        setMonthBlock(toMondayMonthBlock(calendar));
    }, [yearMonth]);

    return (
        <div className={styles.calendar_grid} data-size={size}>
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
                        <CalendarCell
                            key={dateString}
                            day={day}
                            dateString={dateString}
                            isSelected={calendarContext.selectedDate === dateString}
                            isToday={todayString === dateString}
                            isCurrentMonth={month === yearMonth.month}
                            onDateSelect={onDateSelect}
                        />
                    );
                })}
            </div>
        </div>
    );
}