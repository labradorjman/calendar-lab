"use client";

import { Task } from "@/models/task";
import styles from "./SessionTask.module.scss";
import Icon from "@/components/ui/Icon";

interface SessionTaskProps {
    task: Task;
}

export default function SessionTask({ task }: SessionTaskProps) {
    const status = task.isCompleted
        ? `Completed · ${task.completedAt}`
        : `Incomplete`;

    return (
        <div className={styles.session_task}>
            <Icon
                className={styles.icon}
                icon="drag"
                size="sm"
            />
            <span className={styles.name}>{task.name}</span>
            <span className={styles.status}>{status}</span>
        </div>
    );
}