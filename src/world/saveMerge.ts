// Pure save merge: everything comes from the current default data except the listed fields, which come from the save.
/**
 * Returns one entry per default, in default order. For each default, the saved entry with the same id (if any)
 * supplies only the fields named in `keep` (and only when the save actually has them); every other field,
 * such as position and size, comes from the default. Saved ids with no default are dropped.
 */
export function mergeSavedById<T extends { id: string }>(defaults: T[], saved: Partial<T>[] | undefined, keep: (keyof T)[]): T[] {
  if (!Array.isArray(saved)) return defaults.map((d) => ({ ...d }));
  return defaults.map((d) => {
    const s = saved.find((e) => e != null && (e as { id?: unknown }).id === d.id);
    const out: T = { ...d };
    if (s) for (const k of keep) if (s[k] !== undefined) out[k] = s[k] as T[keyof T];
    return out;
  });
}
