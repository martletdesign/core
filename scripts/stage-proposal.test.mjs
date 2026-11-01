import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('staging proposal remains manual, inert and staged-only',async()=>{
 const text=await readFile('.github/workflows/core-stage.yml','utf8');
 assert.match(text,/workflow_dispatch:/);
 assert.match(text,/if:\s*\$\{\{ false \}\}/);
 assert.match(text,/environment:\s*core-stage-review/);
 assert.match(text,/id-token:\s*write/);
 assert.match(text,/npm stage publish/);
 assert.doesNotMatch(text,/\bnpm publish\b/);
 assert.match(text,/git merge-base --is-ancestor HEAD origin\/main/);
 assert.match(text,/sha256sum --check/);
 assert.match(text,/pkg\.private|v\.private/);
});
