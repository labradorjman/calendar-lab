"use client";

import { Task } from "@/models/task";
import styles from "./SessionTask.module.scss";
import Icon from "@/components/ui/Icon";
import { useClickDrag } from "@/hooks/useClickDrag";
import { useRef } from "react";
import EditableSpan from "@/components/ui/EditableSpan";
import Button from "@/components/ui/Button";
import { handlePromise } from "@/utils/handleError";
import { updateTask } from "@/services/taskService";
import useCalendarStore from "@/store";
import { useWorkSessionContext } from "@/workSessionContext";

interface SessionTaskProps {
    task: Task;
    onDragDrop: (dragStartIndex: number, dragEndIndex: number) => void;
    isEdit: boolean;
}

export default function SessionTask({ task, onDragDrop, isEdit }: SessionTaskProps) {
    const status = task.isCompleted
        ? `Completed`
        : `Incomplete`;

    const { push } = useWorkSessionContext();

    const [, updateTasks] = useCalendarStore("tasks");

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

    const handleCompleteToggle = async () => {
        console.log("complete button");
        const newState = !task.isCompleted;
        const [response, error] = await handlePromise(
            updateTask(task.id, {
                task: {
                    isCompleted: newState,
                    completedAt: newState
                        ? new Date().toISOString()
                        : null
                }
            })
        );

        if (!response) {
            console.error(`[SessionTask] Error toggling complete state - task [${task.id}]:`, error);
            return;
        }

        updateTasks(prev => 
            prev.map(t => t.id === response.task.id ? response.task : t)
        );
    }

    return (
        <div
            ref={taskRef}
            className={`${styles.session_task} ${isEdit ? styles.editing : ""}`}
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
            <EditableSpan
                className={styles.session_name}
                value={task.name}
                editable={isEdit}
                onChange={(value) => push({ type: "TASK_NAME", taskId: task.id, value })}
            />
            <span className={[
                styles.status,
                task.isCompleted ? styles.completed : ""]
            .join(" ")}>
                {status}
            </span>
            
            <div className={styles.button}>
                {isEdit ? (
                    <Button
                        element="button"
                        variant="transparent"
                        size="min"
                        onClick={() => push({ type: "TASK_DELETE", taskId: task.id })}
                    >
                        <Icon icon="x" size="sm" />
                    </Button>
                ) : (
                    <Button
                        element="button"
                        variant="transparent"
                        size="min"
                        onClick={handleCompleteToggle}
                    >
                        <Icon icon="tick" size="sm"/>
                    </Button>
                )}


            </div>
        </div>
    );
}