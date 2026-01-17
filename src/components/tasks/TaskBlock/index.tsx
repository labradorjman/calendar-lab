import { Task } from "@/models/task";
import styles from "./Task.module.scss";
import { useRef } from "react";
import { useClickDrag } from "@/hooks/useClickDrag";
import { useTaskContext } from "@/taskContext";

interface TaskProps {
    task: Task;
}

export default function TaskBlock({ task }: TaskProps) {
    const taskContext = useTaskContext();

    const taskRef = useRef<HTMLDivElement>(null);
    // const originalPosRef = useRef<{ x: number; y: number } | null>(null);

    const columnsRef = useRef<NodeListOf<HTMLElement> | null>(null);
    let placeholder: HTMLElement | null = null;

    useClickDrag(taskRef, {
        onDragStart: () => {
            if (!taskRef.current) return;
            if (taskContext.draggedTaskRef.current) return;

            columnsRef.current = document.querySelectorAll("[data-day-column");
            taskContext.draggedTaskRef.current = task;
            const rect = taskRef.current.getBoundingClientRect();

            placeholder = taskRef.current.cloneNode(true) as HTMLElement;
            placeholder.style.position = "fixed";
            placeholder.style.left = `${rect.left}px`;
            placeholder.style.top = `${rect.top}px`;
            placeholder.style.width = `${rect.width}px`;
            placeholder.style.zIndex = "9999";
            placeholder.style.pointerEvents = "none";
            document.body.appendChild(placeholder);

            taskRef.current.classList.add(styles.skeleton);
            taskRef.current.style.pointerEvents = "none";
        },
        onDragMove: (dx, dy, pointerX, pointerY) => {
            if (!placeholder) return;
            placeholder.style.transform = `translate(${dx}px, ${dy}px)`;

            let hoveredId: string | null = null;
            
            columnsRef.current?.forEach((element) => {
                const rect = element.getBoundingClientRect();

                if (
                    pointerX >= rect.left &&
                    pointerX <= rect.right &&
                    pointerY >= rect.top &&
                    pointerY <= rect.bottom
                ) {
                    hoveredId = element.getAttribute("data-day-column");
                }
            });

            taskContext.setHoveredColumn(hoveredId);
        },
        onDragEnd: () => {
            taskContext.draggedTaskRef.current = null;
            taskContext.setHoveredColumn(null);

            if (placeholder) {
                placeholder.remove();
                placeholder = null;
            }

            if (taskRef.current) {
                taskRef.current.classList.remove(styles.skeleton);
                taskRef.current.style.pointerEvents = "auto";
            }
        },
    });

    return (
        <div 
            ref={taskRef}
            className={styles.task}
        >
            <span className={styles.name}>{task.name}</span>
            <span className={styles.description}>{task.description}</span>
            {task.duration !== 0 && (
                <span className={styles.duration}>{task.duration}</span>
            )}
        </div>
    )
}