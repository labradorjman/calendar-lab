import { Task } from "@/models/task";
import styles from "./Task.module.scss";

interface TaskProps {
    task: Task;
}

export default function TaskBlock({ task }: TaskProps) {
    return (
        <div className={styles.task}>
            <span className={styles.name}>{task.name}</span>
            <span className={styles.description}>{task.description}</span>
            {task.duration !== 0 && (
                <span className={styles.duration}>{task.duration}</span>
            )}
        </div>
    )
}