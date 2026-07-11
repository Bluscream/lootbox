export function hasActiveCooldown(cooldownUntil: Date | string | null | undefined): boolean {
  if (!cooldownUntil) return false;
  return new Date(cooldownUntil) > new Date();
}
