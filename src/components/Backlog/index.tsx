"use client";

import styles from "@/components/Backlog/Backlog.module.scss";
import Button from "@/ui/Button";
import { useEffect, useMemo } from "react";
import { Task } from "@/models/task";
import TaskBlock from "@/components/tasks/TaskBlock";
import SimpleBar from "simplebar-react";
import { HoveredColumnState, useTaskContext } from "@/taskContext";
import { updateTask } from "@/services/taskService";
import useCalendarStore from "@/store";
import { handlePromise } from "@/utils/handleError";
import { useContextMenu } from "@/components/_layout/ContextMenu/ContextMenuContext";
import { useCalendarContext } from "@/context";
import { WorkSession } from "@/models/workSession";
import { deleteTimeBlock } from "@/services/timeBlockService";
import { TimeBlock } from "@/models/timeBlock";

export default function Backlog() {
    const { openContextMenu } = useContextMenu();
    const menuItems = [
        {
            id: "add-task",
            label: "Add Task",
            onSelect: () => {calendarContext.openTaskModal({ mode: "create" })},
        },
    ];

    const taskContext = useTaskContext();
    const [tasks, updateTasks] = useCalendarStore("tasks");
    const [_, updateWorkSessions] = useCalendarStore("work_sessions");
    const [timeBlocks, updateTimeBlocks] = useCalendarStore("time_blocks");

    const calendarContext = useCalendarContext();

    useEffect(() => {
        async function fetchTasks() {
            const res = await fetch("/api/tasks");
            const data: Task[] = await res.json();
            
            updateTasks(() => data);
        }

        async function fetchWorkSessions() {
            const res = await fetch("/api/work-sessions");
            const data: WorkSession[] = await res.json();

            updateWorkSessions(() => data);
        }

        async function fetchTimeBlocks() {
            const res = await fetch("/api/time-blocks");
            const data: TimeBlock[] = await res.json();

            updateTimeBlocks(() => data);
        }

        fetchTasks();
        fetchWorkSessions();
        fetchTimeBlocks();
    }, []);
    
    useEffect(() => {
        if (!taskContext.subscribeDragDropColumn) return;

        const unsubscribe = taskContext.subscribeDragDropColumn(handleDrop);
        return () => unsubscribe();
    }, [taskContext]);

    const handleDrop = async (state: HoveredColumnState) => {
        if (state.columnId !== "backlog-column") return;

        if (taskContext.draggedTaskRef.current) {
            const taskId = taskContext.draggedTaskRef.current!.id;

            const [response, error] = await handlePromise(
                updateTask(taskId, {
                    task: {
                        isBacklogged: true
                    }
                })
            );

            if (!response) {
                console.error(`Error updating task [${taskId}]:`, error);
                return;
            }

            updateTasks(prev => 
                prev.map(t => t.id === response.task.id ? response.task : t)
            );
            console.log("Dropped task:", response.task.id, "at column", "backlog-column");
        }
    }
    const toKey = (type: "task" | "work_session", id: number | string) =>
        `${type}-${id}`;

    const timeBlockByKey = useMemo(() => {
        const map = new Map<string, TimeBlock>();

        for (const tb of timeBlocks) {
            if (tb.taskId) {
                map.set(toKey("task", tb.taskId), tb);
            } else if (tb.workSessionId) {
                map.set(toKey("work_session", tb.workSessionId), tb);
            } else {
                console.error(`Error mapping time block [${tb.id}]`);
            }
        }

        return map;
    }, [timeBlocks]);

    const visibleTaskTimeBlocks = tasks
        .filter(task => task.isBacklogged)
        .map(task => ({
            task,
            timeBlock: timeBlockByKey.get(toKey("task", task.id))
        }));

    return (
        <div className={styles.backlog}>
            <div className={styles.header}>
                <span>Backlog</span>
                <Button
                    element="button"
                    size="sm"
                    onClick={() => {
                        calendarContext.openTaskModal({ mode: "create" });
                    }}
                >
                    +
                </Button>
            </div>
            <div
                className={styles.task_area}
                data-column={"backlog-column"}
                onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
    
                    openContextMenu({
                        x: e.clientX,
                        y: e.clientY,
                        items: menuItems,
                    });
                }}
            >
                <SimpleBar
                    className={styles.task_list}
                    style={{ maxHeight: "100%" }}
                >
                    {visibleTaskTimeBlocks.map(t => (
                        <TaskBlock
                            key={t.task.id}
                            task={t.task}
                            timeBlock={t.timeBlock}
                            variant="backlogged"
                        />
                    ))}
                </SimpleBar>
            </div>
        </div>
    );
}