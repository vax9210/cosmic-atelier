import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

// Explicit release audit only: normal CMS edits must not fail the daily build.
test('22 original files including CMS UUID, all content/media and homepage animation match original ZIP',async()=>{
 const files=JSON.parse(await readFile('tests/fixtures/original-files.sha256.json','utf8'));
 assert.ok(files['.pages.yml']);assert.ok(files['index.html']);
 for(const [file,expected] of Object.entries(files)){
  assert.equal(createHash('sha256').update(await readFile(file)).digest('hex'),expected,`Original content changed: ${file}`);
 }
});
