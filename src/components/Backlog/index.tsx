"use client";

import styles from "@/components/Backlog/Backlog.module.scss";
import Button from "@/ui/Button";
import { useState } from "react";
import TaskModal from "../Task/Modal";

export default function Backlog() {
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    
    return (
        <div className={styles.backlog}>
            <div className={styles.header}>
                <span>Backlog</span>
                <Button
                    element="button"
                    size="sm"
                    onClick={() => {
                        setIsModalOpen(true);
                    }}
                >
                    +
                </Button>
            </div>
            <TaskModal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
}