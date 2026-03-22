"use client";

import { useCalendarContext } from "@/context";
import styles from "./SelectedSession.module.scss";
import SessionTask from "@/components/workSessions/SessionTask";
import { useEffect, useState } from "react";
import { updateTaskOrder } from "@/services/taskService";
import { handlePromise } from "@/utils/handleError";
import useCalendarStore from "@/store";

export default function SelectedSession() {
    const calendarContext = useCalendarContext();
    const selection = calendarContext.workSessionSelection;

    const [_, updateTasks] = useCalendarStore("tasks");
    
    if (selection == null) return null;

    const { workSession, tasks } = selection;
    const [sortedTasks, setSortedTasks] = useState(() =>
        tasks.toSorted((a, b) => a.orderIndex - b.orderIndex)
    );

    useEffect(() => {
        setSortedTasks(tasks.toSorted((a, b) => a.orderIndex - b.orderIndex));
    }, [selection.workSession.id, selection.tasks]);

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

        const changes = reordered
            .filter(task => {
                const original = sortedTasks.find(p => p.id === task.id);
                return task.orderIndex !== original?.orderIndex;
            })
            .map(t => ({ id: t.id, orderIndex: t.orderIndex }));

        setSortedTasks(reordered);

        if (changes.length > 0) {
            const [updatedTasks, error] = await handlePromise(
                updateTaskOrder(changes)
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
    }

    return (
        <div className="w-full h-full flex flex-col gap-2">
            <span className="truncate block w-full">
                {workSession.name}
            </span>
            <div className="flex flex-col gap-2">
                {sortedTasks.map(task => {
                    return (
                        <SessionTask
                            key={task.id}
                            task={task}
                            onDragDrop={handleReorder}
                        />
                    );
                })}
            </div>
        </div>
    );
}