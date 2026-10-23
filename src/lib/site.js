export const base = '/cosmic-atelier/';
export const origin = 'https://vax9210.github.io';
export const localURL = (path = '') => base + String(path).replace(/^\/+/, '');
export function imageURL(value) {
  const path = String(value || '');
  if (/^https:\/\//i.test(path)) return path;
  if (!path || /^[a-z]+:/i.test(path) || path.startsWith('//')) return '';
  return path.startsWith(base) ? path : localURL(path);
}
export const jsonLD = value => JSON.stringify(value).replaceAll('<', '\\u003c');
export const slugOf = post => post.file.replaceAll('\\', '/').split('/').pop().replace(/\.md$/, '');
export function dateISO(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}
// Keep the original publication rules, including older articles without a draft field.
export const publishedArticle = post => !post.frontmatter.draft;
export const publishedPhoto = post => post.frontmatter.draft === false && Boolean(post.frontmatter.photo);
