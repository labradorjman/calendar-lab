import { Task } from "@/models/task";
import styles from "./Task.module.scss";
import { useRef } from "react";
import { useClickDrag } from "@/hooks/useClickDrag";
import { HoveredColumnState, useTaskContext } from "@/taskContext";
import { postgresTimestamptzToUnix } from "@/utils/time";
import { HourTime } from "@/utils/Time/HourTime";
import { CalendarDate } from "@/utils/Time/CalendarDate";
import { HEADER_HEIGHT } from "@/constants/column";
import { useContextMenu } from "@/components/_layout/ContextMenu/ContextMenuContext";
import { useScrollSyncContext } from "@/scrollSync/ScrollSyncContext";
import { deleteTask } from "@/services/tasks";
import { removeTaskFromStore } from "@/store/tasks";

interface TaskProps extends React.HTMLAttributes<HTMLDivElement> {
    task: Task;
    calendarDate?: CalendarDate;
    variant?: "default" | "backlogged";
}

export default function TaskBlock({ task, calendarDate, variant = "default", style, ...props }: TaskProps) {
    const { openContextMenu } = useContextMenu();
    const menuItems = [
        {
            id: "edit-task",
            label: "Edit Task",
            onSelect: () => {},
        },
        {
            id: "delete-task",
            label: "Delete Task",
            onSelect: async () => {
                await deleteTask(task.id);
                removeTaskFromStore(task.id);
            },
        },
    ];

    const scrollContext = useScrollSyncContext();
    const taskContext = useTaskContext();

    const tzOffsetSeconds = calendarDate?.tzOffsetSeconds ?? 0;
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
            placeholder.classList.add(styles.placeholder);
            placeholder.style.position = "fixed";
            placeholder.style.left = `${rect.left}px`;
            placeholder.style.top = `${rect.top}px`;
            placeholder.style.width = `${rect.width}px`;
            placeholder.style.height = `80px`;
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

            columnRectsRef.current.forEach(({ id, rect}) => {
                if (
                    pointerX >= rect.left &&
                    pointerX <= rect.right &&
                    pointerY >= rect.top &&
                    pointerY <= rect.bottom
                ) {
                    const scrollElement = scrollContext.get(id)?.getScrollElement();
                    const scrollTop = scrollElement?.scrollTop ?? 0;

                    const screenTop = Math.max(rect.top, pointerY - cursorOffsetTop);
                    const localTop = screenTop - HEADER_HEIGHT + scrollTop;
                    nextState = {
                        columnId: id,
                        columnRight: rect.left + rect.width,
                        topOffset: screenTop,
                        columnContentTop: localTop,
                    };
                }
            })
            // console.log("Top offset:", nextState.topOffset, "Column content top:", nextState.columnContentTop);
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

    const startUnix = task.startsAt
        ? postgresTimestamptzToUnix(task.startsAt)
        : null;

    const endUnix = task.startsAt && task.duration > 0
        ? startUnix! + task.duration
        : null;

    /*  -----------------
    *   DayColumn variant
    */
    if (variant === "default") {
        const showTime = !task.isBacklogged && startUnix && endUnix;

    const timeText = showTime
        ? `${HourTime.fromUnix(startUnix + tzOffsetSeconds).Time12} - ${
            HourTime.fromUnix(endUnix + tzOffsetSeconds).Time12WithSuffix
        }`
        : null;

        return (
            <div 
                className={styles.task_wrapper}
                style={style}
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
                <div 
                    ref={taskRef}
                    className={styles.task}
                    {...props}
                >
                    <span className={styles.name}>{task.name}</span>
                    {timeText && (
                        <span className={styles.time}>{timeText}</span>
                    )}

                    {task.duration !== 0 && (
                        <span className={styles.duration}>{(task.duration / 60)} mins</span>
                    )}
                </div>
            </div>
        );
    }

    /*  ------------------
    *   Backlogged variant
    */
    return (
        <div 
            ref={taskRef}
            className={styles.task_backlogged}
            style={style}
            onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();

                openContextMenu({
                    x: e.clientX,
                    y: e.clientY,
                    items: menuItems,
                });
            }}
            {...props}
        >
            <span className={styles.name}>{task.name}</span>
            <span className={styles.description}>{task.description}</span>
            {task.duration !== 0 && (
                <span className={styles.duration}>{(task.duration / 60)} mins</span>
            )}
        </div>
    );
}