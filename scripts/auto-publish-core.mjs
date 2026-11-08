import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {appendFile,readFile,mkdir,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {acceptedMain,extractSource,archiveDigest} from './stage-core.mjs';
import {identityFromFiles,realGit,registryState,releaseVersion} from './tag-release-guard.mjs';

export const config={repository:'martletdesign/core',name:'@martlet/core',workflow:'Verify Martlet npm'};
const fetchTimed=(url,options={})=>fetch(url,{...options,signal:AbortSignal.timeout(15000),redirect:'error'});
const output=async values=>{if(process.env.GITHUB_OUTPUT)await appendFile(process.env.GITHUB_OUTPUT,Object.entries(values).map(([k,v])=>k+'='+v+'\n').join(''));};
export function acceptedWorkflow(event){
 const r=event?.workflow_run;
 assert.equal(event?.action,'completed');assert.equal(event?.repository?.full_name,config.repository);
 assert.equal(r?.head_repository?.full_name,config.repository);
 assert.equal(r?.status,'completed');assert.equal(r?.conclusion,'success');assert.equal(r?.event,'push');
 assert.equal(r?.head_branch,'main');assert.equal(r?.name,config.workflow);assert.equal(r?.path,'.github/workflows/verify.yml');
 assert.match(r?.head_sha??'',/^[a-f0-9]{40}$/);return r.head_sha;
}
export function advertisedMain(git){
 const match=/^([a-f0-9]{40})\trefs\/heads\/main$/.exec(git(['ls-remote','--refs','origin','refs/heads/main']).trim());
 assert.ok(match,'Current production main is unavailable or malformed');return match[1];
}
export function availableTag({git,tag,sha}){
 releaseVersion(tag);assert.match(sha,/^[a-f0-9]{40}$/);
 const ref='refs/tags/'+tag,lines=git(['ls-remote','origin',ref,ref+'^{}']).trim();
 if(!lines)return 'absent';
 const refs=new Map();
 for(const line of lines.split('\n')){
  const parts=line.split('\t');assert.equal(parts.length,2);assert.match(parts[0],/^[a-f0-9]{40}$/);
  assert.ok(parts[1]===ref||parts[1]===ref+'^{}','Unexpected release tag response');assert.ok(!refs.has(parts[1]));refs.set(parts[1],parts[0]);
 }
 assert.ok(refs.has(ref));assert.equal(refs.get(ref+'^{}')??refs.get(ref),sha,'Existing release tag identifies another source');return 'matching';
}
export async function publicationDecision({event,git,identity,registry}){
 const sha=acceptedWorkflow(event);
 const pkg=await identity();
 if(advertisedMain(git)!==sha)return {status:'superseded-main',sha};
 acceptedMain({git,sha,eventSha:sha,ref:'refs/heads/main',repo:config.repository});
 const state=await registry(pkg.version);
 if(state==='present')return {status:'already-published',sha,version:pkg.version};
 assert.equal(state,'absent','Registry absence is unknown; automatic publication refused');
 availableTag({git,tag:'v'+pkg.version,sha});
 return {status:'ready',sha,pkg,...releaseVersion('v'+pkg.version)};
}
export function acceptedPublishedSource({git,sha,eventSha,ref,repo}){
 assert.equal(repo,config.repository);assert.equal(ref,'refs/heads/main');assert.match(sha??'',/^[a-f0-9]{40}$/);
 assert.equal(eventSha,sha);assert.equal(git(['rev-parse','HEAD']).trim(),sha);
 const current=advertisedMain(git);assert.equal(git(['rev-parse','origin/main']).trim(),current);
 assert.ok(git(['rev-list','--first-parent','origin/main']).trim().split('\n').includes(sha),'Published source must remain on accepted main history');
}
export async function packAccepted(pkg,temporary){
 const source=execFileSync('git',['archive','HEAD'],{timeout:30000,maxBuffer:16*1024*1024});
 const directory=join(temporary,'source'),destination=join(temporary,'archive');
 await mkdir(directory);await mkdir(destination);extractSource(source,directory);
 const path=join(directory,'package.json'),manifest=JSON.parse(await readFile(path,'utf8'));
 assert.deepEqual(manifest,pkg);assert.equal(manifest.private,true);manifest.private=false;
 await writeFile(path,JSON.stringify(manifest,null,2)+'\n');
 const packed=JSON.parse(execFileSync('npm',['pack','--ignore-scripts','--json','--pack-destination',destination],{cwd:directory,encoding:'utf8',timeout:60000,maxBuffer:1024*1024}));
 assert.equal(packed.length,1);assert.equal(packed[0].filename,'martlet-core-'+pkg.version+'.tgz');
 const archive=join(destination,packed[0].filename);
 execFileSync(process.execPath,['scripts/tag-release-cli.mjs','inspect',archive],{timeout:30000,stdio:'inherit'});
 return {archive,sha256:createHash('sha256').update(await readFile(archive)).digest('hex')};
}
export function githubApi(fetcher,token){
 assert.ok(token,'Scoped GitHub workflow token is required');
 return async(path,{method='GET',body,statuses=[200]}={})=>{
  const response=await fetcher('https://api.github.com/repos/'+config.repository+(path?'/'+path:''),{
   method,headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'core-trusted-publication',...(body?{'Content-Type':'application/json'}:{})},
   ...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000),redirect:'error',
  });
  assert.ok(statuses.includes(response.status),'GitHub '+method+' '+path+' failed ('+response.status+')');
  return {status:response.status,body:response.status===204?null:await response.json()};
 };
}
export async function completeTag({api,tag,sha}){
 const {channel}=releaseVersion(tag);assert.match(sha,/^[a-f0-9]{40}$/);
 const repository=await api('');assert.equal(repository.body.full_name,config.repository);
 const path='git/ref/tags/'+encodeURIComponent(tag);
 const readTag=async()=>{
  const response=await api(path,{statuses:[200,404]});
  if(response.status===404){assert.equal(response.body.message,'Not Found');return null;}
  assert.equal(response.body.ref,'refs/tags/'+tag);let object=response.body.object;
  for(let depth=0;object?.type==='tag';depth++){
   assert.ok(depth<4,'Excessively nested annotated tag');assert.match(object.sha,/^[a-f0-9]{40}$/);
   object=(await api('git/tags/'+object.sha)).body.object;
  }
  assert.equal(object?.type,'commit');assert.equal(object.sha,sha,'Release tag belongs to another source');return object.sha;
 };
 if(!await readTag()){
  const created=await api('git/refs',{method:'POST',body:{ref:'refs/tags/'+tag,sha},statuses:[201,422]});
  if(created.status===201){assert.equal(created.body.ref,'refs/tags/'+tag);assert.equal(created.body.object?.sha,sha);}
  assert.equal(await readTag(),sha,'Protected tag creation could not be verified');
 }
 const release=await api('releases/tags/'+encodeURIComponent(tag),{statuses:[200,404]});
 if(release.status===200){
  assert.equal(release.body.tag_name,tag);assert.equal(release.body.draft,false);assert.equal(release.body.prerelease,channel==='next');
  return {status:'source-release-already-exists',tag};
 }
 assert.equal(release.body.message,'Not Found');
 await api('actions/workflows/tag-release.yml/dispatches',{method:'POST',body:{ref:tag},statuses:[204]});
 return {status:'source-release-dispatched',tag,sha};
}
async function identity(){
 const pkg=JSON.parse(await readFile('package.json','utf8'));
 await identityFromFiles({tag:'v'+pkg.version,repository:process.env.GITHUB_REPOSITORY,expectedRepository:config.repository,expectedName:config.name});
 return pkg;
}
async function main(){
 assert.equal(process.env.GITHUB_REPOSITORY,config.repository);
 const command=process.argv[2];
 if(command==='watch'){
  assert.equal(process.env.GITHUB_EVENT_NAME,'workflow_run');
  const event=JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH,'utf8'));
  const decision=await publicationDecision({event,git:realGit,identity,registry:version=>registryState(fetchTimed,'https://registry.npmjs.org/',config.name,version)});
  if(decision.status!=='ready'){console.log(JSON.stringify(decision));await output({status:decision.status});return;}
  const temporary=await mkdtemp(join(process.env.RUNNER_TEMP??tmpdir(),'core-auto-publication-'));
  try{
   const archive=await packAccepted(decision.pkg,temporary);
   acceptedMain({git:realGit,sha:decision.sha,eventSha:decision.sha,ref:'refs/heads/main',repo:config.repository});
   const api=githubApi(fetchTimed,process.env.GH_TOKEN);
   await api('actions/workflows/core-stage.yml/dispatches',{method:'POST',body:{ref:'main',inputs:{source_commit:decision.sha,artifact_sha256:archive.sha256,distribution_tag:decision.channel,publish_mode:'publish'}},statuses:[204]});
   console.log(JSON.stringify({status:'publisher-dispatched',sha:decision.sha,version:decision.version,artifactSha256:archive.sha256}));await output({status:'publisher-dispatched'});
  }finally{await rm(temporary,{recursive:true,force:true});}
 }else if(command==='guard-tag'){
  assert.equal(process.env.GITHUB_EVENT_NAME,'workflow_dispatch');const pkg=await identity(),sha=process.env.APPROVED_SHA;
  acceptedMain({git:realGit,sha,eventSha:process.env.GITHUB_SHA,ref:process.env.GITHUB_REF,repo:config.repository});
  availableTag({git:realGit,tag:'v'+pkg.version,sha});
 }else if(command==='complete'){
  assert.equal(process.env.GITHUB_EVENT_NAME,'workflow_dispatch');assert.equal(process.env.GITHUB_REF,'refs/heads/main');
  const pkg=await identity(),sha=process.env.APPROVED_SHA;
  acceptedPublishedSource({git:realGit,sha,eventSha:process.env.GITHUB_SHA,ref:process.env.GITHUB_REF,repo:process.env.GITHUB_REPOSITORY});
  archiveDigest(await readFile(process.argv[3]),process.env.EXPECTED_SHA256);
  console.log(JSON.stringify(await completeTag({api:githubApi(fetchTimed,process.env.GH_TOKEN),tag:'v'+pkg.version,sha})));
 }else throw Error('Unknown automatic publication operation');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();

