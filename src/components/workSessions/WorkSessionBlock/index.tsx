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

export default function WorkSessionBlock({ workSession, timeBlock, sessionTasks, calendarDate, style, ...props }: WorkSessionProps) {
    const { select, workSession: selectedSession } = useWorkSessionContext();
    const taskContext = useTaskContext();

    const [_, updateTasks] = useCalendarStore("tasks");
    const [__, updateTimeBlocks] = useCalendarStore("time_blocks");

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

            blockRef.current?.classList.toggle(
                styles.hovered,
                hoveredRef.current
            );
        });
    }, [taskContext]);

    useEffect(() => {
        if (!taskContext.subscribeDragDrop) return;

        return taskContext.subscribeDragDrop(handleTaskDrop);
    }, [taskContext]);

    const handleTaskDrop = async (state: TaskDragState) => {
        if (state.hoverId !== workSessionToKey(workSession)) return;
        
        if (taskContext.draggedTaskRef.current) {
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
        }
    };

    const startSeconds = postgresTimestamptzToUnix(timeBlock.startsAt!) - calendarDate.startSeconds;
    const hour24 = Math.floor(startSeconds / 3600);
    const minutes = Math.floor((startSeconds % 3600) / 60);
    const hourTime = new HourTime(hour24, minutes);
    const endHourTime = hourTime.addMinutes(timeBlock.duration / 60);
    
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
            <div className="flex flex-row gap-1 items-center">
                <span className={styles.session_name}>{workSession.name}</span>
                <span className={styles.session_time}>{hourTime.Time12} - {endHourTime.Time12WithSuffix}</span>
            </div>
            <div className={styles.task_container}>
                {sortedTasks.map(task => {
                    return (
                        <div key={task.id} className={styles.task}>
                            <span>{`• ${task.name}`}</span>
                            {task.isCompleted && (
                                <div className={styles.completed}/>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    );
}