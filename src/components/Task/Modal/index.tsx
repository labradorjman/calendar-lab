import Input from "@/ui/Input";
import styles from "./TaskModal.module.scss";

import { useEffect, useState } from "react";
import Button from "@/ui/Button";
import type { Task } from "@/models/task";
import Checkbox from "@/ui/Checkbox";
import { createTask } from "@/storage/taskStore";

interface ModalProps {
    open: boolean;
    onClose: () => void;
}

export default function TaskModal({ open, onClose }: ModalProps) {
    const defaultTask: Omit<Task, "id"> = {
        userId: 1,
        workSessionId: null,
        name: "",
        description: null,
        tag1Id: null,
        tag2Id: null,
        orderIndex: 1,
        startsAt: null,
        duration: 0,
        isImportant: false,
        isBacklogged: false,
        isCompleted: false,
        softDeadline: null,
        completedAt: null,
        createdAt: new Date().toISOString(),
    };

    const [task, setTask] = useState<Omit<Task, "id">>(defaultTask);

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
        setTask(prev => ({
            ...prev,
            duration: parseInt(e.target.value)
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
        console.log("Created task", createdTask);
        onClose();
    }

    return (
        <div className={styles.backdrop} onClick={onClose}>
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
                        value={task.duration ?? 0}
                        onChange={handleDurationChange}
                        type="number"
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