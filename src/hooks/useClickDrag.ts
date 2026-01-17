import { useEffect, useRef } from "react";

type UseClickDragOptions = {
    threshold?: number;
    onClick?: () => void;
    onDragStart?: () => void;
    onDragMove?: (dx: number, dy: number, pointerX: number, pointerY: number) => void;
    onDragEnd?: () => void;
};

export function useClickDrag(
    ref: React.RefObject<HTMLElement | null>,
    {
        threshold = 5,
        onClick,
        onDragStart,
        onDragMove,
        onDragEnd,
    }: UseClickDragOptions
) {
    const state = useRef<{
        startX: number;
        startY: number;
        dragging: boolean;
        pointedId: number | null;
    } | null>(null);

    useEffect(() => {
        const element = ref.current;
        if(!element) return;

        const onPointerDown = (e: PointerEvent) => {
            state.current = {
                startX: e.clientX,
                startY: e.clientY,
                dragging: false,
                pointedId: e.pointerId,
            };

            element.setPointerCapture(e.pointerId);
        };

        const onPointerMove = (e: PointerEvent) => {
            if (!state.current) return;

            const dx = e.clientX - state.current.startX;
            const dy = e.clientY - state.current.startY;

            if (!state.current.dragging) {
                if (Math.hypot(dx, dy) > threshold) {
                state.current.dragging = true;
                onDragStart?.();
                }
            }

            if (state.current.dragging) {
                onDragMove?.(dx, dy, e.clientX, e.clientY);
            }
        };

        const onPointerUp = () => {
            if (!state.current) return;

            if (!state.current.dragging) {
                onClick?.();
            } else {
                onDragEnd?.();
            }

            state.current = null;
        };

        element.addEventListener("pointerdown", onPointerDown);
        element.addEventListener("pointermove", onPointerMove);
        element.addEventListener("pointerup", onPointerUp);
        element.addEventListener("pointercancel", onPointerUp);

        return () => {
            element.removeEventListener("pointerdown", onPointerDown);
            element.removeEventListener("pointermove", onPointerMove);
            element.removeEventListener("pointerup", onPointerUp);
            element.removeEventListener("pointercancel", onPointerUp);
        };
    }, [ref, threshold, onClick, onDragStart, onDragMove, onDragEnd]);
}