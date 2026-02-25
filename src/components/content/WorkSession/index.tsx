"use client";

import { WorkSession } from "@/models/workSession";
import { TimeBlock } from "@/models/timeBlock";
import styles from "./WorkSession.module.scss";

interface WorkSessionProps {
    workSession: WorkSession;
    timeBlock: TimeBlock;
}

export default function WorkSessionBlock({ workSession, timeBlock }: WorkSessionProps) {
    
    return (
        <div
            className={styles.session_block}
            style={{
                position: "absolute",
                top: "100px",
                height: "400px",
            }}
        >
            
        </div>
    );
}