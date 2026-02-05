import styles from "./Modal.module.scss";

import { useEffect, useRef } from "react";

export interface ModalProps {
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

export default function Modal({ open, onClose, children }: ModalProps) {
    const pointerDownTargetRef = useRef<EventTarget | null>(null);

    useEffect(() => {
        if (!open) return;

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [open]);

    if (!open) return null;

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
                {children}
            </div>
        </div>
    );
}