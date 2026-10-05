// Pure slug generation for organization names, DB-free so it's unit-testable
// (uniqueness against existing rows is checked by the caller).

export function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return slug || "org";
}

export function randomSlugSuffix(): string {
  return Math.random().toString(36).slice(2, 6);
}
