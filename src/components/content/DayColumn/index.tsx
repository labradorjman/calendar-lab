"use client";

import styles from "@/components/content/DayColumn/DayColumn.module.scss";

import SimpleBar from 'simplebar-react';
import type SimpleBarCore from "simplebar-core";
import { TIMEZONE, USER_ID, WEEK_DAYS } from "@/constants/calendar";
import { HEADER_HEIGHT, HOUR_HEIGHT, SNAP_MINUTES } from "@/constants/column";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useScrollSyncContext } from "@/scrollSync/ScrollSyncContext";
import { HoveredColumnState, useTaskContext } from "@/taskContext";
import { updateTask } from "@/services/tasks";
import { get24HourMinuteFromOffset, postgresTimestamptzToUnix, unixToPostgresTimestamptz } from "@/utils/time";
import { HourTime } from "@/utils/Time/HourTime";
import useCalendarStore from "@/store";
import { handlePromise } from "@/utils/handleError";
import TaskBlock from "@/components/tasks/TaskBlock";
import { TASK_MIN_DURATION_SECONDS } from "@/constants/taskLimits";
import { CalendarDate } from "@/utils/Time/CalendarDate";
import { useContextMenu } from "@/components/_layout/ContextMenu/ContextMenuContext";
import { useCalendarContext } from "@/context";
import { createWorkSession } from "@/services/workSessions";
import WorkSessionBlock from "../WorkSession";
import { dateToKey } from "@/utils/date";

interface DayColumnProps {
    date: Date;
    isRightmost: boolean;
}

type TaskInterval = {
    start: number;
    end: number;
};

export default function DayColumn({ date, isRightmost}: DayColumnProps) {
    const { openContextMenu } = useContextMenu();
    const menuItems = [
        {
            id: "add-task",
            label: "Add Task",
            onSelect: () => {calendarContext.openTaskModal({ startsAt: unixToPostgresTimestamptz(taskStartSeconds.current)})},
        },
        {
            id: "create-work-session",
            label: "Create Work Session",
            onSelect: () => {
                console.log("Creating work session");
                // createWorkSession({
                //     userId: USER_ID,
                //     name: "activities",
                //     color: "#fff",
                //     isExtended: false,
                //     isCompleted: false,
                //     completedAt: null,
                // });
            },
        },
    ];

    const [workSessions, updateWorkSessions] = useCalendarStore("work_sessions");

    const calendarDate = new CalendarDate({ format: "date", date, timezone: TIMEZONE });

    const taskContext = useTaskContext();
    const [tasks, updateTasks] = useCalendarStore("tasks");

    const calendarContext = useCalendarContext();
    const taskStartSeconds = useRef<number>(0);

    const headerRef = useRef<HTMLDivElement>(null);
    const [headerHeight, setHeaderHeight] = useState<number>(0);

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

    const scrollContext = useScrollSyncContext();
    const taskContainerRef = useRef<HTMLDivElement>(null);
    const simpleBarRef = useRef<SimpleBarCore>(null);

    useEffect(() => {
        if (!simpleBarRef.current) return;

        const element = simpleBarRef.current.getScrollElement();
        scrollContext.register(dateToKey(date), {
            getScrollElement: () => element
        });

        const handler = () => {
            scrollContext.syncFrom(dateToKey(date));
        };

        element?.addEventListener("scroll", handler);

        return () => {
            element?.removeEventListener("scroll", handler);
        };
    }, []);

    useEffect(() => {
        if (!taskContext.subscribeHoveredColumn) return;

        return taskContext.subscribeHoveredColumn(state => {
            hoveredRef.current = state.columnId === dateToKey(date);

            taskContainerRef.current?.classList.toggle(
                styles.hovered,
                hoveredRef.current
            );
        });
    }, [taskContext, date]);


    useEffect(() => {
        if (!taskContext.subscribeDragDropColumn) return;

        const unsubscribe = taskContext.subscribeDragDropColumn(handleDrop);

        return () => unsubscribe();
    }, [taskContext, date]);

    const handleDrop = async (state: HoveredColumnState) => {
        if (state.columnId !== dateToKey(date)) return;

        if (taskContext.draggedTaskRef.current) {
            const { hour24, minute } = get24HourMinuteFromOffset(state.columnContentTop ?? 0, SNAP_MINUTES);
            const hourTime = new HourTime(hour24, minute);

            const duration = taskContext.draggedTaskRef.current.duration;
            if (duration === 0 || duration < TASK_MIN_DURATION_SECONDS) {
                console.log("--- Task must be 15 minutes long");
                return;

                // Prompt the user to create a work session
                // Cancelling will send it to backlog
            }

            if (duration > 0) {
                const taskId = taskContext.draggedTaskRef.current.id;
                const taskStartUnix = calendarDate.startSeconds + hourTime.toSecondsSince();
                const taskEndUnix = taskStartUnix + duration;

                const hasOverlap = Object.entries(
                    intervalsByIdRef.current
                ).some(([id, interval]) => {
                    if (id === taskId.toString()) return false;

                     return (
                        taskStartUnix < interval.end &&
                        taskEndUnix > interval.start
                    );
                });

                if (hasOverlap) {
                    // Display toast for overlap
                    return;
                }
            }

            const taskId = taskContext.draggedTaskRef.current!.id;
            const [task, error] = await handlePromise(
                updateTask(
                    taskId,
                    {
                        startsAt: calendarDate
                            .builder()
                            .addSeconds(hourTime.toSecondsSince())
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
            console.log("Dropped task:", task.id, "at column", date.toISOString(), "-- At time", hourTime.Time24);
        }
    }

    const tasksWithUnix = useMemo(() => {
        return tasks.map(task => ({
            ...task,
            startsAtUnix: task.startsAt
                ? postgresTimestamptzToUnix(task.startsAt)
                : undefined
        }));
    }, [tasks]);

    const visibleTasks = useMemo(() => {
        return tasksWithUnix.filter(
            task =>
                !task.isBacklogged &&
                task.startsAtUnix !== undefined &&
                task.startsAtUnix >= calendarDate.startSeconds &&
                task.startsAtUnix < calendarDate.endSeconds
        );
    }, [tasksWithUnix, calendarDate]);

    const intervalsByIdRef = useRef<Record<string, TaskInterval>>({});
    intervalsByIdRef.current = Object.fromEntries(
        visibleTasks.map(task => [
            task.id,
            {
                start: task.startsAtUnix!,
                end: task.startsAtUnix! + task.duration
            }
        ])
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
                if(e.clientY < HEADER_HEIGHT) return;

                const { hour24, minute } = get24HourMinuteFromOffset(getScrollTop() + e.clientY - HEADER_HEIGHT, SNAP_MINUTES);
                const hourTime = new HourTime(hour24, minute);

                taskStartSeconds.current = calendarDate.startSeconds + hourTime.toSecondsSince();
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
                    <span className={styles.number}>{date.getDate()}</span>
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
                        data-column={dateToKey(date)}
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
                        {/* {workSessions.map(session => {
                            return (
                                <WorkSessionBlock
                                    key={`ws-${session.id}`}
                                    workSession={session}
                                />
                            );
                        })} */}
                    </div>
                </div>
            </SimpleBar>
        </div>
    );
}