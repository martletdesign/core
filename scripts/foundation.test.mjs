import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { themes, foundation, design, capabilities } from '../dist/index.js';
const require = createRequire(import.meta.url);
test('font roles are independent and originate with the personal site', () => {
  assert.equal(foundation.origin, 'https://jameshoward.us/');
  for (const [role,family] of Object.entries({serif:'Cambo',sans:'Lato',display:'Cinzel',mono:'IBM Plex Mono'})) {
    assert.equal(foundation.typographyRoles[role].family,family);
    assert.ok(design.fonts[role].includes(family));
  }
});
test('the original light/dark color contract is unchanged', async () => {
  const baseline = JSON.parse(await readFile(new URL('../tests/colors-v1.json',import.meta.url),'utf8'));
  assert.deepEqual(themes, baseline);
});
test('color-only import does not load fonts or apply typography', async () => {
  const css = await readFile('dist/theme.css','utf8');
  assert.doesNotMatch(css, /@import|@font-face|font-family|:root/);
  assert.match(css, /\[data-martlet="light"\]/);
});
test('optional fonts resolve locally and retain upstream licenses', async () => {
  const css = await readFile('dist/fonts.css','utf8');
  assert.doesNotMatch(css,/https?:|Berkeley/);
  for (const [,path] of css.matchAll(/@import '([^']+)'/g)) assert.ok((await readFile(require.resolve(path))).length);
  for (const family of ['cambo','cinzel','lato','ibm-plex-mono']) {
    const pkg=require.resolve(`@fontsource/${family}/package.json`);
    const license=await readFile(new URL('./LICENSE',`file://${pkg}`),'utf8');
    assert.match(license,/OPEN FONT LICENSE/i);
  }
});
test('reduced motion and capability limits are explicit', async () => {
  assert.match(await readFile('dist/foundation.css','utf8'),/prefers-reduced-motion: reduce/);
  assert.ok(capabilities.firefox.unsupported.includes('fonts'));
  assert.ok(capabilities.vim.separateConfiguration.includes('monospace font'));
});
test('optional native controls apply the existing legible placeholder role',async()=>{
  const css=await readFile('dist/components.css','utf8');
  assert.match(css,/\.martlet :where\(input,textarea\)::placeholder\s*\{\s*color: var\(--martlet-input-placeholder\);\s*opacity: 1;/);
  assert.doesNotMatch(await readFile('dist/theme.css','utf8'),/::placeholder/);
  const luminance=hex=>hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((sum,x,i)=>sum+x*[.2126,.7152,.0722][i],0);
  for(const theme of Object.values(themes)) {
    const a=luminance(theme.tokens['input-placeholder']),b=luminance(theme.tokens['input-bg']);
    assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,theme.mode+' placeholder/input background contrast');
  }
});
