"use client";

import { useEffect, useState } from "react";
import styles from "./SegmentedControl.module.scss";

import Button from "@/ui/Button";

type SegmentedOption = {
    label: string;
    value: string;
};

interface SegmentedControlProps {
    className?: string;
    defaultValue?: string;
    options: [SegmentedOption, SegmentedOption, ...SegmentedOption[]];
    onSegmentSelect: (segment: string) => void;
}

export default function SegmentedControl({ className, defaultValue, options, onSegmentSelect }: SegmentedControlProps) {
    const [selected, setSelected] = useState<string>(() =>
        options.find(opt => opt.value === defaultValue)?.value ?? options[0].value
    );

    return (
        <div className={`${styles.buttons} ${className ?? ""}`}>
            {options.map((opt) => (
                <Button
                    key={opt.value}
                    element="button"
                    size="sm"
                    onClick={() => {
                        setSelected(opt.value);
                        onSegmentSelect(opt.value);
                    }}
                    disabled={opt.value === selected}
                >
                    {opt.label}
                </Button>
            ))}
        </div>
    );
}