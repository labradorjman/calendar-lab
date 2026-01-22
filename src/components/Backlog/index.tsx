"use client";

import styles from "@/components/Backlog/Backlog.module.scss";
import Button from "@/ui/Button";
import { useEffect, useState } from "react";
import TaskModal from "@/components/tasks/Modal";
import { Task } from "@/models/task";
import TaskBlock from "@/components/tasks/TaskBlock";
import SimpleBar from "simplebar-react";
import { HoveredColumnState, useTaskContext } from "@/taskContext";
import { updateTask } from "@/services/tasks";
import useCalendarStore from "@/store";
import { handlePromise } from "@/utils/handleError";

export default function Backlog() {
    const taskContext = useTaskContext();
    const [tasks, updateTasks] = useCalendarStore("tasks");

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    useEffect(() => {
        async function fetchTasks() {
            const res = await fetch("/api/tasks");
            const data: Task[] = await res.json();
            
            updateTasks(() => data);
        }

        fetchTasks();
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
                        setIsModalOpen(true);
                    }}
                >
                    +
                </Button>
            </div>
            <div
                className={styles.task_area}
                data-column={"backlog-column"}
            >
                <SimpleBar
                    className={styles.task_list}
                    style={{ maxHeight: "100%" }}
                >
                    {visibleTasks.map(task => (
                        <TaskBlock
                            key={task.id}
                            task={task}
                        />
                    ))}
                </SimpleBar>
            </div>
            <TaskModal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onTaskCreated={(newTask: Task) => {
                    updateTasks(prev => [...prev, newTask]);
                }}
            />
        </div>
    );
}