import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {verifyProvenance} from './tag-release-guard.mjs';
const audit=JSON.parse(await readFile(process.argv[2],'utf8')),archive=await readFile(process.argv[3]);
if(createHash('sha256').update(archive).digest('hex')!=='1395eb206514b54500e4a098b1aafe59492c516c301a7e8c81a18672f6f4ce42')throw Error('Published tarball differs from reviewed bytes');
if(!verifyProvenance({audit,archive,name:'@martlet/core',version:'2.2.3',repository:'martletdesign/core',tag:'unused',commit:'3a504ce2c2d34c7dc44cf5ec094d255eaf1aeac6',expectedWorkflow:'.github/workflows/core-stage.yml',expectedRef:'refs/heads/main',expectedEvent:'workflow_dispatch'}))throw Error('Verified existing provenance identity mismatch');
console.log('Published archive and supplied verified-audit provenance match the recorded source');
