"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Suggestions({ className, children, ...props }) {
  return (
    <div
      className={cn("flex flex-wrap gap-2", className)}
      role="list"
      {...props}
    >
      {children}
    </div>
  );
}

export function Suggestion({
  suggestion,
  onClick,
  className,
  children,
  ...props
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn("rounded-full font-normal", className)}
      onClick={() => onClick?.(suggestion)}
      role="listitem"
      {...props}
    >
      {children ?? suggestion}
    </Button>
  );
}
