import { writeFile, rename, rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { validFeedItem } from '../src/lib/feed-data.js';
export function parseArxiv(xml) {
 if(!xml.includes('<feed') || xml.includes('<!DOCTYPE')) throw Error('Invalid feed');
 const decode=s=>s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/&#(x[0-9a-f]+|\d+);/gi,(_,n)=>String.fromCodePoint(n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n))).replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
 const tag=(s,t)=>decode(s.match(new RegExp(`<${t}(?:\\s[^>]*)?>([\\s\\S]*?)</${t}>`))?.[1]||'');
 const items=[...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([,e])=>{
  const id=tag(e,'id'),title=tag(e,'title'),date=tag(e,'published').slice(0,10);
  if(!/^https?:\/\/arxiv\.org\/abs\/[\w./-]+$/.test(id)||!title||!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw Error('Invalid entry');
  return {title,url:id.replace(/^http:/,'https:'),date,authors:[...e.matchAll(/<author>([\s\S]*?)<\/author>/g)].map(([,a])=>tag(a,'name')),categories:[...e.matchAll(/<category\b[^>]*term=["']([^"']+)["']/g)].map(([,c])=>decode(c))};
 });
 if(!items.length || !items.every(item=>validFeedItem(item,'research'))) throw Error('Invalid or empty result');
 return items;
}
export function parseApod(p){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(p.date)||typeof p.title!=='string'||!['image','video','other'].includes(p.media_type))throw Error('Invalid APOD');
 const item={title:p.title,date:p.date,mediaType:p.media_type,credit:p.copyright||'請參閱 NASA 原始頁面之完整 credit line',url:`https://apod.nasa.gov/apod/ap${p.date.slice(2).replaceAll('-','')}.html`};
 if(!validFeedItem(item,'apod')) throw Error('Invalid APOD metadata');
 return [item];
}
export async function updateFeed(file,url,parse,fetcher=fetch){
 try{
  const r=await fetcher(url,{signal:AbortSignal.timeout(15000),headers:{'User-Agent':'CosmicAtelier/2.5 (static astronomy metadata index)'}});
  if(!r.ok)throw Error(`HTTP ${r.status}`);
  const text=await r.text();if(text.length>2000000)throw Error('Response too large');
  const items=parse(text);
  if(!Array.isArray(items)||!items.length)throw Error('Empty or invalid update');
  await writeFile(`${file}.tmp`,JSON.stringify({updatedAt:new Date().toISOString(),items},null,2)+'\n');await rename(`${file}.tmp`,file);
  console.log(`${file}: updated ${items.length} items`);return true;
 }catch(e){await rm(`${file}.tmp`,{force:true}).catch(()=>{});console.warn(`${file}: unavailable; previous cache retained (${e.name})`);return false;}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 if(process.argv.includes('--offline'))console.log('Offline: caches retained');
 else{
  await updateFeed('data/apod.json',`https://api.nasa.gov/planetary/apod?api_key=${encodeURIComponent(process.env.NASA_API_KEY||'DEMO_KEY')}`,s=>parseApod(JSON.parse(s)));
  await updateFeed('data/research.json','https://export.arxiv.org/api/query?search_query=cat:astro-ph.*&start=0&max_results=12&sortBy=submittedDate&sortOrder=descending',parseArxiv);
 }
}
