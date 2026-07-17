import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Prepend the deployment base path (Vite `base`) to an internal route.
 * Required for sub-path hosting (e.g. GitHub Pages `/<repo>/`).
 */
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL || "/";
  if (/^(https?:)?\/\//.test(path) || path.startsWith("data:")) return path;
  if (path.startsWith(base)) return path;
  return `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}
