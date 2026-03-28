/**
 * Lightweight className utility.
 * Filters out falsy values and joins the rest with a space.
 *
 * Usage:
 *   cn('base-class', isActive && 'active', undefined)
 *   → 'base-class active'
 */
export function cn(...classes: (string | undefined | null | false | 0)[]): string {
  return classes.filter(Boolean).join(" ");
}
