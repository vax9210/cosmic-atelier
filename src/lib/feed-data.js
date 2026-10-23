import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { dateISO } from './site.js';

export function validFeedItem(item, kind) {
  if (!item || typeof item.title !== 'string' || !item.title.trim() ||
      typeof item.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(item.date) || dateISO(item.date) !== item.date) return false;
  if (kind === 'apod') return ['image', 'video', 'other'].includes(item.mediaType) &&
    typeof item.credit === 'string' && /^https:\/\/apod\.nasa\.gov\/apod\/ap\d{6}\.html$/.test(item.url);
  return /^https:\/\/arxiv\.org\/abs\/[\w./-]+$/.test(item.url) &&
    Array.isArray(item.authors) && item.authors.every(x => typeof x === 'string') &&
    Array.isArray(item.categories) && item.categories.every(x => typeof x === 'string');
}

export async function loadFeed(kind, directory = 'data') {
  try {
    if (!['apod', 'research'].includes(kind)) throw Error('Unknown feed');
    const data = JSON.parse(await readFile(resolve(directory, `${kind}.json`), 'utf8'));
    if (!Array.isArray(data.items)) throw Error('Invalid feed cache');
    const items = data.items.filter(item => validFeedItem(item, kind));
    return { updatedAt: typeof data.updatedAt === 'string' && dateISO(data.updatedAt) ? data.updatedAt : null, items };
  } catch {
    console.warn(`${kind}: invalid or missing cache; using official source fallback`);
    return { updatedAt: null, items: [] };
  }
}
