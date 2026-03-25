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

    useEffect(() => {
        if (editable) return;
        const element = spanRef.current;
        if (!element) return;

        window.getSelection()?.removeAllRanges();
        element.scrollLeft = 0;
    }, [editable]);

    const handleFocus = useCallback(() => {
        originalValue.current = spanRef.current?.textContent ?? value;
        setIsFocused(true);

        setTimeout(() => {
            const el = spanRef.current;
            if (!el) return;

            const range = document.createRange();
            const selection = window.getSelection();
            range.selectNodeContents(el);
            selection?.removeAllRanges();
            selection?.addRange(range);
        }, 0);
    }, [value]);

    const handleBlur = useCallback(() => {
        setIsFocused(false);
        const newValue = spanRef.current?.textContent?.trim() ?? '';
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
            spanRef.current?.blur();
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            if (spanRef.current) spanRef.current.textContent = originalValue.current
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
                    !editable ? styles.readOnly : '',
                    className,
                ].filter(Boolean).join(' ')}
                contentEditable={editable}
                suppressContentEditableWarning
                spellCheck={false}
                onFocus={editable ? handleFocus : undefined}
                onBlur={editable ? handleBlur : undefined}
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