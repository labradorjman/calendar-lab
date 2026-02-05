import React, { forwardRef, useRef } from "react";
import styles from "./Input.module.scss";

interface IInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    tooltip?: boolean;
    error?: string;
    suffix?: string;
}

function DebouncedInput({
    onChange,
    debounce = 500,
    ...props
}: {
    onChange?: (value: string) => void;
    debounce?: number;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">) {
    const [value, setValue] = React.useState("");
    const hasRendered = useRef(false);

    React.useEffect(() => {
        // if (!value) return;
        if (!hasRendered.current) {
            hasRendered.current = true;
            return;
        }

        const timeout = setTimeout(() => {
            onChange && onChange(value);
        }, debounce);

        return () => clearTimeout(timeout);
    }, [value]);

    return (
        <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            //   icon={icon}
            {...props}
        />
    );
}

const Input = forwardRef<HTMLInputElement, IInputProps>((props, fwdRef) => {
    return (
        <>
            <div
                className={[styles.wrapper, props.className].join(" ")}
                data-tooltip-id="global-tooltip"
                data-haserror={Boolean(props.error)}
                data-tooltip-content={props.placeholder}
                data-tooltip-hidden={!props.tooltip}
            >
                {/* {props.icon && (
                <Nucleo className={styles.icon} size="sm" icon={props.icon} />
                )} */}
                <div className={styles.input_row}>
                    <input
                        {...props}
                        ref={fwdRef}
                        className={styles.input}
                    />
                    {props.suffix && (
                        <span className={styles.suffix}>{props.suffix}</span>
                    )}
                </div>

                {props.error && (
                    <small className={styles.error}>{props.error}</small>
                )}
            </div>
        </>
    );
});

export { DebouncedInput };

export default Input;