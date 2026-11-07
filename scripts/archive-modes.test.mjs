import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,chmod,stat,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';

test('stage extraction preserves Git modes and identical package bytes under restrictive umasks',async()=>{
 const root=await mkdtemp(join(tmpdir(),'core-modes-')),source=join(root,'source');
 try {
  await mkdir(source);
  await writeFile(join(source,'package.json'),JSON.stringify({name:'core-mode-rehearsal',version:'0.0.0',files:['source.txt','run.mjs'],bin:{'mode-rehearsal':'run.mjs'}})+'\n');
  await writeFile(join(source,'source.txt'),'Canonical file bytes\n');await writeFile(join(source,'run.mjs'),'#!/usr/bin/env node\n');
  await chmod(join(source,'package.json'),0o644);await chmod(join(source,'source.txt'),0o644);await chmod(join(source,'run.mjs'),0o755);
  const git=args=>execFileSync('git',args,{cwd:source,timeout:30000,stdio:['ignore','pipe','pipe']});
  git(['init','-b','main']);git(['config','user.name','Archive rehearsal']);git(['config','user.email','archive@example.invalid']);git(['config','tar.umask','0022']);git(['add','.']);git(['commit','-m','fixture']);
  const archive=join(root,'source.tar');await writeFile(archive,git(['archive','HEAD']));
  const script=`import {readFileSync} from 'node:fs';const {extractSource}=await import(process.argv[1]);process.umask(parseInt(process.argv[4],8));extractSource(readFileSync(process.argv[2]),process.argv[3]);`;
  const packages=[];
  for(const mask of ['0022','0077']) {
   const target=join(root,mask),output=join(root,'pack-'+mask);await mkdir(target);await mkdir(output);
   const extracted=spawnSync(process.execPath,['--input-type=module','-e',script,new URL('./stage-core.mjs',import.meta.url).href,archive,target,mask],{encoding:'utf8',timeout:30000});
   assert.equal(extracted.status,0,extracted.stderr);
   assert.equal((await stat(join(target,'source.txt'))).mode&0o777,0o644);assert.equal((await stat(join(target,'run.mjs'))).mode&0o777,0o755);
   assert.equal(await readFile(join(target,'source.txt'),'utf8'),'Canonical file bytes\n');
   const packed=spawnSync('npm',['pack','--dry-run=false','--ignore-scripts','--json','--pack-destination',output],{cwd:target,encoding:'utf8',timeout:30000});
   assert.equal(packed.status,0,packed.stderr);packages.push(await readFile(join(output,JSON.parse(packed.stdout)[0].filename)));
  }
  assert.deepEqual(packages[0],packages[1]);
  const workflow=await readFile('.github/workflows/tag-release.yml','utf8');
  assert.match(workflow,/umask 077/);assert.match(workflow,/git archive HEAD \| tar --same-permissions -x/);
 }finally{await rm(root,{recursive:true,force:true});}
});
