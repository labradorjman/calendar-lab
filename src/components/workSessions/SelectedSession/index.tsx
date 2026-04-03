"use client";

import styles from "./SelectedSession.module.scss";
import SessionTask from "@/components/workSessions/SessionTask";
import { useEffect, useState } from "react";
import { patchTasks, TaskPatch } from "@/services/taskService";
import { handlePromise } from "@/utils/handleError";
import useCalendarStore from "@/store";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import EditableSpan from "@/components/ui/EditableSpan";
import { workSessionToKey } from "@/utils/objectToKey";
import { useWorkSessionContext } from "@/workSessionContext";
import { Task } from "@/models/task";
import { updateWorkSession } from "@/services/workSessionService";

export default function SelectedSession() {
    const { deselect, push, revert, undo, markSaved, isDirty, savedSnapshot, workSession, tasks } = useWorkSessionContext();

    const [isEdit, setIsEdit] = useState(false);
    const [_, updateTasks] = useCalendarStore("tasks");
    const [__, updateWorkSessions] = useCalendarStore("work_sessions");

    const [sortedTasks, setSortedTasks] = useState(() =>
        tasks.toSorted((a, b) => a.orderIndex - b.orderIndex)
    );

    useEffect(() => {
        setSortedTasks(tasks.toSorted((a, b) => a.orderIndex - b.orderIndex));
    }, [workSession?.id, tasks]);

    useEffect(() => {
        setIsEdit(false);
    }, [workSession?.id]);

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") {
                setIsEdit(false);
                revert();
            }
            if (e.key === "z" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                undo();
            }
        }

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isEdit, workSession?.id]);

    useEffect(() => {
        if (isEdit || !workSession) return;

        function handleClickOutside(event: MouseEvent) {
            const target = event.target as HTMLElement;

            if (target.closest('[data-target="side_panel"]') ||
                target.closest(`[data-hover-id="${workSessionToKey(workSession!)}"]`)
            ) {
                return;
            }

            deselect();
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isEdit, workSession?.id]);

    if (workSession == null) return null;

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

        push({ type: "TASK_REORDER", tasks: reordered });
        setSortedTasks(reordered);

        const orderChanges = reordered
            .filter(task => {
                const original = sortedTasks.find(p => p.id === task.id);
                return task.orderIndex !== original?.orderIndex;
            })
            .map(t => ({ id: t.id, changes: { orderIndex: t.orderIndex } }));

        if (orderChanges.length > 0 && !isEdit) {
            const [updatedTasks, error] = await handlePromise(patchTasks(orderChanges));
            if (!updatedTasks) {
                console.error("[SelectedSession] Unable to reorder tasks. Error:", error);
                return;
            }
            updateTasks(prev => prev.map(task => {
                const updated = updatedTasks.find(t => t.id === task.id);
                return updated ?? task;
            }));
        }
    };

    async function saveChanges() {
        setIsEdit(false);
        markSaved();

        const nameChanged = workSession?.name !== savedSnapshot.workSession?.name;

        const reorderedTasks = tasks
            .filter(t => {
                const original = savedSnapshot.tasks.find(o => o.id === t.id);
                return t.orderIndex !== original?.orderIndex;
            })
            .map(t => ({ id: t.id, changes: { orderIndex: t.orderIndex } }));

        const deletedTasks = savedSnapshot.tasks
            .filter(t => !tasks.find(current => current.id === t.id))
            .map(t => ({ id: t.id, changes: { orderIndex: 0, workSessionId: null, isBacklogged: true } }));

        const renamedTasks = tasks
            .filter(t => {
                const original = savedSnapshot.tasks.find(o => o.id === t.id);
                return t.name !== original?.name;
            })
            .map(t => ({ id: t.id, changes: { name: t.name } }));

        const allTaskIds = new Set([
            ...reorderedTasks.map(t => t.id),
            ...deletedTasks.map(t => t.id),
            ...renamedTasks.map(t => t.id),
        ]);

        const taskChanges: TaskPatch[] = Array.from(allTaskIds).map(id => {
            const reorder = reorderedTasks.find(t => t.id === id);
            const deleted = deletedTasks.find(t => t.id === id);
            const renamed = renamedTasks.find(t => t.id === id);

            return {
                id,
                changes: {
                    ...reorder?.changes,
                    ...deleted?.changes,
                    ...renamed?.changes,
                } as Partial<Task>
            };
        });
        const [taskResponse, taskErrors] = await handlePromise(
            patchTasks(taskChanges)
        );

        if (!taskResponse) {
            console.error(`[SelectedSession] Failed to save work session changes: id - ${workSession!.id}`, taskErrors);
        } else {
            updateTasks(prev => prev.map(task => {
                const updated = taskResponse.find(t => t.id === task.id);
                return updated ?? task;
            }));
        }

        if (!nameChanged) return;

        const [sessionResponse, sessionError] = await handlePromise(
            updateWorkSession(workSession!.id, {
                workSession: { name: workSession!.name }
            })
        );

        if (!sessionResponse) {
            console.error(`[SelectedSession] Failed to update work session name id - ${workSession!.id}`, sessionError);
            return;
        }

        updateWorkSessions(prev => prev.map(session => {
            return session.id === sessionResponse.workSession.id
                ? sessionResponse.workSession
                : session;
        }));
    }

    return (
        <div className="w-full h-full flex flex-col gap-2">
            <div className="flex flex-row gap-2 items-center">
                <EditableSpan
                    className={styles.session_name}
                    value={workSession.name}
                    editable={isEdit}
                    onChange={(value) => push({ type: "SESSION_NAME", value })}
                />
                {!isEdit ? (
                    <Button
                        className="right-0"
                        element="button"
                        variant="outline"
                        size="min"
                        onClick={() => setIsEdit(true)}
                    >
                        <Icon icon="edit_pencil" size="sm" />
                    </Button>
                ) : (
                    <Button
                        className="right-0"
                        element="button"
                        variant="outline"
                        size="min"
                        disabled={!isDirty}
                        onClick={saveChanges}
                    >
                        <Icon icon="tick" size="sm" />
                    </Button>
                )}
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