import { useFloating, offset, flip, shift, autoUpdate } from "@floating-ui/react-dom";
import { useEffect } from "react";

export function useSmartFloating(
    referenceRef: React.RefObject<HTMLElement | null>,
    floatingRef: React.RefObject<HTMLElement | null>
) {
    const { x, y, strategy, update } = useFloating({
        placement: "bottom-start",
        strategy: "fixed",
        middleware: [offset(4), flip(), shift({ padding: 8 })],
    });

    useEffect(() => {
        const refEl = referenceRef.current;
        const floatEl = floatingRef.current;

        if (!refEl || !floatEl) return;

        update();

        return autoUpdate(refEl, floatEl, update);
    }, [referenceRef, floatingRef, update]);

    return { x, y, strategy };
}
