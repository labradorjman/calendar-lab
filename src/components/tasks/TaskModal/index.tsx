import Input from "@/ui/Input";
import styles from "./TaskModal.module.scss";

import { useEffect, useState } from "react";
import Button from "@/ui/Button";
import { createDefaultTask, type Task } from "@/models/task";
import Checkbox from "@/ui/Checkbox";
import { useCalendarContext } from "@/context";
import { createTask } from "@/services/tasks";
import Modal, { ModalProps } from "@/components/Modal";

interface TaskModalProps extends Omit<ModalProps, "children"> {
    onTaskCreated: (task: Task) => void;
}

export default function TaskModal({ open, onClose, onTaskCreated }: TaskModalProps) {
    const calendarContext = useCalendarContext();

    const [task, setTask] = useState<Omit<Task, "id">>(createDefaultTask());
    const [durationMinutes, setDurationMinutes] = useState<number>(0);

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
        if (e.target.value === "") {
            setDurationMinutes(0);
            return;
        }

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
    }, [open]);

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
    return (
        <Modal
            open={open}
            onClose={onClose}
        >
            <div className={styles.task_modal}>
                <div className={styles.content}>
                    <div className={`${styles.input_area} ${styles.name_input}`}>
                        <span className={styles.label}>Name</span>
                        <Input
                            placeholder=""
                            value={task.name}
                            onChange={handleNameChange}
                        />
                    </div>
                    <div className={`${styles.input_area} ${styles.description_input}`}>
                        <span className={styles.label}>Description</span>
                        <Input
                            placeholder=""
                            value={task.description ?? ""}
                            onChange={handleDescriptionChange}
                        />
                    </div>
                    <div className={`${styles.input_area} ${styles.duration_input}`}>
                        <span className={styles.label}>Duration</span>
                        <Input
                            placeholder=""
                            value={durationMinutes}
                            onChange={handleDurationChange}
                            suffix="mins"
                        />
                    </div>
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
        </Modal>
    );
}