import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {releaseVersion,validateIdentity,productionCommit,registryState,verifyArchive,verifyProvenance} from './tag-release-guard.mjs';

const pkg={name:'@martlet/core',version:'2.2.3',private:true,repository:{url:'git+https://github.com/martletdesign/core.git'},dependencies:{font:'1.0.0'}};
const input={tag:'v2.2.3',pkg,source:{version:'2.2.3'},lock:{name:pkg.name,version:pkg.version,packages:{'':{name:pkg.name,version:pkg.version,dependencies:pkg.dependencies}}},repository:'martletdesign/core',expectedRepository:'martletdesign/core',expectedName:'@martlet/core'};
test('tag and package source/lock identity must agree',()=>{
  assert.deepEqual(validateIdentity(input),{version:'2.2.3',channel:'latest'});
  const reordered={...pkg,dependencies:{z:'1',a:'2'}};
  assert.doesNotThrow(()=>validateIdentity({...input,pkg:reordered,lock:{...input.lock,packages:{'':{...input.lock.packages[''],dependencies:{a:'2',z:'1'}}}}}));
  assert.throws(()=>validateIdentity({...input,pkg:{...pkg,peerDependencies:{example:'^1.0.0'}}}));
  assert.equal(releaseVersion('v2.2.4-rc.1').channel,'next');
  for(const t of ['v02.2.3','v2.2','v2.2.3-rc.01','v2.2.3+1']) assert.throws(()=>releaseVersion(t));
  for(const change of [{tag:'v2.2.4'},{repository:'other/core'},{source:{version:'2.2.4'}},{pkg:{...pkg,private:false}},{lock:{...input.lock,version:'2.2.4'}}]) assert.throws(()=>validateIdentity({...input,...change}));
});
test('tag protection, event SHA, first-parent and remote ref all gate release',()=>{
  const sha='1'.repeat(40),object='2'.repeat(40);
  const git=args=>args[0]==='ls-remote'?(args.at(-1)==='refs/heads/main'?`${object}\trefs/heads/main`:`${object}\trefs/tags/v2.2.3`):args[0]==='rev-list'?`${sha}\n`:(args.at(-1).endsWith('^{commit}')||args.at(-1)==='HEAD'?sha:object);
  productionCommit({git,tag:'v2.2.3',sha,protectedRef:'true'});
  assert.throws(()=>productionCommit({git,tag:'v2.2.3',sha,protectedRef:'false'}));
  assert.throws(()=>productionCommit({git,tag:'v2.2.3',sha:'3'.repeat(40),protectedRef:'true'}));
  assert.throws(()=>productionCommit({git:args=>args[0]==='rev-list'?'4'.repeat(40):git(args),tag:'v2.2.3',sha,protectedRef:'true'}));
  assert.throws(()=>productionCommit({git:args=>args[0]==='ls-remote'?'':git(args),tag:'v2.2.3',sha,protectedRef:'true'}));
});
test('registry uncertainty fails closed and existing versions are rejected',async()=>{
  const res=(status,body)=>({status,json:async()=>body});
  async function check(items) {return registryState(async()=>{const r=items.shift();if(r instanceof Error)throw r;return r;},'https://registry.npmjs.org/','@martlet/core','2.2.3');}
  const root={name:'@martlet/core',versions:{}};
  assert.equal(await check([res(200,root),res(404)]),'absent');
  assert.equal(await check([res(200,root),res(200,{name:'@martlet/core',version:'2.2.3'})]),'present');
  assert.equal(await check([res(200,{...root,versions:{'2.2.3':{name:'@martlet/core',version:'2.2.3'}}}),res(404)]),'present');
  assert.equal(await check([res(200,{...root,versions:{'2.2.3':{name:'@other/core',version:'2.2.3'}}}),res(404)]),'unknown');
  for(const items of [[res(404)], [res(403)], [new Error('offline')], [res(200,{name:'@martlet/core'})], [res(200,root),res(500)]]) assert.equal(await check(items),'unknown');
});
test('registry package identity, bytes and integrity must match',()=>{
  const local=Buffer.from('reviewed'), metadata={name:'@martlet/core',version:'2.2.3',dist:{integrity:`sha512-${createHash('sha512').update(local).digest('base64')}`}};
  assert.equal(verifyArchive({local,remote:local,metadata,name:pkg.name,version:pkg.version}),true);
  assert.equal(verifyArchive({local,remote:Buffer.from('different'),metadata,name:pkg.name,version:pkg.version}),false);
  assert.equal(verifyArchive({local,remote:local,metadata:{...metadata,name:'@other/core'},name:pkg.name,version:pkg.version}),false);
});
test('tag release completes an existing verified publication without npm write permission',async()=>{
  const draft=await readFile('.github/workflows/tag-release.yml','utf8');
  await assert.rejects(readFile('.github/workflows/publish.yml','utf8'),{code:'ENOENT'});
  assert.match(draft,/push:\s*\n\s*tags:\s*\['v\*'\]/);
  assert.doesNotMatch(draft,/npm (?:stage )?publish|id-token:|core-production-release|RELEASE_ENVIRONMENT_READY/);
  assert.match(draft,/completion-preflight/);
  assert.match(draft,/verify-stage-provenance/);
  assert.match(draft,/SHA256SUMS/);
  assert.match(draft,/timeout-minutes:\s*15/);
  assert.match(draft,/verify-registry/);
});

