export const cn = (...classes) => classes.filter(Boolean).join(" ");

export function slugify(text) {
  return text.toString().toLowerCase().trim().replace(/\s+/g, "-");
}


