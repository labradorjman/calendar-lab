"use client";

import styles from "@/components/Backlog/Backlog.module.scss";
import Button from "@/ui/Button";
import { useEffect, useState } from "react";
import TaskModal from "@/components/tasks/Modal";
import { Task } from "@/models/task";
import TaskBlock from "@/components/tasks/TaskBlock";
import SimpleBar from "simplebar-react";
import { useTaskContext } from "@/taskContext";
import { updateTask } from "@/services/tasks";

export default function Backlog() {
    const taskContext = useTaskContext();

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [tasks, setTasks] = useState<Task[]>([]);

    useEffect(() => {
        async function fetchTasks() {
            const res = await fetch("/api/tasks");
            const data: Task[] = await res.json();
            setTasks(data);
        }

        fetchTasks();
    }, []);

        useEffect(() => {
        if (!taskContext.subscribeDragDropColumn) return;

        const unsubscribe = taskContext.subscribeDragDropColumn((id) => {
            if (id !== "backlog-column") return;
            if (taskContext.draggedTaskRef.current) {
                (async () => {
                    try {
                        const task = await updateTask(
                            taskContext.draggedTaskRef.current!.id,
                            { isBacklogged: true }
                        );
                        console.log("Dropped task:", task.id, "at column", "backlog-column");
                    } catch (err) {
                        console.error("Failed to update task:", err);
                    }
                })();
            }
        });
        return () => unsubscribe();
    }, [taskContext]);

    
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
                    {tasks.map(task => (
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
                    setTasks(prev => [...prev, newTask]);
                }}
            />
        </div>
    );
}