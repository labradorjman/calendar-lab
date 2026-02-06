"use client";

import styles from "@/components/content/Content.module.scss";

import { useCalendarContext } from "@/context";
import DayColumn from "./DayColumn";
import { useEffect, useRef } from "react";
import { useScrollSyncContext } from "@/scrollSync/ScrollSyncContext";
import TimeColumn from "./TimeColumn";
import TaskModal from "@/components/tasks/TaskModal";
import useCalendarStore from "@/store";
import { Task } from "@/models/task";

const TIME_COLUMN_NAME = "time_column";

export default function MainCalendar() {
    const calendarContext = useCalendarContext();
    const scrollSyncContext = useScrollSyncContext();

    const [_, updateTasks] = useCalendarStore("tasks");

    const isInitialMount = useRef<boolean>(true);
    const prevDateRange = useRef<string[]>([]);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            prevDateRange.current = calendarContext.dateRange;
            return;
        }

        const unregisterDays = prevDateRange.current.filter(
            date => !calendarContext.dateRange.includes(date)
        );
        
        unregisterDays.forEach(date => scrollSyncContext.unregister(date));
        
        prevDateRange.current = calendarContext.dateRange;
    }, [calendarContext.dateRange]);

    useEffect(() => {
        scrollSyncContext.clearRelations(TIME_COLUMN_NAME);
        calendarContext.dateRange.forEach(dateString => {
            scrollSyncContext.removeRelation(dateString, TIME_COLUMN_NAME);

            const relatedKeys = calendarContext.dateRange.filter(val => val !== dateString);
            relatedKeys.push(TIME_COLUMN_NAME);
            scrollSyncContext.relate(dateString, relatedKeys);

            scrollSyncContext.relate(TIME_COLUMN_NAME, [dateString]);
        });
    }, [calendarContext.dateRange]);
    
    return (
        <>
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
                            isRightmost={index === calendarContext.dateRange.length - 1}
                        />
                    ))}
                </div>
            </div>
            <TaskModal
                open={calendarContext.isTaskModalOpen}
                onClose={() => calendarContext.closeTaskModal()}
                onTaskCreated={(newTask: Task) => {
                    updateTasks(prev => [...prev, newTask]);
                }}
            />
        </>
    );
}