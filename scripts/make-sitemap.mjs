import {readdir,writeFile,readFile} from 'node:fs/promises';
import {base as basePath, origin} from '../src/lib/site.js';
const base=origin+basePath;
const urls=[];
async function walk(dir){for(const item of await readdir(dir,{withFileTypes:true})){
 const path=dir+'/'+item.name;
 if(item.isDirectory())await walk(path);
 else if(item.name==='index.html'){
  const html=await readFile(path,'utf8');
  const tags=html.match(/<meta\b[^>]*>/gi)||[];
  const noindex=tags.some(tag=>/name\s*=\s*["']robots["']/i.test(tag)&&/content\s*=\s*["'][^"']*\bnoindex\b/i.test(tag));
  if(!noindex)urls.push(base+path.slice(5).replace(/index\.html$/,''));
 }
}}
await walk('dist');
const escape=x=>x.replaceAll('&','&amp;').replaceAll('<','&lt;');
await writeFile('dist/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+[...new Set(urls)].sort().map(x=>'  <url><loc>'+escape(x)+'</loc></url>').join('\n')+'\n</urlset>\n');
await writeFile('dist/robots.txt','User-agent: *\nAllow: /cosmic-atelier/\nSitemap: '+base+'sitemap.xml\n');
console.log('Sitemap generated: '+urls.length+' urls');
