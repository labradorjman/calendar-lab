"use client";

import styles from "./CalendarGrid.module.scss";

import { Calendar } from "tsg-calendar-lib";
import type { MonthBlock } from "@/types/monthBlock";
import { forwardRef, useEffect, useState } from "react";
import { toMondayMonthBlock } from "@/utils/weekBuilder";
import CalendarCell from "@/ui/CalendarCell";
import { shiftMonth } from "@/utils/month";
import { useCalendarContext } from "@/context";
import { YearMonthState } from "@/types/yearMonthState";
import { dateToKey } from "@/utils/dateConverter";

interface CalendarGridProps {
    yearMonth?: YearMonthState;
    size: "sm" | "md" | "lg";
    onDateSelect: (date: Date) => void;
}

const CalendarGrid = forwardRef<HTMLDivElement, CalendarGridProps>(
    ({ yearMonth, size, onDateSelect }, ref) => {
        const calendarContext = useCalendarContext();

        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const [monthBlock, setMonthBlock] = useState<MonthBlock>(() => {
            const calendar = new Calendar(today.getFullYear(), today.getMonth() + 1);
            return toMondayMonthBlock(calendar);
        });

        useEffect(() => {
            if (!yearMonth) return;

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

                        const { year, month } = shiftMonth(
                            yearMonth?.year ?? today.getFullYear(),
                            yearMonth?.month ?? today.getMonth() + 1,
                            delta
                        );

                        const cellDate = new Date(year, month - 1, day);
                        cellDate.setUTCHours(0, 0, 0, 0);
                        
                        const todayDate = today;

                        return (
                        <CalendarCell
                            key={dateToKey(cellDate)}
                            day={day}
                            date={cellDate}
                            isSelected={
                                calendarContext.selectedDate
                                    ? calendarContext.selectedDate.getTime() === cellDate.getTime()
                                    : false
                            }
                            isToday={todayDate.getTime() === cellDate.getTime()}
                            isCurrentMonth={month === (yearMonth?.month ?? today.getMonth() + 1)}
                            onDateSelect={onDateSelect}
                        />
                        );
                    })}
                    </div>

            </div>
        );
    }
);

CalendarGrid.displayName = "CalendarGrid";

export default CalendarGrid;