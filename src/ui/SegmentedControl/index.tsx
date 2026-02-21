"use client";

import styles from "./SegmentedControl.module.scss";

import Button from "@/ui/Button";

interface SegmentedControlProps {
    className?: string;
    value: string;
    options: { label: string; value: string }[];
    onSegmentSelect: (value: string) => void;
}

export default function SegmentedControl({
    className,
    value,
    options,
    onSegmentSelect,
}: SegmentedControlProps) {
    return (
        <div className={`${styles.buttons} ${className ?? ""}`}>
            {options.map((opt) => (
                <Button
                    key={opt.value}
                    element="button"
                    size="sm"
                    onClick={() => onSegmentSelect(opt.value)}
                    disabled={opt.value === value}
                >
                    {opt.label}
                </Button>
            ))}
        </div>
    );
}
