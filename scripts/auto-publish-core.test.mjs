import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {acceptedWorkflow,advertisedMain,availableTag,publicationDecision,acceptedPublishedSource,completeTag,githubApi,config} from './auto-publish-core.mjs';
const sha='a'.repeat(40),newer='b'.repeat(40),tag='v9.8.7';
const event=()=>({action:'completed',repository:{full_name:config.repository},workflow_run:{name:config.workflow,path:'.github/workflows/verify.yml',head_repository:{full_name:config.repository},head_sha:sha,head_branch:'main',event:'push',conclusion:'success',status:'completed'}});
const git=(main=sha,tagResponse='')=>args=>args[0]==='ls-remote'?(args.includes('refs/heads/main')?main+'\trefs/heads/main':tagResponse):args[0]==='rev-parse'?(args.at(-1)==='HEAD'?sha:main):args[0]==='rev-list'?main+'\n'+sha:'';
test('automatic publication accepts only the exact completed successful push workflow on this repository main',()=>{
 assert.equal(acceptedWorkflow(event()),sha);
 for(const [field,value] of [['name','Other verification'],['path','.github/workflows/other.yml'],['event','pull_request'],['head_branch','develop'],['head_sha','not-a-sha'],['conclusion','failure'],['status','in_progress']]){
  const altered=event();altered.workflow_run[field]=value;assert.throws(()=>acceptedWorkflow(altered),field);
 }
 for(const change of [e=>e.repository.full_name='other/core',e=>e.workflow_run.head_repository.full_name='fork/core',e=>e.action='requested']){const altered=event();change(altered);assert.throws(()=>acceptedWorkflow(altered));}
});
test('uncertain main never counts as an accepted or superseded source',()=>{
 assert.equal(advertisedMain(git()),sha);
 for(const remote of ['',sha+'\trefs/heads/develop',sha+'\trefs/heads/main\n'+sha+'\trefs/heads/main','bad\trefs/heads/main'])assert.throws(()=>advertisedMain(()=>remote));
});
test('automatic selection validates identity before skip, skips known published versions and refuses registry uncertainty',async()=>{
 let identities=0;
 const input={event:event(),git:git(),identity:async()=>{identities++;return{name:config.name,version:'9.8.7'};},registry:async()=> 'present'};
 assert.equal((await publicationDecision(input)).status,'already-published');assert.equal(identities,1);
 await assert.rejects(publicationDecision({...input,identity:async()=>{throw Error('invalid source/lock identity');}}),/invalid source/);
 assert.equal((await publicationDecision({...input,registry:async()=> 'absent'})).status,'ready');
 await assert.rejects(publicationDecision({...input,registry:async()=> 'unknown'}),/Registry absence is unknown/);
 const obsolete=await publicationDecision({...input,git:git(newer),registry:async()=>{throw Error('must not query registry for obsolete source');}});
 assert.equal(obsolete.status,'superseded-main');
});
test('release-tag guard permits absent or identical tags, including annotated tags, and rejects conflicting/malformed refs',()=>{
 const ref='refs/tags/'+tag;
 assert.equal(availableTag({git:git(),tag,sha}),'absent');
 assert.equal(availableTag({git:git(sha,sha+'\t'+ref),tag,sha}),'matching');
 assert.equal(availableTag({git:git(sha,newer+'\t'+ref+'\n'+sha+'\t'+ref+'^{}'),tag,sha}),'matching');
 for(const response of [newer+'\t'+ref,'bad\t'+ref,sha+'\trefs/tags/v0.0.0',sha+'\t'+ref+'\n'+sha+'\t'+ref])assert.throws(()=>availableTag({git:git(sha,response),tag,sha}));
});
test('postpublication completion accepts the original published source on main first-parent after main advances',()=>{
 const input={git:git(newer),sha,eventSha:sha,ref:'refs/heads/main',repo:config.repository};
 acceptedPublishedSource(input);
 for(const change of [{eventSha:newer},{ref:'refs/heads/develop'},{repo:'fork/core'}])assert.throws(()=>acceptedPublishedSource({...input,...change}));
 assert.throws(()=>acceptedPublishedSource({...input,git:args=>args[0]==='rev-list'?newer:input.git(args)}),/accepted main history/);
 assert.throws(()=>acceptedPublishedSource({...input,git:args=>args[0]==='ls-remote'?sha+'\trefs/heads/main':input.git(args)}));
});
function fakeApi({exists=false,target=sha,race=false,release=false,foreign=false}={}){
 const calls=[];
 const api=async(path,options={})=>{
  const method=options.method??'GET';calls.push({path,method,body:options.body});
  if(path==='')return{status:200,body:{full_name:foreign?'other/core':config.repository}};
  if(path==='git/ref/tags/'+tag)return exists?{status:200,body:{ref:'refs/tags/'+tag,object:{type:'commit',sha:target}}}:{status:404,body:{message:'Not Found'}};
  if(path==='git/refs'&&method==='POST'){assert.deepEqual(options.body,{ref:'refs/tags/'+tag,sha});exists=true;return race?{status:422,body:{message:'Reference already exists'}}:{status:201,body:{ref:'refs/tags/'+tag,object:{type:'commit',sha}}};}
  if(path==='releases/tags/'+tag)return release?{status:200,body:{tag_name:tag,draft:false,prerelease:false}}:{status:404,body:{message:'Not Found'}};
  if(path==='actions/workflows/tag-release.yml/dispatches'&&method==='POST'){assert.deepEqual(options.body,{ref:tag});return{status:204,body:null};}
  throw Error('Unexpected GitHub call '+method+' '+path);
 };return{api,calls};
}
test('completion creates only an absent exact tag and explicitly dispatches source release at that tag',async()=>{
 for(const race of [false,true]){
  const fixture=fakeApi({race});const result=await completeTag({api:fixture.api,tag,sha});
  assert.equal(result.status,'source-release-dispatched');
  assert.deepEqual(fixture.calls.filter(x=>x.method==='POST').map(x=>x.path),['git/refs','actions/workflows/tag-release.yml/dispatches']);
  assert.ok(fixture.calls.every(x=>['GET','POST'].includes(x.method)));
 }
});
test('completion never overwrites an existing tag/release or dispatches when identity differs',async()=>{
 const existing=fakeApi({exists:true,release:true});
 assert.equal((await completeTag({api:existing.api,tag,sha})).status,'source-release-already-exists');
 assert.equal(existing.calls.filter(x=>x.method!=='GET').length,0);
 for(const input of [{exists:true,target:newer},{foreign:true}]){
  const fixture=fakeApi(input);await assert.rejects(completeTag({api:fixture.api,tag,sha}));
  assert.equal(fixture.calls.filter(x=>x.method!=='GET').length,0);
 }
 await assert.rejects(completeTag({api:async()=>{throw Error('network failure');},tag,sha}),/network failure/);
});
test('GitHub client has bounded nonredirecting requests and treats access failures as failures',async()=>{
 let observed;
 const api=githubApi(async(url,options)=>{observed={url,options};return{status:204};},'scoped-test-token');
 await api('actions/workflows/core-stage.yml/dispatches',{method:'POST',body:{ref:'main'},statuses:[204]});
 assert.equal(observed.url,'https://api.github.com/repos/'+config.repository+'/actions/workflows/core-stage.yml/dispatches');
 assert.equal(observed.options.redirect,'error');assert.ok(observed.options.signal instanceof AbortSignal);
 await assert.rejects(githubApi(async()=>({status:403}),'scoped-test-token')(''),/failed \(403\)/);
});
test('workflow wiring preserves trusted identity, stage default and separate least-privilege completion',async()=>{
 const watcher=await readFile('.github/workflows/auto-publish.yml','utf8'),publisher=await readFile('.github/workflows/core-stage.yml','utf8'),release=await readFile('.github/workflows/tag-release.yml','utf8');
 assert.match(watcher,/workflow_run:/);assert.ok(watcher.includes("workflows: ['"+config.workflow+"']"));
 for(const term of ["conclusion == 'success'","event == 'push'","head_branch == 'main'","head_repository.full_name == github.repository",'github.event.workflow_run.head_sha','actions: write'])assert.ok(watcher.includes(term),term);
 assert.doesNotMatch(watcher,/id-token:|download-artifact|npm (?:stage )?publish/);
 const group=watcher.match(/\n  group: ([^\n]+)/)?.[1];assert.ok(group);
 const key=event=>group.replace(/\$\{\{\s*github\.repository\s*\}\}/g,config.repository).replace(/\$\{\{\s*github\.event\.workflow_run\.event\s*\}\}/g,event);
 assert.notEqual(key('push'),key('pull_request'),'A skipped PR verification must not cancel a genuine push watcher');
 assert.match(watcher,/cancel-in-progress: true/,'Read-only push watchers cancel superseded pushes');
 assert.match(publisher,/default: stage/);assert.match(publisher,/environment: core-stage-review/);
 assert.equal((publisher.match(/stage-core\.mjs preflight/g)??[]).length,2);
 const [stage,complete]=publisher.split('\n  complete:\n');
 assert.match(stage,/id-token: write/);assert.doesNotMatch(stage,/contents: write|actions: write/);
 assert.match(complete,/contents: write/);assert.match(complete,/actions: write/);assert.doesNotMatch(complete,/id-token:/);
 const jobEnvironment=complete.slice(complete.indexOf('\n    env:'),complete.indexOf('\n    steps:'));
 assert.doesNotMatch(jobEnvironment,/\$\{\{\s*runner\./,'runner context is unavailable in a job-level env');
 assert.match(complete,/verify-registry/);assert.match(complete,/verify-stage-provenance/);
 assert.match(release,/workflow_dispatch:/);assert.match(release,/tags: \['v\*'\]/);assert.doesNotMatch(release,/npm (?:stage )?publish/);
});

