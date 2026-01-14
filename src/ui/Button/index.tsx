import { forwardRef, type ForwardedRef } from "react";
import styles from "./Button.module.scss";

type IBaseButton = (
    | ({
        element: "button";
        onClick?: (e: React.MouseEvent<HTMLButtonElement>) =>  void;
    }  & React.ButtonHTMLAttributes<HTMLButtonElement>)
    | {
        element: "a";
        href: string;
        target?: "_blank" | "_self" | "_parent" | "_top";
    }
) &  React.HTMLAttributes<HTMLAnchorElement> & {
    size?: "sm" | "md" | "lg";
    disabled?: boolean;
    children?: React.ReactNode | string;
};

const buildClasses = (props: IBaseButton) => {
    const classes = [styles.Button];

    if (props.size) {
        classes.push(styles[`Button--${props.size}`]);
    }

    if (props.className) {
        classes.push(props.className);
    }

    return classes.join(" ");
}

const Button = forwardRef((props: IBaseButton, ref) => {
    const classes = buildClasses(props);

    switch (props.element) {
        case "a": {
            return (
                <a
                    {...props}
                    ref={ref as React.Ref<HTMLAnchorElement>}
                    href={props.href}
                    target={props.target}
                    className={classes}
                >
                    {props.children}
                </a>
            );
        }
        case "button": {
            return (
                <button
                    {...props}
                    className={classes}
                    type={props.type ?? "button"}
                    ref={ref as ForwardedRef<HTMLButtonElement>}
                    onClick={props.onClick}
                >
                </button>
            );
        }
        default: {
            return null;
        }
    }
});

export default Button;