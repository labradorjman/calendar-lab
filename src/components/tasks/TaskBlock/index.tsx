import { Task } from "@/models/task";
import styles from "./TaskBlock.module.scss";
import {  useRef } from "react";
import { useClickDrag } from "@/hooks/useClickDrag";
import { TaskDragState as TaskDragState, useTaskContext } from "@/taskContext";
import { formatDuration, get24HourMinuteFromOffset, postgresTimestamptzToUnix, secondsToOffset } from "@/utils/time";
import { HourTime } from "@/utils/Time/HourTime";
import { CalendarDate } from "@/utils/Time/CalendarDate";
import { HEADER_HEIGHT, HOUR_HEIGHT } from "@/constants/column";
import { useContextMenu } from "@/components/_layout/ContextMenu/ContextMenuContext";
import { deleteTask } from "@/services/taskService";
import { removeTaskFromStore } from "@/store/tasks";
import { TimeBlock } from "@/models/timeBlock";
import { useCalendarContext } from "@/context";
import { handlePromise } from "@/utils/handleError";
import { removeTimeBlockFromStore } from "@/store/timeBlocks";
import { useTimeBlockContext } from "@/timeBlockContext";
import { taskToKey } from "@/utils/objectToKey";

interface TaskProps extends React.HTMLAttributes<HTMLDivElement> {
    task: Task;
    timeBlock?: TimeBlock;
    calendarDate?: CalendarDate;
    variant?: "default" | "backlogged";
}

// Height of placeholder object
const FIXED_PLACEHOLDER_HEIGHT = 85;

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

    const taskContext = useTaskContext();

    const tzOffsetSeconds = calendarDate?.tzOffsetSeconds ?? 0;
    const taskRef = useRef<HTMLDivElement>(null);
    const hoverableRectsRef = useRef<
        { id: string; rect: DOMRect; dayStartUnix?: number; }[]
    >([]);

    const placeHolderCenter = (FIXED_PLACEHOLDER_HEIGHT / 2);
    const startLeftRef = useRef(0);
    const startTopRef = useRef(0);
    const scrollDeltaRef = useRef(0);
    let dragState: TaskDragState = {
        hoverId: null,
        taskTop: null,
        skeletonTop: null,
        skeletonHeight: null,
    };

    useClickDrag(taskRef, {
        onDragStart: (_, pointerY) => {
            if (!taskRef.current || taskContext.draggedTaskRef.current) return;

            scrollDeltaRef.current = calendarContext.getScrollTop();

            hoverableRectsRef.current = Array.from(
                document.querySelectorAll<HTMLElement>("[data-hover-id]")
            ).map(element => ({
                id: element.dataset.hoverId!,
                rect: element.getBoundingClientRect(),
                dayStartUnix: element.dataset.unixStart
                    ? parseInt(element.dataset.unixStart, 10)
                    : undefined,
            }));

            taskContext.draggedTaskRef.current = { task, timeBlock }

            const rect = taskRef.current.getBoundingClientRect();
            startLeftRef.current = rect.left;
            startTopRef.current = pointerY - placeHolderCenter;
            
            taskContext.placeholder.show({
                left: rect.left,
                top: startTopRef.current,
                width: rect.width,
                height: FIXED_PLACEHOLDER_HEIGHT,
                bgColor: "#693a85",
            });

            taskRef.current.classList.add(styles.hidden);
            taskRef.current.style.pointerEvents = "none";
        },
        onDragMove: (dx, dy, pointerX, pointerY) => {
            let match: TaskDragState | null = null;
            taskContext.placeholder.move(startTopRef.current + dy, startLeftRef.current + dx);

            const currentScrollDelta = calendarContext.getScrollTop();
                
            const taskLocalTop = Math.max(HEADER_HEIGHT, pointerY - placeHolderCenter) + currentScrollDelta;
            const localPointerY = taskLocalTop + placeHolderCenter;
            
            for (const { id, rect, dayStartUnix } of hoverableRectsRef.current) {
                if (id === taskToKey(task)) {
                    continue;
                }

                const isWorkSession = id.startsWith("ws-");
                const isDayColumn = id.startsWith("date-");
                const isBacklog = id === "backlog-column";
                
                const isColumn = isDayColumn || isBacklog;
                const offset = isColumn ? 0 : (scrollDeltaRef.current ?? 0);

                const rectTop = rect.top + offset;
                const rectBottom = rect.bottom + offset;

                const pointerTop = isColumn ? pointerY : localPointerY;
                const pointerBottom = isColumn ? pointerY : taskLocalTop;

                const isInsideRef =
                    pointerX >= rect.left &&
                    pointerX <= rect.right &&
                    pointerTop >= rectTop &&
                    pointerBottom <= rectBottom;

                if (isInsideRef) {
                    // Snapped time accounting for overlap
                    const clampedTop  = Math.min(HOUR_HEIGHT * 24, taskLocalTop - placeHolderCenter);
                    const finalTop = isDayColumn ? getFinalTop(clampedTop, dayStartUnix!) : localPointerY;

                    let skeletonTop: number | null = null;
                    let skeletonHeight: number | null = null;

                    if (timeBlock && timeBlock.duration > 0) {
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

                        if (isWorkSession) {
                            textDisplay = "Work session";
                        }

                        if (isDayColumn) {
                            skeletonTop = finalTop;
                            skeletonHeight = timeBlock ? (HOUR_HEIGHT / 60) * (timeBlock.duration / 60) : null;
                        }

                        taskContext.placeholder.update({ timeDisplay: textDisplay});
                    }
                    
                    match = {
                        hoverId: id,
                        taskTop: finalTop,
                        skeletonTop,
                        skeletonHeight,
                    };
                }
            };

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
            taskContext.placeholder.hide();

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

            if (taskRef.current) {
                taskRef.current.classList.remove(styles.hidden);
                taskRef.current.style.pointerEvents = "auto";
            }
        },
    });

    function getFinalTop(top: number, dayStartUnix: number): number | null {
        if (!timeBlock?.duration) return null;

        const { hour24, minute } = get24HourMinuteFromOffset(Math.max(0, top));
        const hourTime = new HourTime(hour24, minute);
        const dayEndUnix = dayStartUnix + 86400;

        // Clamp to day boundary
        const taskStartUnix = Math.min(
            dayStartUnix + hourTime.toSecondsSince(),
            dayEndUnix - timeBlock.duration
        );

        // Resolve collision
        const hasOverlap = timeBlockContext.hasCollision(taskStartUnix, timeBlock.duration, task.id);
        const resolvedStart = hasOverlap
            ? timeBlockContext.findClosestAvailableStart(taskStartUnix, timeBlock.duration, task.id)
            : taskStartUnix;

        if (resolvedStart == null) return null;

        const taskFinalSeconds = resolvedStart - dayStartUnix;
        if (taskFinalSeconds < 0) return null;

        return secondsToOffset(taskFinalSeconds);
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
                data-hover-id={taskToKey(task)}
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
                        <span className={styles.duration}>{formatDuration(timeBlock.duration)}</span>
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
                <span className={styles.duration}>{formatDuration(timeBlock.duration)}</span>
            )}
        </div>
    );
}