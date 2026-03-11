"use client";

import styles from "@/components/content/DayColumn/DayColumn.module.scss";

import SimpleBar from 'simplebar-react';
import type SimpleBarCore from "simplebar-core";
import { TIMEZONE, WEEK_DAYS } from "@/constants/calendar";
import { HEADER_HEIGHT, HOUR_HEIGHT } from "@/constants/column";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useScrollSyncContext } from "@/scrollSync/ScrollSyncContext";
import { TaskDragState, useTaskContext } from "@/taskContext";
import { updateTask } from "@/services/taskService";
import { get24HourMinuteFromOffset, postgresTimestamptzToUnix, secondsToOffset, unixToPostgresTimestamptz } from "@/utils/time";
import { HourTime } from "@/utils/Time/HourTime";
import useCalendarStore from "@/store";
import { handlePromise } from "@/utils/handleError";
import TaskBlock from "@/components/tasks/TaskBlock";
import { TASK_MIN_DURATION_SECONDS } from "@/constants/limits";
import { CalendarDate } from "@/utils/Time/CalendarDate";
import { useContextMenu } from "@/components/_layout/ContextMenu/ContextMenuContext";
import { useCalendarContext } from "@/context";
import WorkSessionBlock from "../WorkSession";
import { dateToKey } from "@/utils/objectToKey";
import { TimeBlock } from "@/models/timeBlock";
import { Task } from "@/models/task";
import { WorkSession } from "@/models/workSession";
import { useTimeBlockContext } from "@/timeBlockContext";
import TaskSkeleton from "@/components/tasks/TaskSkeleton";

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

    const calendarDate = new CalendarDate({ format: "date", date, timezone: TIMEZONE });

    const taskContext = useTaskContext();
    const [tasks, updateTasks] = useCalendarStore("tasks");

    const [workSessions] = useCalendarStore("work_sessions");

    const timeBlockContext = useTimeBlockContext();
    const [timeBlocks, updateTimeBlocks] = useCalendarStore("time_blocks");

    const calendarContext = useCalendarContext();
    const taskStartSeconds = useRef<number>(0);

    const headerRef = useRef<HTMLDivElement>(null);
    const [headerHeight, setHeaderHeight] = useState<number>(0);

    const showSkeletonRef = useRef<boolean>(false);
    const hoveredRef = useRef<boolean>(false);
    const [contentHeight, setContentHeight] = useState<number>(0);
    const [taskContainerHeight, setTaskContainerHeight] = useState<number>(0);

    useEffect(() => {
        if(headerRef.current) {
            setHeaderHeight(headerRef.current.offsetHeight);
        }

        setContentHeight(24 * HOUR_HEIGHT);
        setTaskContainerHeight(24 * HOUR_HEIGHT);
    }, []);
    
     const { todayTimeBlocks } = useMemo(() => {
        const today: TimeBlock[] = [];

        for (const tb of timeBlocks) {
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

        return { todayTimeBlocks: today };
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
        if (!taskContext.subscribeTaskDrag) return;

        return taskContext.subscribeTaskDrag(state => {
            const isColumnHovered = state.hoverId === dateToKey(date);
            hoveredRef.current = isColumnHovered;
            
            taskContainerRef.current?.classList.toggle(styles.hovered, hoveredRef.current);

            updateSkeleton(state);
        });
    }, [taskContext, date]);

    useEffect(() => {
        if (!taskContext.subscribeDragDrop) return;

        const unsubscribe = taskContext.subscribeDragDrop(handleTaskDrop);

        return () => unsubscribe();
    }, [taskContext, date]);

    const handleTaskDrop = async (state: TaskDragState) => {
        updateSkeleton(state);

        if (state.hoverId !== dateToKey(date)) return;

        if (taskContext.draggedTaskRef.current) {
            const taskId = taskContext.draggedTaskRef.current!.task.id;

            if (state.taskTop == null) return;
            
            const { hour24, minute } = get24HourMinuteFromOffset(state.taskTop);
            const hourTime = new HourTime(hour24, minute);

            const taskTimeBlock = taskContext.draggedTaskRef.current!.timeBlock;
            const duration = taskTimeBlock?.duration ?? 0;
            if (duration === 0 || duration < TASK_MIN_DURATION_SECONDS) {
                console.log("--- Task must be 15 minutes long");
                return;

                // Prompt the user to create a work session
                // Cancelling will send it to backlog
            }

            if (duration > 0) {
                const taskStartUnix = calendarDate.startSeconds + hourTime.toSecondsSince();
                const hasOverlap = timeBlockContext.hasCollision(taskStartUnix, duration, taskId);

                if (hasOverlap) {
                    // Display toast for overlap
                    return;
                }
            }

            const [response, error] = await handlePromise(
                updateTask(taskId, {
                    task: {
                        isBacklogged: false
                    },
                    timeBlock: {
                        id: taskTimeBlock!.id,
                        startsAt:
                            calendarDate.builder()
                            .addSeconds(hourTime.toSecondsSince())
                            .toISOString()
                    }
                })
            );
            
            if (!response) {
                console.error(`Error dragging task [${taskId}] into day column:`, error);
            } else {
                updateTasks(prev => 
                    prev.map(t => t.id === response.task.id ? response.task : t)
                );
                if (response.timeBlock) {
                    updateTimeBlocks(prev =>
                        prev.map(tb => tb.id === response.timeBlock!.id ? response.timeBlock! : tb)
                    );
                }
                console.log("Dropped task:", response.task.id, "at column", date.toISOString(), "-- At time", hourTime.Time24);
            }
        }
    }

    function updateSkeleton(state: TaskDragState) {
        const isColumnHovered = state.hoverId === dateToKey(date);
        const element = skeletonRef.current;
        if (element) {
            const hasSkeleton = state.skeletonTop != null && state.skeletonHeight != null;
            showSkeletonRef.current = isColumnHovered && hasSkeleton;

            if (showSkeletonRef.current) {
                element.style.top = `${state.skeletonTop}px`;
                element.style.height = `${state.skeletonHeight}px`;
            }
            element.style.display = showSkeletonRef.current ? "block" : "none";
        }
    }

    const { taskById, workSessionById, tasksByWorkSessionId } = useMemo(() => {
        const taskMap = new Map<number, Task>();
        const workSessionMap = new Map<number, WorkSession>();
        const groupedTasks = new Map<number, Task[]>();

        for (const task of tasks) {
            taskMap.set(task.id, task);

            if (task.workSessionId) {
                if (!groupedTasks.has(task.workSessionId)) {
                    groupedTasks.set(task.workSessionId, []);
                }
                groupedTasks.get(task.workSessionId)!.push(task);
            }
        }

        for (const ws of workSessions) {
            workSessionMap.set(ws.id, ws);
        }

        return {
            taskById: taskMap,
            workSessionById: workSessionMap,
            tasksByWorkSessionId: groupedTasks,
        };
    }, [tasks, workSessions]);

    const getScrollTop = useCallback(() => {
        return (
            simpleBarRef.current
                ?.getScrollElement()
                ?.scrollTop ?? 0
        );
    }, []);

    const skeletonRef = useRef<HTMLDivElement | null>(null);

    return (
        <div
            className={styles.column}
            onContextMenu={(e) => {
                if(e.clientY < HEADER_HEIGHT) return;

                const { hour24, minute } = get24HourMinuteFromOffset(getScrollTop() + e.clientY - HEADER_HEIGHT);
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
                        data-hover-id={dateToKey(date)}
                        data-unix-start={calendarDate.startSeconds}
                        style={{ height: taskContainerHeight }}
                    >
                        <TaskSkeleton ref={skeletonRef} />
                        {todayTimeBlocks.map(timeBlock => {
                            if (timeBlock.taskId) {
                                if (tasks.length === 0) return;

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
                                        getScrollTop={getScrollTop}
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
                                if (workSessions.length === 0) return;

                                const workSession = workSessions.find(ws => ws.id === timeBlock.workSessionId);
                                if (!workSession) {
                                    console.error(`Could not find work session [${timeBlock.workSessionId}] linked to a timeblock with [${timeBlock.id}]`);
                                    return null;
                                }

                                if (timeBlock.startsAt == null) {
                                    console.error(`Work session [${workSession.id}] must have a valid timeblock. Error: The timeblock associated with the work session has not start time defined.`);
                                    return;
                                }

                                const startsAtLocalUnix =
                                    postgresTimestamptzToUnix(timeBlock.startsAt) +
                                    calendarDate.tzOffsetSeconds;

                                return (
                                    <WorkSessionBlock
                                        key={timeBlock.id}
                                        workSession={workSession}
                                        timeBlock={timeBlock}
                                        tasks={tasksByWorkSessionId.get(workSession.id) ?? []}
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
                            }                    
                        })}
                    </div>
                </div>
            </SimpleBar>
        </div>
    );
}