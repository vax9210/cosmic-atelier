import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { base, origin } from '../src/lib/site.js';

const output = resolve('dist');
const failures = [];
const htmlFiles = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) await walk(path);
    else if (entry.name.endsWith('.html')) htmlFiles.push(path);
  }
}
await walk(output);
const decode = value => value.replaceAll('&amp;', '&').replaceAll('&quot;', '"');
async function checkLink(value, pageURL) {
  const url = new URL(decode(value), pageURL);
  if (url.origin !== origin || !['http:', 'https:'].includes(url.protocol)) return;
  if (!url.pathname.startsWith(base)) { failures.push(`Missing base: ${url.pathname}`); return; }
  const relative = decodeURIComponent(url.pathname.slice(base.length));
  const target = resolve(output, relative);
  if (target !== output && !target.startsWith(output + sep)) { failures.push(`Path escapes dist: ${url.pathname}`); return; }
  const candidates = [target, resolve(target, 'index.html')];
  for (const file of candidates) {
    if ((await stat(file).catch(() => null))?.isFile()) return;
  }
  failures.push(`Missing output: ${url.pathname}`);
}
for (const file of htmlFiles) {
  const relative = file.slice(output.length + 1).replaceAll('\\', '/');
  const url = new URL(base + relative.replace(/index\.html$/, ''), origin);
  const html = await readFile(file, 'utf8');
  for (const [, link] of html.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/gi)) {
    await checkLink(link, url);
  }
  for (const [, json] of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(json); } catch { failures.push(`Invalid JSON-LD: ${relative}`); }
  }
}
const index = JSON.parse(await readFile(resolve(output, 'search-index.json'), 'utf8'));
for (const item of index) {
  await checkLink(item.url, origin + base);
  if (item.image) await checkLink(item.image, origin + base);
}
if (failures.length) throw Error([...new Set(failures)].join('\n'));
console.log(`Build output verified: ${htmlFiles.length} HTML files, ${index.length} search records; local links and JSON-LD valid`);
