import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('Core preserves the pinned theme package contract and private source guard',async()=>{
 const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
 const baseline=JSON.parse(await readFile(new URL('./theme-contract.json',import.meta.url),'utf8'));
 for(const [key,value] of Object.entries(baseline))assert.deepEqual(pkg[key],key==='exports'?{...value,'./site.css':'./dist/site.css',...Object.fromEntries(['reference','reference-fonts','reference-shell','dashboards','react','react-reference'].map(name=>[`./${name}.css`,`./dist/${name}.css`]))}:value,`${key} differs from the pinned theme contract`);
 assert.equal(pkg.name,'@martlet/core');assert.equal(pkg.private,true);
});
