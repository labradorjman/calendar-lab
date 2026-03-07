"use client";

import { forwardRef } from "react";
import styles from "./TaskSkeleton.module.scss";

const TaskSkeleton = forwardRef<HTMLDivElement>((_, ref) => {
    return (
        <div
            ref={ref}
            className={styles.skeleton}
        />
    );
});

TaskSkeleton.displayName = "TaskSkeleton";

export default TaskSkeleton;