"use client";

import React, { forwardRef, useCallback } from "react";
import { useMask } from "@react-input/mask";
import Input  from "@/ui/Input";

interface MaskedInputProps
    extends Omit<
        React.InputHTMLAttributes<HTMLInputElement>,
        "onChange"
    > {
    mask: string;
    replacement?: Record<string, RegExp>;
    onChange?: (value: string) => void;

    radius?: "left" | "right" | "both";
}

const MaskedInput = forwardRef<HTMLInputElement, MaskedInputProps>(
    ({ mask, replacement = { "d": /\d/ }, onChange, radius, className, ...props }, forwardedRef) => {
        const maskRef = useMask({ mask, replacement });

        const combinedRef = useCallback(
            (node: HTMLInputElement | null) => {
                if (typeof forwardedRef === "function") {
                    forwardedRef(node);
                } else if (forwardedRef) {
                    (forwardedRef as React.RefObject<HTMLInputElement | null>).current = node;
                }
                (maskRef as React.RefObject<HTMLInputElement | null>).current = node;
            },
            [forwardedRef, maskRef],
        );

        return (
            <Input
                {...props}
                ref={combinedRef}
                radius={radius}
                onChange={(e) => onChange?.(e.target.value)}
            />
        );
    },
);

MaskedInput.displayName = "MaskedInput";

export default MaskedInput;