test('recovery refuses malformed tags before contacting the registry',()=>{
  const run=spawnSync(process.execPath,['scripts/tag-release-cli.mjs','verify-registry','missing.tgz'],{env:{...process.env,RELEASE_TAG:'x2.2.3'},encoding:'utf8'});
  assert.notEqual(run.status,0);assert.match(run.stderr,/Invalid release tag/);
});

test('verified provenance must identify the exact package, tag, workflow and commit',()=>{
  const archive=Buffer.from('release bytes'),commit='a'.repeat(40),tag='v2.2.3',repository=input.expectedRepository;
  const [scope,packageName]=pkg.name.split('/');
  const statement={_type:'https://in-toto.io/Statement/v1',predicateType:'https://slsa.dev/provenance/v1',subject:[{name:`pkg:npm/${encodeURIComponent(scope)}/${packageName}@2.2.3`,digest:{sha512:createHash('sha512').update(archive).digest('hex')}}],predicate:{runDetails:{builder:{id:'https://github.com/actions/runner/github-hosted'}},buildDefinition:{buildType:'https://slsa-framework.github.io/github-actions-buildtypes/workflow/v1',externalParameters:{workflow:{repository:`https://github.com/${repository}`,path:'.github/workflows/tag-release.yml',ref:`refs/tags/${tag}`}},internalParameters:{github:{event_name:'push'}},resolvedDependencies:[{uri:`git+https://github.com/${repository}@refs/tags/${tag}`,digest:{gitCommit:commit}}]}}};
  const makeAudit=s=>({invalid:[],missing:[],verified:[{name:pkg.name,version:'2.2.3',attestationBundles:[{predicateType:'https://slsa.dev/provenance/v1',bundle:{dsseEnvelope:{payload:Buffer.from(JSON.stringify(s)).toString('base64')}}}]}]});
  const args={audit:makeAudit(statement),archive,name:pkg.name,version:'2.2.3',repository,tag,commit};
  assert.equal(verifyProvenance(args),true);
  const stage=structuredClone(statement),definition=stage.predicate.buildDefinition;
  definition.externalParameters.workflow={repository:`https://github.com/${repository}`,path:'.github/workflows/core-stage.yml',ref:'refs/heads/main'};
  definition.internalParameters.github.event_name='workflow_dispatch';
  definition.resolvedDependencies=[{uri:`git+https://github.com/${repository}@refs/heads/main`,digest:{gitCommit:commit}}];
  const staged={...args,audit:makeAudit(stage),expectedWorkflow:'.github/workflows/core-stage.yml',expectedRef:'refs/heads/main',expectedEvent:'workflow_dispatch'};
  assert.equal(verifyProvenance(staged),true);
  for(const change of [{commit:'c'.repeat(40)},{expectedRef:'refs/heads/develop'},{expectedEvent:'push'},{expectedWorkflow:'.github/workflows/tag-release.yml'}])assert.equal(verifyProvenance({...staged,...change}),false);
  assert.equal(verifyProvenance({...args,commit:'b'.repeat(40)}),false);
  assert.equal(verifyProvenance({...args,archive:Buffer.from('other')}),false);
  assert.equal(verifyProvenance({...args,audit:{...args.audit,invalid:[{}]}}),false);
  assert.equal(verifyProvenance({...args,audit:{invalid:[],missing:[],verified:[]}}),false);
  const altered=structuredClone(statement);altered.predicateType='https://example.invalid/provenance';
  assert.equal(verifyProvenance({...args,audit:makeAudit(altered)}),false);
  altered.predicateType=statement.predicateType;altered.predicate.runDetails.builder.id='https://example.invalid/builder';
  assert.equal(verifyProvenance({...args,audit:makeAudit(altered)}),false);
  altered.predicate.runDetails.builder.id=statement.predicate.runDetails.builder.id;altered.predicate.buildDefinition.buildType='https://example.invalid/build';
  assert.equal(verifyProvenance({...args,audit:makeAudit(altered)}),false);
  statement.predicate.buildDefinition.externalParameters.workflow.path='.github/workflows/other.yml';
  assert.equal(verifyProvenance({...args,audit:makeAudit(statement)}),false);
});


test('release refuses a stale or unavailable live production branch',()=>{
  const sha='1'.repeat(40),main='2'.repeat(40),tag='v1.2.3';
  const git=a=>a[0]==='ls-remote'?`${main}\t${a.at(-1)}`:a[0]==='rev-list'?sha:(a.at(-1).endsWith('^{commit}')||a.at(-1)==='HEAD'?sha:main);
  const input={git,tag,sha,protectedRef:'true'};
  productionCommit(input);
  for(const advertised of ['',`${'3'.repeat(40)}\trefs/heads/main`,`${main}\trefs/heads/other`,`${main}\trefs/heads/main\n${main}\trefs/heads/main`]){
    assert.throws(()=>productionCommit({...input,git:a=>a[0]==='ls-remote'&&a.at(-1)==='refs/heads/main'?advertised:git(a)}),/Production main/);
  }
});
