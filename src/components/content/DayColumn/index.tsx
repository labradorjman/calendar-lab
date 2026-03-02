"use client";

import styles from "@/components/content/DayColumn/DayColumn.module.scss";

import SimpleBar from 'simplebar-react';
import type SimpleBarCore from "simplebar-core";
import { TIMEZONE, WEEK_DAYS } from "@/constants/calendar";
import { HEADER_HEIGHT, HOUR_HEIGHT, SNAP_MINUTES } from "@/constants/column";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useScrollSyncContext } from "@/scrollSync/ScrollSyncContext";
import { HoveredColumnState, useTaskContext } from "@/taskContext";
import { updateTask } from "@/services/taskService";
import { get24HourMinuteFromOffset, postgresTimestamptzToUnix, unixToPostgresTimestamptz } from "@/utils/time";
import { HourTime } from "@/utils/Time/HourTime";
import useCalendarStore from "@/store";
import { handlePromise } from "@/utils/handleError";
import TaskBlock from "@/components/tasks/TaskBlock";
import { TASK_MIN_DURATION_SECONDS } from "@/constants/limits";
import { CalendarDate } from "@/utils/Time/CalendarDate";
import { useContextMenu } from "@/components/_layout/ContextMenu/ContextMenuContext";
import { useCalendarContext } from "@/context";
import WorkSessionBlock from "../WorkSession";
import { dateToKey } from "@/utils/date";
import { updateTimeBlock } from "@/services/timeBlockService";
import { TimeBlock } from "@/models/timeBlock";

interface DayColumnProps {
    date: Date;
    isRightmost: boolean;
}

