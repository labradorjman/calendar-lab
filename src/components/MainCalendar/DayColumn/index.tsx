"use client";

import styles from "@/components/MainCalendar/DayColumn/DayColumn.module.scss";

import SimpleBar from 'simplebar-react';
import type SimpleBarCore from "simplebar-core";
import { HOUR_HEIGHT, SNAP_MINS, WEEK_DAYS } from "@/constants/calendar";
import { getYearMonthDay } from "@/utils/dateString";
import { useEffect, useRef, useState } from "react";
import { useScrollSyncContext } from "@/scrollSync/ScrollSyncContext";
import { useTaskContext } from "@/taskContext";
import { updateTask } from "@/services/tasks";
import { getHourMinuteString } from "@/utils/time";

interface DayColumnProps {
    dateString: string;
    isRightmost: boolean;
}

export default function DayColumn({ dateString, isRightmost}: DayColumnProps) {
    const { year, month, day } = getYearMonthDay(dateString);
    const date = new Date(year, month - 1, day);
    // const { year: prevYear, month: prevMonth, day: prevDay } = shiftDay(year, month, day, -1);
    // const previousDate = new Date(prevYear, prevMonth - 1, prevDay);

    const taskContext = useTaskContext();

    const headerRef = useRef<HTMLDivElement>(null);
    const [headerHeight, setHeaderHeight] = useState<number>(0);

    const [hovered, setHovered] = useState(false);
    const [contentHeight, setContentHeight] = useState<number>(0);
    const [taskContainerHeight, setTaskContainerHeight] = useState<number>(0);

    useEffect(() => {
        if(headerRef.current) {
            setHeaderHeight(headerRef.current.offsetHeight);
        }

        setContentHeight(24 * HOUR_HEIGHT);
        setTaskContainerHeight(24 * HOUR_HEIGHT);
    }, []);

    const manager = useScrollSyncContext();
    const simpleBarRef = useRef<SimpleBarCore>(null);

    useEffect(() => {
        if (!simpleBarRef.current) return;

        const element = simpleBarRef.current.getScrollElement();
        manager.register(dateString, {
            getScrollElement: () => element
        });

        const handler = () => {
            manager.syncFrom(dateString);
        };

        element?.addEventListener("scroll", handler);

        return () => {
            element?.removeEventListener("scroll", handler);
        };
    }, []);

    useEffect(() => {
        if (!taskContext.subscribeHoveredColumn) return;

        const unsubscribe = taskContext.subscribeHoveredColumn(state => {
            setHovered(state.columnId === dateString);
        });

        return () => unsubscribe();
    }, [taskContext, dateString]);

    useEffect(() => {
        if (!taskContext.subscribeDragDropColumn) return;

        const unsubscribe = taskContext.subscribeDragDropColumn(state => {
            if (state.columnId !== dateString) return;

            if (taskContext.draggedTaskRef.current) {
                (async () => {
                    try {
                        const task = await updateTask(
                            taskContext.draggedTaskRef.current!.id,
                            { isBacklogged: false }
                        );
                        console.log("Dropped task:", task.id, "at column", dateString, "-- At time",
                            getHourMinuteString(state.columnContentTop ?? 0, SNAP_MINS, true));
                    } catch (err) {
                        console.error("Failed to update task:", err);
                    }
                })();
            }
        });
        return () => unsubscribe();
    }, [taskContext, dateString]);

    return (
        <div className={styles.column}>
            <div
                ref={headerRef}
                className={styles.header}
            >
                <div className={styles.day_label}>
                    <span className={styles.name}>{WEEK_DAYS[date.getDay()]}</span>
                    <span className={styles.number}>{day}</span>
                </div>
            </div>
            <SimpleBar
                ref={simpleBarRef}
                style={{ maxHeight: `calc(100vh - ${headerHeight}px` }}
                className={`${isRightmost ? "" : styles.scroll_hidden}`}
            >
                <div
                    className={styles.content}
                    style={{ height: contentHeight }}
                >
                    <div
                        className={`${styles.task_container} ${hovered ? styles.hovered : ""}`}
                        data-column={dateString}
                        style={{ height: taskContainerHeight }}
                        
                    >
                        
                    </div>
                </div>
            </SimpleBar>
        </div>
    );
}