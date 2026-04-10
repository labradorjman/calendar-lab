"use client";

import { forwardRef } from "react";
import styles from "./Icon.module.scss";
import { TIcon } from "./icons";

type TIconSize = "sm" | "md" | "lg";

interface IconProps extends React.HTMLAttributes<HTMLElement> {
    icon: TIcon;
    size: TIconSize;
}

const iconMap: Record<TIcon, string> = {
    back_arrow: "/assets/icons/back_arrow.svg",
    calendar: "/assets/icons/calendar.webp",
    drag: "/assets/icons/drag.svg",
    edit: "/assets/icons/edit.svg",
    edit_pencil: "/assets/icons/edit_pencil.svg",
    tick: "/assets/icons/tick.svg",
    x: "/assets/icons/x.svg",
};

const Icon = forwardRef<HTMLElement, IconProps>(
    ({ icon, size, ...rest }, ref) => {
        const classes = [styles.icon];

        if (size) classes.push(styles[size]);
        if (rest.className) {
            classes.push(rest.className);
            rest.className = undefined;
        }

        return (
            <i
                {...rest}
                className={classes.join(" ")}
                ref={ref}
                style={{
                    WebkitMaskImage: `url(${iconMap[icon]})`,
                    maskImage: `url(${iconMap[icon]})`,
                    ...rest.style,
                }}
            />
        );
    }
);

export default Icon;