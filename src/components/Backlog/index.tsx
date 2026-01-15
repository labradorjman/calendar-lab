"use client";

import styles from "@/components/Backlog/Backlog.module.scss";
import Button from "@/ui/Button";
import { useEffect, useState } from "react";
import TaskModal from "@/components/tasks/Modal";
import { Task } from "@/models/task";
import TaskBlock from "@/components/tasks/TaskBlock";
import SimpleBar from "simplebar-react";

export default function Backlog() {
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
            <div className={styles.task_area}>
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