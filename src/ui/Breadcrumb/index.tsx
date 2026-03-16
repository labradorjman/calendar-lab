import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { ChevronRight, MoreHorizontal } from "lucide-react";

import styles from "./Breadcrumb.module.scss";

const {
    breadcrumb,
    list,
    item,
    link,
    page,
    separator,
    ellipsis,
    srOnly
} = styles;

export const Breadcrumb = React.forwardRef<HTMLElement, React.ComponentProps<"nav">>(
    (props, ref) => <nav ref={ref} aria-label="breadcrumb" className={breadcrumb} {...props} />
);

export const BreadcrumbList = React.forwardRef<HTMLOListElement, React.ComponentProps<"ol">>(
    (props, ref) => <ol ref={ref} className={list} {...props} />
);

export const BreadcrumbItem = React.forwardRef<HTMLLIElement, React.ComponentProps<"li">>(
    (props, ref) => <li ref={ref} className={item} {...props} />
);

export const BreadcrumbLink = React.forwardRef<HTMLAnchorElement, React.ComponentProps<"a"> & { asChild?: boolean }>(
    ({ asChild, ...props }, ref) => {
        const Comp = asChild ? Slot : "a";
        return <Comp ref={ref} className={link} {...props} />;
    }
);

export const BreadcrumbPage = React.forwardRef<HTMLSpanElement, React.ComponentProps<"span">>(
    (props, ref) => (
        <span
            ref={ref}
            className={page}
            role="link"
            aria-disabled="true"
            aria-current="page"
            {...props}
        />
    )
);

export const BreadcrumbSeparator = React.forwardRef<HTMLLIElement, React.ComponentProps<"li">>(
    ({ children, ...props }, ref) => (
        <li ref={ref} className={separator} role="presentation" aria-hidden="true" {...props}>
            {children ?? <ChevronRight />}
        </li>
    )
);

export const BreadcrumbEllipsis = React.forwardRef<HTMLSpanElement, React.ComponentProps<"span">>(
    (props, ref) => (
        <span ref={ref} className={ellipsis} role="presentation" aria-hidden="true" {...props}>
            <MoreHorizontal size={16} />
            <span className={srOnly}>More</span>
        </span>
    )
);