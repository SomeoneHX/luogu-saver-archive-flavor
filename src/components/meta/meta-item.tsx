import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export interface MetaItemProps {
  icon?: LucideIcon;
  children?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export default function MetaItem({
  icon: Icon,
  children,
  className,
}: MetaItemProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      {Icon ? <Icon className="size-3.5" aria-hidden="true" /> : null}
      <span>{children}</span>
    </span>
  );
}
