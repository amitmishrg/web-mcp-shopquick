"use client";

import { cn } from "@/lib/utils";

/**
 * Shimmer – animated text for loading states.
 * Renders as the given element (default span) with a sweeping shimmer effect.
 */
export function Shimmer({
  as: Component = "span",
  className,
  children = "Loading…",
  duration = 2,
  ...props
}) {
  return (
    <Component
      className={cn(
        "inline-block bg-clip-text text-transparent",
        "bg-linear-to-r from-foreground via-muted-foreground to-foreground",
        "animate-shimmer",
        className
      )}
      style={{
        "--shimmer-duration": `${duration}s`,
      }}
      {...props}
    >
      {children}
    </Component>
  );
}
