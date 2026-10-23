import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';

test('local imports exist and package imports are declared or Node/Astro built-ins',async()=>{
 const pkg=JSON.parse(await readFile('package.json','utf8'));
 const files=['astro.config.mjs'];
 async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){
  const path=`${dir}/${entry.name}`;if(entry.isDirectory())await walk(path);else if(/\.(astro|mjs|js)$/.test(path))files.push(path);
 }}
 await walk('src');await walk('scripts');
 for(const file of files){
  const code=await readFile(file,'utf8');
  for(const [,specifier] of code.matchAll(/\bfrom\s+["']([^"']+)["']/g)){
   if(specifier.startsWith('.'))await assert.doesNotReject(readFile(resolve(dirname(file),specifier)),`${file}: ${specifier}`);
   else if(!specifier.startsWith('node:')&&!specifier.startsWith('astro:')){
    const name=specifier.startsWith('@')?specifier.split('/').slice(0,2).join('/'):specifier.split('/')[0];
    assert.ok(pkg.dependencies?.[name]||pkg.devDependencies?.[name],`${file}: undeclared ${name}`);
   }
  }
 }
});
