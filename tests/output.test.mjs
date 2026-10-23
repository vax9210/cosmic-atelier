import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
test('homepage and sitemap generation preserve animation, escape content and include new routes',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'cosmic-output-'));
 try{
 await mkdir(join(dir,'dist/research'),{recursive:true});
 await writeFile(join(dir,'dist/research/index.html'),'<h1>Research</h1>');
 await mkdir(join(dir,'dist/search'),{recursive:true});
 await writeFile(join(dir,'dist/search/index.html'),'<meta content="noindex,follow" name="robots">');
 await writeFile(join(dir,'dist/index.html'),'<style></style><canvas id="starfield"></canvas><script>const animation=true;</script><section id="discover"></section>');
 await writeFile(join(dir,'dist/search-index.json'),JSON.stringify([{type:'gallery',title:'<script>unsafe</script>',description:'sample',date:'2026-10-23',image:'/cosmic-atelier/media/test.webp',url:'/cosmic-atelier/gallery/old-uuid/'}]));
 execFileSync(process.execPath,[resolve('scripts/enhance-home.mjs')],{cwd:dir});
 execFileSync(process.execPath,[resolve('scripts/make-sitemap.mjs')],{cwd:dir});
 const html=await readFile(join(dir,'dist/index.html'),'utf8');
 assert.ok(html.includes('<canvas id="starfield">'));assert.ok(html.includes('const animation=true'));assert.ok(html.includes('&lt;script&gt;unsafe'));assert.ok(html.includes('/gallery/old-uuid/'));assert.ok(html.includes('/cosmic-atelier/search/'));
 const xml=await readFile(join(dir,'dist/sitemap.xml'),'utf8');assert.ok(xml.includes('https://vax9210.github.io/cosmic-atelier/research/'));assert.ok(!xml.includes('index.html'));assert.ok(!xml.includes('/search/'));
 }finally{await rm(dir,{recursive:true});}
});
test('output verifier accepts valid output and rejects missing files, base errors and invalid JSON-LD',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'cosmic-verify-'));
 try{
  await mkdir(join(dir,'dist'));
  await writeFile(join(dir,'dist/search-index.json'),'[]');
  const page=join(dir,'dist/index.html');
  await writeFile(page,'<a href="/cosmic-atelier/">Home</a><script type="application/ld+json">{"@type":"WebSite"}</script>');
  const run=()=>execFileSync(process.execPath,[resolve('scripts/verify-build.mjs')],{cwd:dir,stdio:'pipe'});
  assert.doesNotThrow(run);
  for(const html of ['<a href="/articles/">Bad base</a>','<img src="/cosmic-atelier/missing.webp">','<script type="application/ld+json">{bad}</script>']){
   await writeFile(page,html);assert.throws(run);
  }
 }finally{await rm(dir,{recursive:true});}
});
