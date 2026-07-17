import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function NotFoundTemplate({
  Icon,
  title,
  hint,
  action,
}: {
  Icon: LucideIcon;
  title: string;
  hint?: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="grid size-20 place-items-center rounded-3xl bg-secondary text-muted-foreground">
        <Icon className="size-10" />
      </div>
      <h1 className="text-2xl font-semibold">{title}</h1>
      {hint ? <p className="max-w-md text-sm text-muted-foreground">{hint}</p> : null}
      {action ? (
        <Button asChild>
          <a href={action.href}>{action.label}</a>
        </Button>
      ) : null}
    </div>
  );
}
