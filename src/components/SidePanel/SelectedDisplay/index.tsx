"use client";

import { useCalendarContext } from "@/context";
import styles from "./SelectedDisplay.module.scss";
import Button from "@/ui/Button";

export default function SelectedDisplay() {
    const calendarContext = useCalendarContext();
    const selection = calendarContext.workSessionSelection;

    return (
        <div
            className={styles.display}
            data-target={selection != null ? "work_session" : ""}
        >
            <div className={styles.header}>
                <Button
                    className={styles.back_button}
                    element="button"
                    size="sm"
                    onClick={() => {
                        calendarContext.setWorkSessionSelection(null);
                    }}
                >
                    ←
                </Button>
                <span>{selection?.workSession.name ?? ""}</span>
            </div>
        </div>
    );
}