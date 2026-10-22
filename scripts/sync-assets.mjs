import { cp, mkdir, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
await mkdir('public', { recursive:true });
const paths=['index.html','data','guides','robots.txt','favicon.ico','media'];
for (const name of paths) if (existsSync(name)) await cp(name,`public/${name}`,{recursive:true,force:true});
for (const f of await readdir('.')) if (/^google[a-z0-9_-]+\.html$/i.test(f)) await cp(f,`public/${f}`,{force:true});
if(!existsSync('index.html')) throw Error('缺少原有 index.html，停止建置以防首頁遺失');
