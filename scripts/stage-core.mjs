import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {appendFile,readFile,mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {identityFromFiles,realGit,registryState} from './tag-release-guard.mjs';

const repository='martletdesign/core',name='@martlet/core';
export function acceptedMain({git,sha,eventSha,ref,repo}) {
  assert.match(sha??'',/^[a-f0-9]{40}$/,'Invalid source commit');
  assert.equal(repo,repository); assert.equal(ref,'refs/heads/main'); assert.equal(sha,eventSha);
  assert.equal(git(['rev-parse','HEAD']).trim(),sha);
  assert.equal(git(['rev-parse','refs/remotes/origin/main']).trim(),sha);
  assert.equal(git(['ls-remote','--refs','origin','refs/heads/main']).trim(),`${sha}\trefs/heads/main`,'Production main changed or unavailable');
  git(['merge-base','--is-ancestor','HEAD','origin/main']);
}
export function archiveDigest(bytes,expected) {
  assert.match(expected??'',/^[a-f0-9]{64}$/,'Invalid expected archive digest');
  const digest=createHash('sha256').update(bytes).digest('hex');
  assert.equal(digest,expected,'Archive differs from accepted release artifact'); return digest;
}
async function preflight() {
  const pkg=JSON.parse(await readFile('package.json','utf8'));
  await identityFromFiles({tag:`v${pkg.version}`,repository:process.env.GITHUB_REPOSITORY,expectedRepository:repository,expectedName:name});
  acceptedMain({git:realGit,sha:process.env.APPROVED_SHA,eventSha:process.env.GITHUB_SHA,ref:process.env.GITHUB_REF,repo:process.env.GITHUB_REPOSITORY});
  const state=await registryState(url=>fetch(url,{signal:AbortSignal.timeout(15000),redirect:'error'}),'https://registry.npmjs.org/',name,pkg.version);
  assert.equal(state,'absent',`Registry version must be absent; observed ${state}`);
  return pkg;
}
async function main() {
  const pkg=await preflight();
  if(process.argv[2]==='preflight')return;
  assert.equal(process.argv[2],'prepare');
  const temp=process.argv[3]; assert.ok(temp,'Runner temporary directory required');
  const output=join(temp,'core-out'); await mkdir(output);
  const source=execFileSync('git',['archive','HEAD'],{timeout:30000,maxBuffer:16*1024*1024});
  let first;
  for(const suffix of ['one','two']) {
    const dir=join(temp,`core-src-${suffix}`);await mkdir(dir);
    execFileSync('tar',['-x','-C',dir],{input:source,timeout:30000});
    const file=join(dir,'package.json'),manifest=JSON.parse(await readFile(file,'utf8'));
    assert.deepEqual(manifest,pkg);manifest.private=false;await writeFile(file,JSON.stringify(manifest,null,2)+'\n');
    const packed=JSON.parse(execFileSync('npm',['pack','--ignore-scripts','--json','--pack-destination',output],{cwd:dir,encoding:'utf8',timeout:60000,maxBuffer:1024*1024}));
    assert.equal(packed.length,1);
    const archive=join(output,packed[0].filename),bytes=await readFile(archive);
    archiveDigest(bytes,process.env.EXPECTED_SHA256);
    if(first)assert.deepEqual(bytes,first,'Independent package builds differ');else first=bytes;
    execFileSync(process.execPath,['scripts/tag-release-cli.mjs','inspect',archive],{timeout:30000,stdio:'inherit'});
    if(suffix==='two')await appendFile(process.env.GITHUB_OUTPUT,`archive=${archive}\nname=${pkg.name}\nversion=${pkg.version}\nsha256=${process.env.EXPECTED_SHA256}\n`);
  }
}
if(process.argv[1]===fileURLToPath(import.meta.url))await main();
