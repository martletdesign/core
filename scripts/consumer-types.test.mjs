import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,symlink,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';

test('independent ESM and CommonJS TypeScript consumers can use existing runtime tokens',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'martlet-types-'));
 try {
  await mkdir(join(dir,'node_modules','@martlet'),{recursive:true});
  await symlink(resolve('.'),join(dir,'node_modules','@martlet','core'),'dir');
  const fixture=`import {design,foundation,layout,light} from '@martlet/core';
const measure:string=design.widths['reading-width'];
const shadow:string=design.shadows['shadow-sm'];
const motion:string=design.motion.transition;
const provenance:string=foundation.sourceRepository+foundation.sourceCommit;
const columns:string|number=layout.defaults.columns;
const color:string=light.tokens.text;
// @ts-expect-error public tokens are readonly
design.widths['reading-width']='99rem';
// @ts-expect-error public provenance is readonly
foundation.sourceCommit='changed';
void [measure,shadow,motion,provenance,columns,color];\n`;
  for(const ext of ['mts','cts'])await writeFile(join(dir,`consumer.${ext}`),fixture);
  const result=spawnSync(process.execPath,['node_modules/typescript/bin/tsc','--noEmit','--strict','--module','nodenext','--target','es2022',join(dir,'consumer.mts'),join(dir,'consumer.cts')],{encoding:'utf8',timeout:30000});
  assert.equal(result.status,0,result.stdout+result.stderr+String(result.error??''));
 }finally{await rm(dir,{recursive:true,force:true});}
});
