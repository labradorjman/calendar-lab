"use client";

import styles from "@/components/MainCalendar/MainCalendar.module.scss";

import { useCalendarContext } from "@/context";
import DayColumn from "./DayColumn";
import { useEffect, useRef } from "react";
import { useScrollSyncContext } from "@/scrollSync/ScrollSyncContext";
import TimeColumn from "./DayColumn/TimeColumn";

// interface MainCalendarProps {
//     className: string;
// }
const TIME_COLUMN_NAME = "time_column";

export default function MainCalendar() {
    const calendarContext = useCalendarContext();
    const scrollSyncContext = useScrollSyncContext();

    const isInitialMount = useRef<boolean>(true);

    useEffect(() => {
        if(!isInitialMount.current) {
            scrollSyncContext.clear();
            isInitialMount.current = false;
        }
    }, [calendarContext.dateRange]);

    
    useEffect(() => {
        scrollSyncContext.clearRelations(TIME_COLUMN_NAME);
        calendarContext.dateRange.forEach(dateString => {
            scrollSyncContext.removeRelation(dateString, TIME_COLUMN_NAME);

            const relatedKeys = calendarContext.dateRange.filter(val => val !== dateString);
            scrollSyncContext.relate(dateString, relatedKeys);
            scrollSyncContext.relate(dateString, [TIME_COLUMN_NAME]);

            scrollSyncContext.relate(TIME_COLUMN_NAME, [dateString]);
        });
    }, [calendarContext.dateRange]);
    
    return (
        <div className={styles.content}>
            <div className={styles.time_column}>
                <TimeColumn
                    isHidden={false}
                    startHour={0}
                    endHour={23}
                />
            </div>

            <div className={styles.right_columns}>
                {calendarContext.dateRange.map((dateString, index) => (
                    <DayColumn
                        key={dateString}
                        dateString={dateString}
                        startHour={0}
                        endHour={23}
                        isRightmost={index === calendarContext.dateRange.length - 1}
                    />
                ))}
            </div>
        </div>
    );
}