export default function DayColumn({ date, isRightmost}: DayColumnProps) {
    const { openContextMenu } = useContextMenu();
    const contextMenuPos = useRef<{ x: number; y: number } | null>(null);
    const menuItems = [
        {
            id: "add-task",
            label: "Add Task",
            onSelect: () => {
                calendarContext.openTaskModal({
                    mode: "create",
                    startsAt: unixToPostgresTimestamptz(taskStartSeconds.current),
                }
            )},
        },
        {
            id: "create-work-session",
            label: "Create Work Session",
            onSelect: () => {
                calendarContext.openWorkSessionModal({
                    mode: "create",
                    startsAt: unixToPostgresTimestamptz(taskStartSeconds.current),
                });
            },
        },
    ];

    const [workSessions] = useCalendarStore("work_sessions");
    const [timeBlocks, updateTimeBlocks] = useCalendarStore("time_blocks");

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
    
    const timeBlocksRef = useRef(timeBlocks);

    useEffect(() => {
        timeBlocksRef.current = timeBlocks;
    }, [timeBlocks]);

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

        const unsubscribe = taskContext.subscribeDragDropColumn(handleTaskDrop);

        return () => unsubscribe();
    }, [taskContext, date]);

    const handleTaskDrop = async (state: HoveredColumnState) => {
        if (state.columnId !== dateToKey(date)) return;

        if (taskContext.draggedTaskRef.current) {
            const { hour24, minute } = get24HourMinuteFromOffset(state.columnContentTop ?? 0, SNAP_MINUTES);
            const hourTime = new HourTime(hour24, minute);

            const taskTimeBlock = timeBlocksRef.current.find(tb => tb.taskId === taskContext.draggedTaskRef.current!.id);
            const duration = taskTimeBlock?.duration ?? 0;
            if (duration === 0 || duration < TASK_MIN_DURATION_SECONDS) {
                console.log("--- Task must be 15 minutes long");
                return;

                // Prompt the user to create a work session
                // Cancelling will send it to backlog
            }

            if (duration > 0) {
                const taskStartUnix = calendarDate.startSeconds + hourTime.toSecondsSince();
                const taskEndUnix = taskStartUnix + duration;

                const hasOverlap = todayTimeBlocks.some(tb => {
                    if (!tb.startsAt) return false;

                    const start = postgresTimestamptzToUnix(tb.startsAt);
                    const end = start + tb.duration;

                    return taskStartUnix < end && taskEndUnix > start;
                });

                if (hasOverlap) {
                    // Display toast for overlap
                    return;
                }
            }
            
            const taskId = taskContext.draggedTaskRef.current!.id;
            const [timeBlock, timeBlockError] = await handlePromise(
                updateTimeBlock(
                    taskTimeBlock!.id,
                    { startsAt:
                        calendarDate.builder()
                        .addSeconds(hourTime.toSecondsSince())
                        .toISOString()
                    }
                )
            )
            if (!timeBlock) {
                console.log(`Error updating time block [${taskTimeBlock!.id}] related to task [${taskId}]:`, timeBlockError);
            } else {
                updateTimeBlocks(prev => 
                    prev.map(tb => tb.id === timeBlock.id ? timeBlock : tb)
                )
            }

            const [response, error] = await handlePromise(
                updateTask(taskId, {
                    task: {
                        isBacklogged: false
                    }
                })
            );
            
            if (!response) {
                console.error(`Error updating task-{${taskId}}:`, error);
            } else {
                updateTasks(prev => 
                    prev.map(t => t.id === response.task.id ? response.task : t)
                );
                console.log("Dropped task:", response.task.id, "at column", date.toISOString(), "-- At time", hourTime.Time24);
            }
        }
    }

    const toKey = (type: "task" | "work_session", id: number | string) =>
        `${type}-${id}`;

    const { timeBlockByKey, todayTimeBlocks } = useMemo(() => {
        const map = new Map<string, TimeBlock>();
        const today: TimeBlock[] = [];

        for (const tb of timeBlocks) {
            if (tb.taskId) {
                map.set(toKey("task", tb.taskId), tb);
            } else if (tb.workSessionId) {
                map.set(toKey("work_session", tb.workSessionId), tb);
            } else {
                console.error(`Error mapping time block [${tb.id}]`);
            }

            if (!tb.startsAt) continue;

            const unixStart = postgresTimestamptzToUnix(tb.startsAt);
            const unixEnd = unixStart + tb.duration;

            if ((unixStart >= calendarDate.startSeconds &&
                unixStart < calendarDate.endSeconds) || 
                (unixEnd > calendarDate.startSeconds &&
                unixEnd < calendarDate.endSeconds)
            ) {
                today.push(tb);
            }
        }

        return {
            timeBlockByKey: map,
            todayTimeBlocks: today,
        };
    }, [timeBlocks]);

    const { taskById, workSessionById } = useMemo(() => ({
        taskById: new Map(tasks.map(t => [t.id, t])),
        workSessionById: new Map(workSessions.map(w => [w.id, w])),
    }), [tasks, workSessions]);

    const getScrollTop = useCallback(() => {
        return (
            simpleBarRef.current
                ?.getScrollElement()
                ?.scrollTop ?? 0
        );
    }, []);
    
    function secondsToOffset(seconds: number): number {
        const minutes = seconds / 60;
        const spacePerMinute = HOUR_HEIGHT / 60;
        return minutes * spacePerMinute;
    }
    
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

                contextMenuPos.current = {
                    x: e.clientX,
                    y: e.clientY,
                };

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
                        {todayTimeBlocks.map(timeBlock => {
                            if (timeBlock.taskId) {
                                const task = taskById.get(timeBlock.taskId);
                                if (task?.isBacklogged || timeBlock.startsAt === null) return null;

                                const startsAtLocalUnix =
                                    postgresTimestamptzToUnix(timeBlock.startsAt) +
                                    calendarDate.tzOffsetSeconds;
                                
                                return (
                                    <TaskBlock
                                        key={task!.id}
                                        task={task!}
                                        timeBlock={timeBlock}
                                        calendarDate={calendarDate}
                                        style={{
                                            position: "absolute",
                                            top: `${secondsToOffset(
                                                startsAtLocalUnix -
                                                    calendarDate.startLocalSeconds
                                            )}px`,
                                            height:
                                                timeBlock.duration !== 0
                                                    ? `${(HOUR_HEIGHT / 60) * (timeBlock.duration / 60)}px`
                                                    : "auto",
                                        }}
                                    />
                            );

                            } else if (timeBlock.workSessionId) {
                                const workSession = workSessions.find(ws => ws.id === timeBlock.workSessionId);;
                                if (!workSession) {
                                    console.error(`Could not find work session [${timeBlock.workSessionId}] linked to a timeblock with [${timeBlock.id}]`);
                                    return null;
                                }

                                return (
                                    <WorkSessionBlock
                                        key={timeBlock.id}
                                        workSession={workSession}
                                        timeBlock={timeBlock}
                                    />
                                );
                            }

                           
                        })}
                    </div>
                </div>
            </SimpleBar>
        </div>
    );
}