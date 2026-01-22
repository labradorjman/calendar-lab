import { Task } from "@/models/task";
import styles from "./Task.module.scss";
import { useRef } from "react";
import { useClickDrag } from "@/hooks/useClickDrag";
import { HoveredColumnState, useTaskContext } from "@/taskContext";

interface TaskProps extends React.HTMLAttributes<HTMLDivElement> {
    task: Task;
}

export default function TaskBlock({ task, style, ...props }: TaskProps) {
    const taskContext = useTaskContext();

    const taskRef = useRef<HTMLDivElement>(null);
    const columnsRef = useRef<NodeListOf<HTMLElement> | null>(null);
    const columnRectsRef = useRef<
        { id: string; rect: DOMRect }[]
    >([]);

    let placeholder: HTMLElement | null = null;
    let cursorOffsetTop: number = 0;
    let hoverState: HoveredColumnState = {
        columnId: null,
        columnRight: null,
        topOffset: null,
        columnContentTop: null,
    };

    useClickDrag(taskRef, {
        onDragStart: (_, pointerY) => {
            if (!taskRef.current) return;
            if (taskContext.draggedTaskRef.current) return;

            columnRectsRef.current = Array.from(
                document.querySelectorAll<HTMLElement>("[data-column]")
            ).map(element => ({
                id: element.dataset.column!,
                rect: element.getBoundingClientRect(),
            }));

            columnsRef.current = document.querySelectorAll("[data-column]");
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

            cursorOffsetTop = pointerY - rect.top;
        },
        onDragMove: (dx, dy, pointerX, pointerY) => {
            if (!placeholder) return;

            placeholder.style.transform = `translate(${dx}px, ${dy}px)`;

            let nextState: HoveredColumnState = {
                columnId: null,
                columnRight: null,
                topOffset: null,
                columnContentTop: null,
            };

            columnRectsRef.current.forEach(({ id, rect }) => {
                if (
                    pointerX >= rect.left &&
                    pointerX <= rect.right &&
                    pointerY >= rect.top &&
                    pointerY <= rect.bottom
                ) {
                    const screenTop = Math.max(rect.top, pointerY - cursorOffsetTop);
                    const localTop = screenTop - rect.top;

                    nextState = {
                        columnId: id,
                        columnRight: rect.left + rect.width,
                        topOffset: screenTop,
                        columnContentTop: localTop,
                    };
                }
            });

            hoverState = nextState;
            taskContext.setHoveredColumn(nextState);
        },
        onDragEnd: () => {
            taskContext.setHoveredColumn({
                columnId: null,
                columnRight: null,
                topOffset: null,
                columnContentTop: null,
            });

            taskContext.setDragDropColumn(hoverState);
            taskContext.draggedTaskRef.current = null;

            hoverState = {
                columnId: null,
                columnRight: null,
                topOffset: null,
                columnContentTop: null,
            };

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
            style={style}
            {...props}
        >
            <span className={styles.name}>{task.name}</span>
            <span className={styles.description}>{task.description}</span>
            {task.duration !== 0 && (
                <span className={styles.duration}>{task.duration}</span>
            )}
        </div>
    )
}