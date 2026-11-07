import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {acceptedMain,archiveDigest} from './stage-core.mjs';

test('stage refuses stale, unavailable or non-main source identity',()=>{
 const sha='a'.repeat(40),input={sha,eventSha:sha,ref:'refs/heads/main',repo:'martletdesign/core'};
 const git=args=>args[0]==='ls-remote'?`${sha}\trefs/heads/main`:args[0]==='merge-base'?'':sha;
 acceptedMain({...input,git});
 for(const change of [{sha:'not-a-sha'},{eventSha:'b'.repeat(40)},{ref:'refs/heads/develop'},{repo:'other/core'}])assert.throws(()=>acceptedMain({...input,git,...change}));
 for(const advertised of ['',`${'b'.repeat(40)}\trefs/heads/main`,`${sha}\trefs/heads/main\n${sha}\trefs/heads/main`])assert.throws(()=>acceptedMain({...input,git:a=>a[0]==='ls-remote'?advertised:git(a)}));
 assert.throws(()=>acceptedMain({...input,git:a=>a[0]==='rev-parse'&&a.at(-1)==='HEAD'?'b'.repeat(40):git(a)}));
});
test('staged archive must match the exact supplied digest',()=>{
 const bytes=Buffer.from('accepted package'),hash=createHash('sha256').update(bytes).digest('hex');
 assert.equal(archiveDigest(bytes,hash),hash);
 for(const digest of ['',hash.toUpperCase(),'a'.repeat(64)])assert.throws(()=>archiveDigest(bytes,digest));
 assert.throws(()=>archiveDigest(Buffer.from('changed package'),hash));
});
test('existing manual publisher remains bounded, restricted and staged-only',async()=>{
 const text=await readFile('.github/workflows/core-stage.yml','utf8');
 assert.match(text,/\non:\n  workflow_dispatch:\n/);
 assert.doesNotMatch(text,/^  (push|pull_request|release|schedule|workflow_call):/m);
 assert.match(text,/environment:\s*core-stage-review/);
 assert.match(text,/timeout-minutes:\s*15/);
 assert.match(text,/id-token:\s*write/);
 assert.match(text,/npm stage publish/);assert.doesNotMatch(text,/\bnpm publish\b/);
 assert.match(text,/stage-core\.mjs prepare/);
 assert.equal((text.match(/stage-core\.mjs preflight/g)??[]).length,2);
 assert.doesNotMatch(text,/2\.2\.3|1395eb206/);
 await assert.rejects(readFile('.github/workflows/publish.yml','utf8'),{code:'ENOENT'});
});
