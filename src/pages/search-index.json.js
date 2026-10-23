import { localURL, slugOf, dateISO, publishedArticle, publishedPhoto, imageURL } from '../lib/site.js';
import { loadFeed } from '../lib/feed-data.js';
import { getImage } from 'astro:assets';
export const prerender = true;
export async function GET() {
  const articles = import.meta.glob('../content/articles/*.md', { eager: true });
  const gallery = import.meta.glob('../content/gallery/*.md', { eager: true });
  const research = await loadFeed('research');
  const entries = (items, type) => Object.values(items)
    .filter(type === 'articles' ? publishedArticle : publishedPhoto)
    .map(p => ({ type, title: p.frontmatter.title, description: p.frontmatter.description || '',
      date: dateISO(p.frontmatter.date || p.frontmatter.observed_at),
      image: p.frontmatter.cover || p.frontmatter.photo || '',
      url: localURL(`${type}/${slugOf(p)}/`),
      text: [p.frontmatter.category, p.frontmatter.object_name, p.frontmatter.equipment, p.rawContent()].filter(Boolean).join(' ') }));
  const content = [...entries(articles, 'articles'), ...entries(gallery, 'gallery')];
  const assets = import.meta.glob('/media/**/*.{png,jpg,jpeg,webp}', { eager: true, import: 'default' });
  for (const item of content) {
    const asset = assets[imageURL(item.image).replace('/cosmic-atelier/', '/')];
    if (asset) item.image = (await getImage({src:asset,width:Math.min(640,asset.width),format:'webp'})).src;
  }
  return new Response(JSON.stringify([...content,
    ...research.items.map(p => ({ ...p, type: 'research', description: p.authors.join(', '), text: p.categories.join(' ') }))]),
    { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
