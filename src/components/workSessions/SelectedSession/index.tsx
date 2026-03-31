"use client";

import { useCalendarContext } from "@/context";
import styles from "./SelectedSession.module.scss";
import SessionTask from "@/components/workSessions/SessionTask";
import { useEffect, useState } from "react";
import { patchTasks } from "@/services/taskService";
import { handlePromise } from "@/utils/handleError";
import useCalendarStore from "@/store";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import EditableSpan from "@/components/ui/EditableSpan";
import { workSessionToKey } from "@/utils/objectToKey";

export default function SelectedSession() {
    const calendarContext = useCalendarContext();
    const selection = calendarContext.workSessionSelection;

    const [isEdit, setIsEdit] = useState(false);
    const [_, updateTasks] = useCalendarStore("tasks");
    
    if (selection == null) return null;

    const { workSession, tasks } = selection;
    const [sortedTasks, setSortedTasks] = useState(() =>
        tasks.toSorted((a, b) => a.orderIndex - b.orderIndex)
    );

    useEffect(() => {
        setSortedTasks(tasks.toSorted((a, b) => a.orderIndex - b.orderIndex));
    }, [selection.workSession.id, selection.tasks]);

    useEffect(() => {
        setIsEdit(false);
    }, [selection.workSession.id]);

    useEffect(() => {
        if (isEdit) return;

        function handleClickOutside(event: MouseEvent) {
            const target = event.target as HTMLElement;

            if (target.closest('[data-target="side_panel"]') ||
                target.closest(`[data-hover-id="${workSessionToKey(workSession)}"]`)
            ) {
                return;
            }

            calendarContext.setWorkSessionSelection(null);
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isEdit, calendarContext.setWorkSessionSelection]);

    const handleReorder = async (dragStartIndex: number, dragEndIndex: number) => {
        if (dragStartIndex === dragEndIndex) return;

        const reordered = sortedTasks.map(task => {
            if (task.orderIndex === dragStartIndex) {
                return { ...task, orderIndex: dragEndIndex };
            }
            if (dragStartIndex < dragEndIndex && task.orderIndex > dragStartIndex && task.orderIndex <= dragEndIndex) {
                return { ...task, orderIndex: task.orderIndex - 1 };
            }
            if (dragStartIndex > dragEndIndex && task.orderIndex < dragStartIndex && task.orderIndex >= dragEndIndex) {
                return { ...task, orderIndex: task.orderIndex + 1 };
            }
            return task;
        }).toSorted((a, b) => a.orderIndex - b.orderIndex);

        const orderChanges = reordered
            .filter(task => {
                const original = sortedTasks.find(p => p.id === task.id);
                return task.orderIndex !== original?.orderIndex;
            })
            .map(t => ({
                id: t.id,
                changes: {
                    orderIndex: t.orderIndex
                }
            }));

        setSortedTasks(reordered);

        if (orderChanges.length > 0) {
            const [updatedTasks, error] = await handlePromise(
                patchTasks(orderChanges)
            );

            if (!updatedTasks) {
                console.error("[SelectedSession] Unable to reorder tasks. Error:", error);
                return;
            }

            updateTasks(prev =>
                prev.map(task => {
                    const updated = updatedTasks.find(t => t.id === task.id);
                    return updated ?? task;
                })
            );
        }
    };

    return (
        <div className="w-full h-full flex flex-col gap-2">
            <div className="flex flex-row gap-2 items-center">
                <EditableSpan
                    className={styles.session_name}
                    value={workSession.name}
                    editable={isEdit}
                />
                {!isEdit ? (
                    <Button
                        className="right-0"
                        element="button"
                        variant="outline"
                        size="min"
                        onClick={() => {setIsEdit(prev => !prev)}}
                    >
                        <Icon icon="edit_pencil" size="sm" />
                    </Button>
                    ) : (
                        <Button
                            className="right-0"
                            element="button"
                            variant="outline"
                            size="min"
                            onClick={() => {setIsEdit(prev => !prev)}}
                        >
                            <Icon icon="tick" size="sm" />
                        </Button>
                    )
                }
            </div>
            <div className="flex flex-col gap-2">
                {sortedTasks.map(task => {
                    return (
                        <SessionTask
                            key={task.id}
                            task={task}
                            onDragDrop={handleReorder}
                            isEdit={isEdit}
                        />
                    );
                })}
            </div>
        </div>
    );
}