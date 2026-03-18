import { forwardRef } from "react";
import styles from "./TextArea.module.scss";

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    hasError?: boolean;
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
    ({ hasError, className, ...props }, ref) => {
        return (
            <div
                className={styles.wrapper}
                data-haserror={hasError}
            >
                <textarea
                    ref={ref}
                    rows={4}
                    className={className}
                    {...props}
                />
            </div>
        );
    }
);

TextArea.displayName = "TextArea";

export default TextArea;
