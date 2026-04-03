"use client";

import { useRef, useState, useCallback, KeyboardEvent, useEffect } from 'react'
import styles from './EditableSpan.module.scss'

interface EditableSpanProps {
    value: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    editable?: boolean;
    className?: string;
}

export default function EditableSpan({
    value,
    onChange,
    placeholder = 'Click to edit',
    editable = true,
    className,
}: EditableSpanProps) {
    const spanRef = useRef<HTMLSpanElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const originalValue = useRef(value);
    const isSelectAll = useRef(false);

    useEffect(() => {
        if (editable) return;

        const element = spanRef.current;
        if (!element) return;

        window.getSelection()?.removeAllRanges();
        element.scrollLeft = 0;
    }, [editable]);

    
    useEffect(() => {
        if (spanRef.current && !isFocused) {
            spanRef.current.textContent = value;
        }
    }, [value, isFocused]);

    const handleFocus = useCallback(() => {
        originalValue.current = spanRef.current?.textContent ?? value;
        setIsFocused(true);

        const element = spanRef.current;
        if (!element) return;

        requestAnimationFrame(() => {
            const range = document.createRange();
            const selection = window.getSelection();

            range.selectNodeContents(element);
            selection?.removeAllRanges();
            selection?.addRange(range);

            isSelectAll.current = true;
        });
    }, [value]);

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLSpanElement>) => {
        if (!editable) return;

        // First input click
        if (!isFocused) {
            e.preventDefault();
            spanRef.current?.focus();
            return;
        }

        // Second input click - to select
        if (isSelectAll.current) {
            isSelectAll.current = false;
            window.getSelection()?.removeAllRanges();
        }
    }, [isFocused, editable]);

    const handleBlur = useCallback(() => {
        setIsFocused(false);
        isSelectAll.current = false;
        const newValue = spanRef.current?.textContent?.trim() ?? '';

        // Prevent empty text
        if (newValue === '') {
            if (spanRef.current) spanRef.current.textContent = originalValue.current;
            return;
        }
        if (newValue !== originalValue.current) {
            onChange?.(newValue);
        }
        if (spanRef.current) spanRef.current.scrollLeft = 0;
    }, [onChange]);

    const handleKeyDown = useCallback((e: KeyboardEvent<HTMLSpanElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            window.getSelection()?.removeAllRanges();
            spanRef.current?.blur();
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            if (spanRef.current) spanRef.current.textContent = originalValue.current;
            window.getSelection()?.removeAllRanges();
            spanRef.current?.blur();
        }
    }, []);

    return (
        <div className={styles.wrapper}>
            <span
                ref={spanRef}
                className={[
                    styles.span,
                    isFocused ? styles.focused : '',
                    !editable ? styles.read_only : '',
                    className,
                ].filter(Boolean).join(' ')}
                contentEditable={editable}
                suppressContentEditableWarning
                spellCheck={false}
                onFocus={editable ? handleFocus : undefined}
                onBlur={editable ? handleBlur : undefined}
                onMouseDown={editable ? handleMouseDown : undefined}
                onKeyDown={editable ? handleKeyDown : undefined}
                data-placeholder={placeholder}
                role={editable ? 'textbox' : undefined}
                aria-label={value}
            >
                {value}
            </span>
        </div>
    );
}