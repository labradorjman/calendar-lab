import { useFloating, offset, flip, shift, autoUpdate } from "@floating-ui/react-dom";

export function useSmartFloating() {
    const { x, y, strategy, refs } = useFloating({
        placement: "bottom-start",
        strategy: "fixed",
        middleware: [offset(4), flip(), shift({ padding: 8 })],
        whileElementsMounted: autoUpdate,
    });

    return {
        x,
        y,
        strategy,
        reference: refs.setReference,
        floating: refs.setFloating,
    };
}
