import React, { useState } from "react";
import styles from "./Checkbox.module.scss";

interface CheckboxProps
extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'defaultValue' | 'checked'> {
    label?: string;
    defaultValue?: boolean;
    checked?: boolean;
    onChange: (checked: boolean) => void;
}

const Checkbox: React.FC<CheckboxProps> = ({ label, defaultValue, checked, onChange, className, ...props }) => {
    const isControlled = checked !== undefined;
    
    const [internalChecked, setInternalChecked] = useState(defaultValue ?? false);
    const finalChecked = isControlled ? checked : internalChecked;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newChecked = e.target.checked;

        if (!isControlled) {
            setInternalChecked(newChecked);
        }

        onChange(newChecked);
    };

    return (
        <label className={`${styles.checkbox_wrapper} ${className ?? ""}`}>
            <input
                type="checkbox"
                className={styles.checkbox_input}
                checked={finalChecked}
                onChange={handleChange}
                {...props}
            />
            {label && <span className={styles.label}>{label}</span>}
        </label>
    );
};

export default Checkbox;
