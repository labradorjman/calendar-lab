"use client";

import { WorkSession } from "@/models/workSession";
import { TimeBlock } from "@/models/timeBlock";
import styles from "./WorkSession.module.scss";
import { Task } from "@/models/task";
import { useCalendarContext } from "@/context";
import { useEffect, useRef } from "react";
import { workSessionToKey } from "@/utils/objectToKey";
import { TaskDragState, useTaskContext } from "@/taskContext";
import { handlePromise } from "@/utils/handleError";
import { updateTask } from "@/services/taskService";
import useCalendarStore from "@/store";

interface WorkSessionProps extends React.HTMLAttributes<HTMLDivElement> {
    workSession: WorkSession;
    timeBlock: TimeBlock;
    sessionTasks: Task[];
}

export default function WorkSessionBlock({ workSession, timeBlock, sessionTasks, style, ...props }: WorkSessionProps) {
    const calendarContext = useCalendarContext();
    const taskContext = useTaskContext();

    const [tasks, updateTasks] = useCalendarStore("tasks");
    const [timeBlocks, updateTimeBlocks] = useCalendarStore("time_blocks");

    const blockRef = useRef<HTMLDivElement>(null);
    const hoveredRef = useRef<boolean>(false);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (!blockRef.current) return;

            const target = event.target as HTMLElement;

            if (target.closest('[data-target="side_panel"]')) {
                return;
            }

            if (!blockRef.current.contains(target)) {
                calendarContext.setWorkSessionSelection(null);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [calendarContext.setWorkSessionSelection]);

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

            const [response, error] = await handlePromise(
                updateTask(taskId, {
                    task: {
                        workSessionId: workSession.id,
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
                calendarContext.setWorkSessionSelection({
                    workSession,
                    timeBlock,
                    tasks
                });
            }}
        >
            <span>{workSession.name}</span>
            <div className={styles.task_container}>
                {sessionTasks.map(task => {
                    return (
                        <div
                            key={task.id}
                            className={styles.task}
                        >
                            <span>{`• ${task.name}`}</span>
                        </div>

                    )
                })

                }
            </div>
        </div>
    );
}