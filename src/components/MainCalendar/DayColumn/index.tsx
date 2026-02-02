"use client";

import styles from "@/components/MainCalendar/DayColumn/DayColumn.module.scss";

import SimpleBar from 'simplebar-react';
import type SimpleBarCore from "simplebar-core";
import { TIMEZONE, WEEK_DAYS } from "@/constants/calendar";
import { HOUR_HEIGHT, SNAP_MINUTES } from "@/constants/column";
import { getYearMonthDay } from "@/utils/dateString";
import { useCallback, useEffect, useRef, useState } from "react";
import { useScrollSyncContext } from "@/scrollSync/ScrollSyncContext";
import { HoveredColumnState, useTaskContext } from "@/taskContext";
import { updateTask } from "@/services/tasks";
import { get24HourMinute, postgresTimestamptzToUnix } from "@/utils/time";
import { HourTime } from "@/utils/Time/HourTime";
import useCalendarStore from "@/store";
import { handlePromise } from "@/utils/handleError";
import TaskBlock from "@/components/tasks/TaskBlock";
import { TASK_MIN_DURATION_SECONDS } from "@/constants/taskLimits";
import { CalendarDate } from "@/utils/Time/CalendarDate";
import { useContextMenu } from "@/components/_layout/ContextMenu/ContextMenuContext";
import { ContextMenuRenderer } from "@/components/_layout/ContextMenu/ContextMenuRenderer";

interface DayColumnProps {
    dateString: string;
    isRightmost: boolean;
}

export default function DayColumn({ dateString, isRightmost}: DayColumnProps) {
    const { openContextMenu } = useContextMenu();
    const menuItems = [
        {
            id: "add-task",
            label: "Add Task",
            onSelect: () => {},
        },
        {
            id: "create-work-session",
            label: "Create Work Session",
            onSelect: () => {},
        },
    ];

    const { year, month, day } = getYearMonthDay(dateString);
    const date = new Date(year, month - 1, day);

    const calendarDate = new CalendarDate({ format: "datestring", dateString, timezone: TIMEZONE });

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
            const duration = taskContext.draggedTaskRef.current.duration;
            if (duration !== 0 && duration < TASK_MIN_DURATION_SECONDS) {
                console.log("--- Task must be 15 minutes long");
                return;

                // Prompt the user to create a work session
                // Cancelling will send it to backlog
            }

            const { hour24, minute } = get24HourMinute(state.columnContentTop ?? 0, SNAP_MINUTES);
            const hourTime = new HourTime(hour24, minute)

            const taskId = taskContext.draggedTaskRef.current!.id;
            const [task, error] = await handlePromise(
                updateTask(
                    taskId,
                    {
                        startsAt: calendarDate
                            .builder()
                            .addSeconds(hourTime.SecondsSinceMidnight)
                            .toISOString(),
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
            console.log("Dropped task:", task.id, "at column", dateString, "-- At time", hourTime.Time24);
        }
    }

    const tasksWithUnix = tasks.map(task => {
        const startsAtUnix = task.startsAt
            ? postgresTimestamptzToUnix(task.startsAt)
            : undefined;

        return {
            ...task,
            startsAtUnix,
        };
    });

    const visibleTasks = tasksWithUnix.filter(
        task =>
            !task.isBacklogged &&
            task.startsAtUnix !== undefined &&
            task.startsAtUnix >= calendarDate.startSeconds &&
            task.startsAtUnix < calendarDate.endSeconds
    );

    function secondsToOffset(seconds: number): number {
        const minutes = seconds / 60;
        const spacePerMinute = HOUR_HEIGHT / 60;
        return minutes * spacePerMinute;
    }

    const getScrollTop = useCallback(() => {
        return (
            simpleBarRef.current
                ?.getScrollElement()
                ?.scrollTop ?? 0
        );
    }, []);

    return (
        <div
            className={styles.column}
            onContextMenu={(e) => {
                console.log("onContextMenu daycolumn");
                e.preventDefault();
                e.stopPropagation();

                openContextMenu({
                    x: e.clientX,
                    y: e.clientY,
                    items: menuItems,
                });
            }}
        >
            <div ref={headerRef} className={styles.header}>
                <div className={styles.day_label}>
                    <span className={styles.name}>{WEEK_DAYS[date.getDay()]}</span>
                    <span className={styles.number}>{day}</span>
                </div>
            </div>

            <SimpleBar
                ref={simpleBarRef}
                style={{ maxHeight: `calc(100vh - ${headerHeight}px)` }}
                className={`${isRightmost ? "" : styles.scroll_hidden}`}
            >
                <div className={styles.content} style={{ height: contentHeight }}>
                    <div
                        ref={taskContainerRef}
                        className={styles.task_container}
                        data-column={dateString}
                        style={{ height: taskContainerHeight }}
                    >
                        {visibleTasks.map(task => {
                            const startsAtLocalUnix =
                                task.startsAtUnix! +
                                calendarDate.tzOffsetSeconds;

                            return (
                                <TaskBlock
                                    key={task.id}
                                    task={task}
                                    calendarDate={calendarDate}
                                    getScrollTop={getScrollTop}
                                    style={{
                                        position: "absolute",
                                        top: `${secondsToOffset(
                                            startsAtLocalUnix -
                                                calendarDate.startLocalSeconds
                                        )}px`,
                                        height:
                                            task.duration !== 0
                                                ? `${(HOUR_HEIGHT / 60) * (task.duration / 60)}px`
                                                : "auto",
                                    }}
                                />
                            );
                        })}
                    </div>
                </div>
            </SimpleBar>

            <ContextMenuRenderer/>
        </div>
    );
}