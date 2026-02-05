"use client";

import styles from "@/components/Backlog/Backlog.module.scss";
import Button from "@/ui/Button";
import { useEffect } from "react";
import { Task } from "@/models/task";
import TaskBlock from "@/components/tasks/TaskBlock";
import SimpleBar from "simplebar-react";
import { HoveredColumnState, useTaskContext } from "@/taskContext";
import { updateTask } from "@/services/tasks";
import useCalendarStore from "@/store";
import { handlePromise } from "@/utils/handleError";
import { useContextMenu } from "@/components/_layout/ContextMenu/ContextMenuContext";
import { useCalendarContext } from "@/context";
import { WorkSession } from "@/models/workSession";

export default function Backlog() {
    const { openContextMenu } = useContextMenu();
    const menuItems = [
        {
            id: "add-task",
            label: "Add Task",
            onSelect: () => {calendarContext.openTaskModal()},
        },
    ];

    const taskContext = useTaskContext();
    const [tasks, updateTasks] = useCalendarStore("tasks");
    const [_, updateWorkSessions] = useCalendarStore("work_sessions");

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

        fetchTasks();
        fetchWorkSessions();
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
            const [task, error] = await handlePromise(
                updateTask(
                    taskId,
                    { startsAt: null, isBacklogged: true }
                )
            );

            if (!task) {
                console.error(`Error updating task-{${taskId}}:`, error);
                return;
            }

            updateTasks(prev => 
                prev.map(t => t.id === task.id ? task : t)
            );
            console.log("Dropped task:", task.id, "at column", "backlog-column");
        }
    }

    const visibleTasks = tasks.filter(
        task =>
            task.isBacklogged ||
            task.startsAt === undefined
    );
    
    return (
        <div className={styles.backlog}>
            <div className={styles.header}>
                <span>Backlog</span>
                <Button
                    element="button"
                    size="sm"
                    onClick={() => {
                        calendarContext.openTaskModal();
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
                    {visibleTasks.map(task => (
                        <TaskBlock
                            key={task.id}
                            task={task}
                            variant="backlogged"
                        />
                    ))}
                </SimpleBar>
            </div>
        </div>
    );
}