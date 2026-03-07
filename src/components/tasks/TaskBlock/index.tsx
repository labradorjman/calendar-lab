import { Task } from "@/models/task";
import styles from "./Task.module.scss";
import { useEffect, useRef } from "react";
import { useClickDrag } from "@/hooks/useClickDrag";
import { TaskDragState as TaskDragState, useTaskContext } from "@/taskContext";
import { get24HourMinuteFromOffset, postgresTimestamptzToUnix, secondsToOffset } from "@/utils/time";
import { HourTime } from "@/utils/Time/HourTime";
import { CalendarDate } from "@/utils/Time/CalendarDate";
import { HEADER_HEIGHT, HOUR_HEIGHT, SNAP_MINUTES } from "@/constants/column";
import { useContextMenu } from "@/components/_layout/ContextMenu/ContextMenuContext";
import { useScrollSyncContext } from "@/scrollSync/ScrollSyncContext";
import { deleteTask } from "@/services/taskService";
import { removeTaskFromStore } from "@/store/tasks";
import { TimeBlock } from "@/models/timeBlock";
import { useCalendarContext } from "@/context";
import { handlePromise } from "@/utils/handleError";
import { removeTimeBlockFromStore } from "@/store/timeBlocks";
import { useTimeBlockContext } from "@/timeBlockContext";

interface TaskProps extends React.HTMLAttributes<HTMLDivElement> {
    task: Task;
    timeBlock?: TimeBlock;
    calendarDate?: CalendarDate;
    variant?: "default" | "backlogged";
}

// Height of placeholder object
const FIXED_PLACEHOLDER_HEIGHT = 80;

