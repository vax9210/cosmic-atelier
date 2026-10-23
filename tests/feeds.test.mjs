import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {parseApod,parseArxiv,updateFeed} from '../scripts/update-feeds.mjs';
import {imageURL, dateISO, publishedArticle, publishedPhoto, slugOf, jsonLD} from '../src/lib/site.js';
import {validFeedItem, loadFeed} from '../src/lib/feed-data.js';
test('APOD keeps metadata only, including copyrighted and video records',()=>{
 for(const media_type of ['image','video']){
 const [item]=parseApod({title:'Sky',date:'2026-10-23',media_type,copyright:'Photographer',url:'https://example.com/photo',explanation:'Do not copy'});
 assert.equal(item.credit,'Photographer');assert.ok(item.url.endsWith('ap261023.html'));assert.ok(!JSON.stringify(item).includes('Do not copy'));assert.ok(!JSON.stringify(item).includes('example.com'));
 }assert.throws(()=>parseApod({}));
});
test('arXiv Atom metadata supports multiline titles, authors and HTTPS links',()=>{
 const [p]=parseArxiv('<feed><entry><id>http://arxiv.org/abs/2610.12345v1</id><title>Stars &amp;\n galaxies</title><published>2026-10-23T00:00:00Z</published><author><name>A. Scientist</name></author><category term="astro-ph.GA"/></entry></feed>');
 assert.equal(p.title,'Stars & galaxies');assert.equal(p.url,'https://arxiv.org/abs/2610.12345v1');assert.deepEqual(p.authors,['A. Scientist']);assert.deepEqual(p.categories,['astro-ph.GA']);
 assert.throws(()=>parseArxiv('<html>bad gateway</html>'));assert.throws(()=>parseArxiv('<feed></feed>'));
});
test('API errors and malformed responses never overwrite a good cache',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'cosmic-test-'));const file=join(dir,'cache.json');await writeFile(file,'original');
 try{for(const fetcher of [async()=>{throw Error('offline')},async()=>({ok:false,status:429}),async()=>({ok:true,text:async()=>'{bad json'})]){
 assert.equal(await updateFeed(file,'https://example.com',JSON.parse,fetcher),false);assert.equal(await readFile(file,'utf8'),'original');
 }
 assert.equal(await updateFeed(file,'https://example.com',JSON.parse,async()=>({ok:true,text:async()=>'[{"title":"new"}]'})),true);assert.equal(JSON.parse(await readFile(file,'utf8')).items[0].title,'new');
 }finally{await rm(dir,{recursive:true});}
});
test('media paths retain the GitHub Pages base and reject active schemes',()=>{
 assert.equal(imageURL('media/a.png'),'/cosmic-atelier/media/a.png');assert.equal(imageURL('/media/a.png'),'/cosmic-atelier/media/a.png');assert.equal(imageURL('/cosmic-atelier/media/a.png'),'/cosmic-atelier/media/a.png');assert.equal(imageURL('javascript:alert(1)'),'');
});
test('dates, Windows filenames and draft rules agree across routes and search',()=>{
 assert.equal(dateISO(new Date('2026-10-23T00:00:00Z')),'2026-10-23');
 assert.equal(dateISO('invalid date'),'');
 assert.equal(slugOf({file:'D:\\project\\src\\content\\articles\\old-uuid.md'}),'old-uuid');
 assert.equal(publishedArticle({frontmatter:{draft:true}}),false);
 assert.equal(publishedArticle({frontmatter:{draft:false}}),true);
 assert.equal(publishedArticle({frontmatter:{}}),true);
 assert.equal(publishedPhoto({frontmatter:{draft:false,photo:'media/a.png'}}),true);
 assert.equal(publishedPhoto({frontmatter:{draft:true,photo:'media/a.png'}}),false);
 assert.equal(publishedPhoto({frontmatter:{photo:'media/a.png'}}),false);
 assert.ok(!jsonLD({title:'</script><script>bad</script>'}).includes('<'));
});
test('bad calendar dates and unsafe feed links are rejected',()=>{
 assert.throws(()=>parseApod({title:'Sky',date:'2026-02-31',media_type:'image'}));
 assert.throws(()=>parseApod({title:'',date:'2026-10-23',media_type:'image'}));
 assert.equal(validFeedItem({title:'x',date:'2026-10-23',url:'javascript:alert(1)',authors:[],categories:[]},'research'),false);
 const [item]=parseArxiv('<feed><entry><id>https://arxiv.org/abs/2610.12345</id><title><![CDATA[Stars &#38; galaxies]]></title><published>2026-10-23</published></entry></feed>');
 assert.equal(item.title,'Stars & galaxies');
});
test('missing cache falls back without requiring environment secrets',async()=>{
 assert.deepEqual(await loadFeed('not-a-feed'),{updatedAt:null,items:[]});
 const data=await loadFeed('apod');assert.ok(Array.isArray(data.items));
});
test('corrupted cache and unsafe cached records cannot break a page build',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'cosmic-cache-'));
 try{
  await writeFile(join(dir,'research.json'),'{bad');
  assert.deepEqual(await loadFeed('research',dir),{updatedAt:null,items:[]});
  await writeFile(join(dir,'research.json'),JSON.stringify({items:[{title:'unsafe',date:'2026-10-23',url:'javascript:alert(1)'}]}));
  assert.deepEqual(await loadFeed('research',dir),{updatedAt:null,items:[]});
 }finally{await rm(dir,{recursive:true});}
});
