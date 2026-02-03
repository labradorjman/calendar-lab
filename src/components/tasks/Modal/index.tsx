import Input from "@/ui/Input";
import styles from "./TaskModal.module.scss";

import { useEffect, useRef, useState } from "react";
import Button from "@/ui/Button";
import { createDefaultTask, type Task } from "@/models/task";
import Checkbox from "@/ui/Checkbox";
import { createTask } from "@/storage/taskStore";
import { useCalendarContext } from "@/context";

interface ModalProps {
    open: boolean;
    onClose: () => void;
    onTaskCreated: (task: Task) => void;
}

export default function TaskModal({ open, onClose, onTaskCreated }: ModalProps) {
    const calendarContext = useCalendarContext();

    const [task, setTask] = useState<Omit<Task, "id">>(createDefaultTask());
    const [durationMinutes, setDurationMinutes] = useState<number>(0);

    const pointerDownTargetRef = useRef<EventTarget | null>(null);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTask(prev => ({
            ...prev,
            name: e.target.value
        }));
    };

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTask(prev => ({
            ...prev,
            description: e.target.value
        }));
    };

    const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = parseInt(e.target.value);
        if (isNaN(val)) return;

        setDurationMinutes(val);

        setTask(prev => ({
            ...prev,
            duration: val * 60,
        }));
    };

    const handleIsImportantChange = (value: boolean) => {
        setTask(prev => ({
            ...prev,
            isImportant: value
        }));
    }

    useEffect(() => {
        if (!open) return;

        if (calendarContext.modalTask) {
            setTask(prev => ({
                ...prev,
                ...calendarContext.modalTask,
            }));

            setDurationMinutes(() => {
                const durationSeconds = calendarContext.modalTask?.duration;
                if (!durationSeconds || durationSeconds === 0) return 0;

                return Math.floor(durationSeconds / 60);
            });
        }

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [open]);

    if (!open) return null;

    function handleCreate() {
        const taskToCreate: Omit<Task, "id"> = {
            ...task,
            isBacklogged: !task.startsAt,
            createdAt: new Date().toISOString(),
        }
        const createdTask = createTask(taskToCreate);
        createdTask.then(task => {
            onTaskCreated(task);
            setTask(createDefaultTask());
        });
        onClose();
    }

    const onPointerDown = (e: React.PointerEvent) => {
        pointerDownTargetRef.current = e.target;
    };


    return (
        <div
            className={styles.backdrop}
            onPointerDown={onPointerDown}
            onClick={e => {
                if (pointerDownTargetRef.current !== e.currentTarget) return;
                onClose();
            }}
        >
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.content}>
                    <Input
                        className={styles.name_input}
                        placeholder="Name"
                        value={task.name}
                        onChange={handleNameChange}
                    />
                    <Input
                        className={styles.description_input}
                        placeholder="Description"
                        value={task.description ?? ""}
                        onChange={handleDescriptionChange}
                    />
                    <Input
                        className={styles.duration_input}
                        placeholder="Duration"
                        value={durationMinutes}
                        onChange={handleDurationChange}
                    />
                    <Checkbox
                        className={styles.important_check}
                        label="Important"
                        defaultValue={false}
                        checked={task.isImportant}
                        onChange={handleIsImportantChange}
                    />
                </div>
                <div className={styles.bottom}>
                    <Button
                        element="button"
                        onClick={handleCreate}
                        disabled={!task.name.trim()}
                    >
                        Create
                    </Button>
                </div>
            </div>
        </div>
    );
}