export default function TaskBlock({ task, timeBlock, calendarDate, variant = "default", style, ...props }: TaskProps) {
    const calendarContext = useCalendarContext();
    const timeBlockContext = useTimeBlockContext();

    const { openContextMenu } = useContextMenu();
    const menuItems = [
        {
            id: "edit-task",
            label: "Edit Task",
            onSelect: () => {calendarContext.openTaskModal({
                mode: "edit",
                task,
                timeBlock,
            })},
        },
        {
            id: "delete-task",
            label: "Delete Task",
            onSelect: async () => {
                const [response, error] = await handlePromise(
                    deleteTask(task.id)
                )
                
                if (error) {
                    console.error(`[Task Block] Erorr deleting task. ${error}`);
                    return;
                }

                if (response?.deletedTaskId) {
                    removeTaskFromStore(response.deletedTaskId);
                }

                if (response?.deletedTimeBlockId) {
                    removeTimeBlockFromStore(response.deletedTimeBlockId);
                }
            },
        },
    ];

    const scrollContext = useScrollSyncContext();
    const taskContext = useTaskContext();

    const tzOffsetSeconds = calendarDate?.tzOffsetSeconds ?? 0;
    const taskRef = useRef<HTMLDivElement>(null);
    const hoverablesRef = useRef<NodeListOf<HTMLElement> | null>(null);
    const hoverableRectsRef = useRef<
        { id: string; rect: DOMRect; dayStartUnix?: number; }[]
    >([]);

    let placeholder: HTMLElement | null = null;
    let placeHolderTop = 0;
    let cursorOffsetTop = 0;
    let dragState: TaskDragState = {
        hoverId: null,
        taskTop: null,
        skeletonTop: null,
        skeletonHeight: null,
    };

    useClickDrag(taskRef, {
        onDragStart: (_, pointerY) => {
            if (!taskRef.current || taskContext.draggedTaskRef.current) return;

            hoverableRectsRef.current = Array.from(
                document.querySelectorAll<HTMLElement>("[data-hover-id]")
            ).map(element => ({
                id: element.dataset.hoverId!,
                rect: element.getBoundingClientRect(),
                dayStartUnix: element.dataset.unixStart
                    ? parseInt(element.dataset.unixStart, 10)
                    : undefined,
            }));

            hoverablesRef.current = document.querySelectorAll("[data-hover-id]");
            taskContext.draggedTaskRef.current = { task, timeBlock }
            const rect = taskRef.current.getBoundingClientRect();

            // Recenter placeholder to be on top of cursor
            placeHolderTop = pointerY >= rect.top + (FIXED_PLACEHOLDER_HEIGHT / 2)
                ? pointerY - (FIXED_PLACEHOLDER_HEIGHT / 2)
                : rect.top;

            placeholder = taskRef.current.cloneNode(true) as HTMLElement;
            placeholder.classList.add(styles.placeholder);
            placeholder.style.position = "fixed";
            placeholder.style.left = `${rect.left}px`;
            placeholder.style.top = `${placeHolderTop}px`;
            placeholder.style.width = `${rect.width}px`;
            placeholder.style.height = `${FIXED_PLACEHOLDER_HEIGHT}px`;
            placeholder.style.zIndex = "9999";
            placeholder.style.pointerEvents = "none";
            document.body.appendChild(placeholder);

            taskRef.current.classList.add(styles.hidden);
            taskRef.current.style.pointerEvents = "none";

            cursorOffsetTop = pointerY - placeHolderTop;
        },
        onDragMove: (dx, dy, pointerX, pointerY) => {
            if (!placeholder) return;

            placeholder.style.transform = `translate(${dx}px, ${dy}px)`;

            // Priority match refers to the work session inside of the day column bounding rect
            let match: TaskDragState | null = null;
            
            hoverableRectsRef.current.forEach(({ id, rect, dayStartUnix }) => {
                const isInsideRef =
                    pointerX >= rect.left &&
                    pointerX <= rect.right &&
                    pointerY >= rect.top &&
                    pointerY <= rect.bottom;

                if (isInsideRef) {
                    const scrollElement = scrollContext.get(id)?.getScrollElement();
                    const scrollTop = scrollElement?.scrollTop ?? 0;

                    if (rect.bottom > HEADER_HEIGHT) {
                        const screenTop = Math.max(rect.top, pointerY - cursorOffsetTop);
                        const topRaw = Math.max(0, screenTop - HEADER_HEIGHT + scrollTop);

                        const isWorkSession = id.startsWith("ws-");
                        const isDayColumn = id.startsWith("date-");
                        const isBacklog = id === "backlog-column";

                        // Snapped time accounting for overlap
                        const finalTop = isDayColumn ? getFinalTop(topRaw, dayStartUnix!) : topRaw;

                        let skeletonTop: number | null = null;
                        let skeletonHeight: number | null = null;

                        if (timeBlock && timeBlock.duration > 0) {
                            const descriptionElement = placeholder?.querySelector(`.${styles.description}`);
                            descriptionElement?.remove();

                            // Set the text visual for time snapping
                            let timeElement = placeholder?.querySelector(`.${styles.time}`) as HTMLElement | null;

                            if (!timeElement) {
                                timeElement = document.createElement("span");
                                timeElement.className = styles.time;

                                const nameElement = placeholder?.querySelector(`.${styles.name}`);

                                if (nameElement?.parentNode) {
                                    nameElement.parentNode.insertBefore(timeElement, nameElement.nextSibling);
                                }
                            }

                            let textDisplay = "";
                            if (finalTop != null) {
                                const { hour24, minute } = get24HourMinuteFromOffset(finalTop);
                                const hourTime = new HourTime(hour24, minute);
                                const endHourTime = hourTime.addMinutes(timeBlock.duration / 60);

                                textDisplay = `${hourTime.Time12} - ${endHourTime.Time12WithSuffix}`;
                            }

                            if (isBacklog) {
                                textDisplay = "Backlog";
                            }

                            if (isDayColumn) {
                                skeletonTop = finalTop;
                                skeletonHeight = timeBlock ? (HOUR_HEIGHT / 60) * (timeBlock.duration / 60) : null;
                            }

                            timeElement.textContent = textDisplay;
                        }
                      
                        const newMatch = {
                            hoverId: id,
                            taskTop: finalTop,
                            skeletonTop: skeletonTop,
                            skeletonHeight: skeletonHeight,
                        };

                        if (isWorkSession || !match) {
                            match = newMatch;
                        }
                    }
                }
            });

            const nextState: TaskDragState =
                match ?? {
                    hoverId: null,
                    taskTop: null,
                    skeletonTop: null,
                    skeletonHeight: null,
                };

            dragState = nextState;
            taskContext.setTaskDragState(nextState);
        },
        onDragEnd: () => {
            taskContext.setTaskDropState({
                ...dragState,
                skeletonTop: null,
                skeletonHeight: null,
            });
            taskContext.draggedTaskRef.current = null;

            dragState = {
                hoverId: null,
                taskTop: null,
                skeletonTop: null,
                skeletonHeight: null,
            };

            if (placeholder) {
                placeholder.remove();
                placeholder = null;
            }

            if (taskRef.current) {
                taskRef.current.classList.remove(styles.hidden);
                taskRef.current.style.pointerEvents = "auto";
            }
        },
    });

    function getFinalTop(rawTop: number, dayStartUnix: number): number | null {
        if (!timeBlock?.duration) {
            return null;
        }

        const { hour24, minute } = get24HourMinuteFromOffset(rawTop);
        const hourTime = new HourTime(hour24, minute);

        const taskStartUnix = dayStartUnix + hourTime.toSecondsSince();

        const hasOverlap = timeBlockContext.hasCollision(
            taskStartUnix,
            timeBlock.duration,
            task.id
        );

        let potentialStartUnix: number | null = null;
        
        if (hasOverlap) {
            potentialStartUnix = timeBlockContext.findClosestAvailableStart(
                taskStartUnix,
                timeBlock.duration,
                task.id
            );
        }

        if (hasOverlap && potentialStartUnix == null) {
            return null;
        }

        const startUnix = hasOverlap ? potentialStartUnix! : taskStartUnix;
        const taskFinalSeconds = startUnix - dayStartUnix;

        if (taskFinalSeconds < 0) return null;

        const finalTop = secondsToOffset(taskFinalSeconds);
        return finalTop;
    }

    const startUnix = timeBlock?.startsAt
        ? postgresTimestamptzToUnix(timeBlock.startsAt)
        : null;
    const endUnix = timeBlock && timeBlock.duration > 0
        ? startUnix! + timeBlock.duration
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

                    {timeBlock && timeBlock.duration !== 0 && (
                        <span className={styles.duration}>{(timeBlock.duration / 60)} mins</span>
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
            {timeBlock && timeBlock.duration !== 0 && (
                <span className={styles.duration}>{(timeBlock.duration / 60)} mins</span>
            )}
        </div>
    );
}