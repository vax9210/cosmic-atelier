import {readdir,writeFile,readFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
const base='https://vax9210.github.io/cosmic-atelier/';
const urls=[base];
for (const p of ['guides/galaxy-cluster/index.html','guides/astronomy-journals/index.html']) if(existsSync(`dist/${p}`)) urls.push(base+p.replace(/index\.html$/,''));
if(existsSync('dist/articles/index.html')) urls.push(base+'articles/');
for(const file of await readdir('src/content/articles')) {
 if(!file.endsWith('.md'))continue;
 const content=await readFile('src/content/articles/'+file,'utf8');
 if(/^draft:\s*true\s*$/mi.test(content.split('---').slice(1,2)[0]??''))continue;
 const slug=file.replace(/\.md$/,'');
 if(existsSync(`dist/articles/${slug}/index.html`))urls.push(base+`articles/${slug}/`);
}
if(existsSync('dist/gallery/index.html')) urls.push(base+'gallery/');
if(existsSync('src/content/gallery')) for(const file of await readdir('src/content/gallery')) {
 if(!file.endsWith('.md')) continue;
 const content=await readFile('src/content/gallery/'+file,'utf8');
 const fm=content.split('---').slice(1,2)[0]??'';
 if(/^draft:\s*true\s*$/mi.test(fm)) continue;
 const slug=file.replace(/\.md$/,'');
 if(existsSync(`dist/gallery/${slug}/index.html`)) urls.push(base+`gallery/${slug}/`);
}
const escape=x=>x.replaceAll('&','&amp;').replaceAll('<','&lt;');
await writeFile('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(x=>`  <url><loc>${escape(x)}</loc></url>`).join('\n')}\n</urlset>\n`);
await writeFile('dist/robots.txt','User-agent: *\nAllow: /\nSitemap: '+base+'sitemap.xml\n');
console.log(`Sitemap generated: ${urls.length} urls`);
