export const fromSlug = (slug: string): string =>
  slug.replace(/[_-]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
