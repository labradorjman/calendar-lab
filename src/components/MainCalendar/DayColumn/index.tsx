"use client";

import styles from "@/components/MainCalendar/DayColumn/DayColumn.module.scss";

import SimpleBar from 'simplebar-react';
import type SimpleBarCore from "simplebar-core";
import { HOUR_HEIGHT, SNAP_MINS, WEEK_DAYS } from "@/constants/calendar";
import { getYearMonthDay } from "@/utils/dateString";
import { useEffect, useRef, useState } from "react";
import { useScrollSyncContext } from "@/scrollSync/ScrollSyncContext";
import { HoveredColumnState, useTaskContext } from "@/taskContext";
import { updateTask } from "@/services/tasks";
import {
    get24HourTimeString,
    getStartEndUnixSeconds,
    postgresTimestamptzToUnix,
    secondsSinceMidnight,
    secondsToOffset,
    unixToPostgresTimestamptz
} from "@/utils/time";
import useCalendarStore from "@/store";
import { handlePromise } from "@/utils/handleError";
import TaskBlock from "@/components/tasks/TaskBlock";

interface DayColumnProps {
    dateString: string;
    isRightmost: boolean;
}

export default function DayColumn({ dateString, isRightmost}: DayColumnProps) {
    const { year, month, day } = getYearMonthDay(dateString);
    const date = new Date(year, month - 1, day);

    const { start: startTime, end: endTime } = getStartEndUnixSeconds(date);

    const taskContext = useTaskContext();
    const [tasks, updateTasks] = useCalendarStore("tasks");

    const headerRef = useRef<HTMLDivElement>(null);
    const [headerHeight, setHeaderHeight] = useState<number>(0);

    // const [hovered, setHovered] = useState(false);
    const hoveredRef = useRef(false);
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
    const taskContainerRef = useRef<HTMLDivElement>(null);
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

        return taskContext.subscribeHoveredColumn(state => {
            hoveredRef.current = state.columnId === dateString;

            // ONLY toggle class if value changes
            taskContainerRef.current?.classList.toggle(
                styles.hovered,
                hoveredRef.current
            );
        });
    }, [taskContext, dateString]);


    useEffect(() => {
        if (!taskContext.subscribeDragDropColumn) return;

        const unsubscribe = taskContext.subscribeDragDropColumn(handleDrop);

        return () => unsubscribe();
    }, [taskContext, dateString]);

    const handleDrop = async (state: HoveredColumnState) => {
        if (state.columnId !== dateString) return;

        if (taskContext.draggedTaskRef.current) {
            const time24 = get24HourTimeString(state.columnContentTop ?? 0, SNAP_MINS);
            const seconds = secondsSinceMidnight(time24);

            const taskId = taskContext.draggedTaskRef.current!.id;
            const [task, error] = await handlePromise(
                updateTask(
                    taskId,
                    {
                        startsAt: unixToPostgresTimestamptz(startTime + seconds),
                        isBacklogged: false,
                    }
                )
            );

            if (!task) {
                console.error(`Error updating task-{${taskId}}:`, error);
                return;
            }

            updateTasks(prev => 
                prev.map(t => t.id === task.id ? task : t)
            );
            console.log("Dropped task:", task.id, "at column", dateString, "-- At time", time24);
        }
    }

    const tasksWithUnix = tasks
        .map(task => ({
            ...task,
            startsAtUnix: task.startsAt ? postgresTimestamptzToUnix(task.startsAt) : undefined
        }));

    const visibleTasks = tasksWithUnix.filter(
        task =>
            !task.isBacklogged &&
            task.startsAtUnix !== undefined &&
            task.startsAtUnix >= startTime &&
            task.startsAtUnix < endTime
    );

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
                        ref={taskContainerRef}
                        className={`${styles.task_container}`}
                        data-column={dateString}
                        style={{ height: taskContainerHeight }}
                        
                    >
                        {visibleTasks.map(task => (
                            <TaskBlock
                                key={task.id}
                                task={task}
                                style={{
                                    position: "absolute",
                                    top: `${secondsToOffset(task.startsAtUnix! - startTime)}px`
                                }}
                            />
                        ))}
                    </div>
                </div>
            </SimpleBar>
        </div>
    );
}