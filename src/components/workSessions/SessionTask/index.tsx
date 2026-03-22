"use client";

import { Task } from "@/models/task";
import styles from "./SessionTask.module.scss";
import Icon from "@/components/ui/Icon";
import { useClickDrag } from "@/hooks/useClickDrag";
import { useRef } from "react";

interface SessionTaskProps {
    task: Task;
    onDragDrop: (dragStartIndex: number, dragEndIndex: number) => void;
}

export default function SessionTask({ task, onDragDrop }: SessionTaskProps) {
    const status = task.isCompleted
        ? `Completed · ${task.completedAt}`
        : `Incomplete`;

    const isDragHandle = useRef(false);
    const taskRef = useRef<HTMLDivElement>(null);
    let dragStartIndex = 0;
    let dragEndIndex = 0;

    let placeholder: HTMLElement | null = null;
    const sessionTasksRef = useRef<
        { orderIndex: number; rect: DOMRect; element: HTMLElement; }[]
    >([]);

    useClickDrag(taskRef, {
        onDragStart: () => {
            if (!taskRef.current || !isDragHandle.current) return;
            isDragHandle.current = false;

            dragStartIndex = task.orderIndex;
            dragEndIndex = task.orderIndex;

            sessionTasksRef.current = Array.from(
                document.querySelectorAll<HTMLElement>("[data-session-order]")
            ).map(element => ({
                orderIndex: Number(element.dataset.sessionOrder!),
                rect: element.getBoundingClientRect(),
                element,
            }));

            const rect = taskRef.current.getBoundingClientRect();

            placeholder = taskRef.current.cloneNode(true) as HTMLElement;
            placeholder.classList.add(styles.placeholder);
            placeholder.style.position = "fixed";
            placeholder.style.left = `${rect.left}px`;
            placeholder.style.top = `${rect.top}px`;
            placeholder.style.width = `${rect.width}px`;
            placeholder.style.height = `${rect.height}px`;
            placeholder.style.zIndex = "9999";
            placeholder.style.pointerEvents = "none";
            document.body.appendChild(placeholder);

            taskRef.current.classList.add(styles.dragging);
            taskRef.current.style.pointerEvents = "none";
        },
        onDragMove: (_, dy, pointerX, pointerY) => {
            if (!placeholder) return;
            
            placeholder.style.transform = `translate(0, ${dy}px)`;
            for (const { orderIndex, rect, element } of sessionTasksRef.current) {
                const isInsideRef =
                    pointerX >= rect.left &&
                    pointerX <= rect.right &&
                    pointerY >= rect.top &&
                    pointerY <= rect.bottom;

                if (isInsideRef) {
                    if (dragStartIndex !== orderIndex) {
                        dragEndIndex = orderIndex;

                        element.classList.add(
                            dragStartIndex > dragEndIndex
                                ? styles.drag_over_top
                                : styles.drag_over_bottom
                        );
                    }
                } else {
                    element.classList.remove(styles.drag_over_top);
                    element.classList.remove(styles.drag_over_bottom);
                }
            };
        },
        onDragEnd: () => {
            isDragHandle.current = false;
            
            if (placeholder) {
                placeholder.remove();
                placeholder = null;
            }

            if (taskRef.current) {
                taskRef.current.classList.remove(styles.dragging);
                taskRef.current.style.pointerEvents = "auto";
            }

            for (const { element } of sessionTasksRef.current) {
                element.classList.remove(styles.drag_over_top);
                element.classList.remove(styles.drag_over_bottom);
            }

            onDragDrop(dragStartIndex, dragEndIndex);
        },
    });

    return (
        <div
            ref={taskRef}
            className={styles.session_task}
            data-session-order={task.orderIndex}
        >
            <Icon
                className={styles.icon}
                icon="drag"
                size="sm"
                onPointerDown={() => {
                    isDragHandle.current = true;
                    document.body.classList.add("grabbing");

                    const onPointerUp = () => {
                        document.body.classList.remove("grabbing");
                        document.removeEventListener("pointerup", onPointerUp);
                    };
                    document.addEventListener("pointerup", onPointerUp);
                }}
            />
            <span className={styles.name}>{task.name}</span>
            <span className={styles.status}>{status}</span>
        </div>
    );
}