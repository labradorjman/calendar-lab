"use client";

import { WorkSession } from "@/models/workSession";
import { TimeBlock } from "@/models/timeBlock";
import styles from "./WorkSessionBlock.module.scss";
import { Task } from "@/models/task";
import { useWorkSessionContext } from "@/workSessionContext";
import { useEffect, useRef, useState } from "react";
import { workSessionToKey } from "@/utils/objectToKey";
import { TaskDragState, useTaskContext } from "@/taskContext";
import { handlePromise } from "@/utils/handleError";
import { updateTask } from "@/services/taskService";
import useCalendarStore from "@/store";
import { postgresTimestamptzToUnix } from "@/utils/time";
import { CalendarDate } from "@/utils/Time/CalendarDate";
import { HourTime } from "@/utils/Time/HourTime";

interface WorkSessionProps extends React.HTMLAttributes<HTMLDivElement> {
    workSession: WorkSession;
    timeBlock: TimeBlock;
    sessionTasks: Task[];
    calendarDate: CalendarDate;
}

const TASK_GAP = 4;
const TASK_HEIGHT = 24;

export default function WorkSessionBlock({ workSession, timeBlock, sessionTasks, calendarDate, style, ...props }: WorkSessionProps) {
    const { select, workSession: selectedSession } = useWorkSessionContext();
    const taskContext = useTaskContext();

    const taskContainerRef = useRef<HTMLDivElement>(null);
    const [maxTasks, setMaxTasks] = useState(0);

    const [, updateTasks] = useCalendarStore("tasks");
    const [, updateTimeBlocks] = useCalendarStore("time_blocks");

    const [sortedTasks, setSortedTasks] = useState(() =>
        sessionTasks.toSorted((a, b) => a.orderIndex - b.orderIndex)
    );

    useEffect(() => {
        setSortedTasks(sessionTasks.toSorted((a, b) => a.orderIndex - b.orderIndex));

        // Refresh the display when a task gets updated
        if (selectedSession?.id === workSession.id) {
            select({ workSession, timeBlock, tasks: sessionTasks });
        }
    }, [sessionTasks]);

    const blockRef = useRef<HTMLDivElement>(null);
    const hoveredRef = useRef<boolean>(false);

    useEffect(() => {
        if (!taskContext.subscribeTaskDrag) return;

        return taskContext.subscribeTaskDrag(state => {
            hoveredRef.current = state.hoverId === workSessionToKey(workSession);

            blockRef.current?.classList.toggle(styles.hovered, hoveredRef.current);
        });
    }, [taskContext]);

    useEffect(() => {
        if (!taskContext.subscribeDragDrop) return;

        return taskContext.subscribeDragDrop(state => {
            if (state.hoverId !== workSessionToKey(workSession)) return;

            blockRef.current?.classList.remove(styles.hovered);
            handleTaskDrop(state);
        });
    }, [taskContext]);

    useEffect(() => {
        const containerHeight = taskContainerRef.current?.offsetHeight ?? 0;

        const requiredHeight = (sessionTasks.length * TASK_HEIGHT) + ((sessionTasks.length - 1) * TASK_GAP);
        if (requiredHeight <= containerHeight) {
            setMaxTasks(sessionTasks.length);
            return;
        }
        
        const available = containerHeight;
        const count = Math.floor((available + TASK_GAP) / (TASK_HEIGHT + TASK_GAP));
        setMaxTasks(Math.max(0, count));
    }, [timeBlock, sessionTasks]);

    const handleTaskDrop = async (state: TaskDragState) => {
        if (!taskContext.draggedTaskRef.current) {
            taskContext.settleDrop();
            return;
        }

        const taskId = taskContext.draggedTaskRef.current!.task.id;
        const taskTimeBlock = taskContext.draggedTaskRef.current!.timeBlock;

        const orderIndex = sessionTasks.length > 0
            ? Math.max(...sessionTasks.map(t => t.orderIndex)) + 1
            : 0;

        const [response, error] = await handlePromise(
            updateTask(taskId, {
                task: {
                    workSessionId: workSession.id,
                    orderIndex,
                    isBacklogged: false,
                },
                ...(taskTimeBlock?.startsAt
                    ? {
                        timeBlock: {
                            id: taskTimeBlock!.id,
                            startsAt: null,
                        }
                    }
                    : {}
                )
            })
        );

        taskContext.settleDrop();

        if (!response) {
            console.error(`Error dragging task [${taskId}] into work session:`, error);
        } else {
            updateTasks(prev => 
                prev.map(t => t.id === response.task.id ? response.task : t)
            );

            if (response.timeBlock) {
                updateTimeBlocks(prev =>
                    prev.map(tb => tb.id === response.timeBlock!.id ? response.timeBlock! : tb)
                );
            }
        }

    };

    const startSeconds = postgresTimestamptzToUnix(timeBlock.startsAt!) - calendarDate.startSeconds;
    const hourTime = new HourTime(Math.floor(startSeconds / 3600), Math.floor((startSeconds % 3600) / 60));
    const endHourTime = hourTime.addMinutes(Math.round(timeBlock.duration / 60));

    const hiddenCount = sessionTasks.length - maxTasks;
    const completedCount = sessionTasks.filter(t => t.isCompleted)?.length;

    const isTruncated = hiddenCount > 0;

    const visibleTasks = isTruncated
        ? [
            ...sortedTasks.filter(t => !t.isCompleted),
            ...sortedTasks.filter(t => t.isCompleted),
        ].slice(0, maxTasks)
        : sortedTasks;
    
    return (
        <div
            ref={blockRef}
            className={styles.session_block}
            data-hover-id={workSessionToKey(workSession)}
            style={{
                ...style,
                "--session-bg": workSession.color,
            } as React.CSSProperties}
            onClick={() => {
                select({
                    workSession,
                    timeBlock,
                    tasks: sessionTasks,
                });
            }}
        >
            <div className="flex flex-col gap-1">
                <span className={styles.session_name}>{workSession.name}</span>
                <div className="flex flex-row items-center justify-between">
                    <span className={styles.session_time}>{hourTime.Time12} - {endHourTime.Time12WithSuffix}</span>
                    {hiddenCount > 0 && (
                        <div className="flex flex-row gap-1 items-center">
                            {Array.from({ length: sessionTasks.length }, (_, index) => (
                                <div
                                    key={index}
                                    className={
                                        index < completedCount
                                        ? "w-1.5 h-1.5 rounded-full bg-white/80"
                                        : "w-1.5 h-1.5 rounded-md border border-white/40"
                                    }
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <div
                ref={taskContainerRef}
                className={styles.task_container}
            >
                {visibleTasks.map((task, index) => {
                    if (index >= maxTasks) return null;

                    return (
                        <div key={task.id} className={styles.task}>
                            <span>{`• ${task.name}`}</span>
                            {task.isCompleted && (
                                <div className={styles.completed} />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}