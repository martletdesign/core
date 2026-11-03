import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
const source=JSON.parse(await readFile('source.json','utf8'));
const {kind,themes,family}=source;
if(kind==='npm'){
 test('ES modules and CommonJS expose the same canonical colors',async()=>{
  const esm=await import('../dist/index.js');
  const cjs=(await import('../dist/index.cjs')).default;
  assert.deepEqual(esm.themes,themes);assert.deepEqual(cjs.themes,themes);
  assert.equal(esm.dark.tokens.accent,themes.dark.tokens.accent);
 });
 test('design declarations cover every exported string-token group',async()=>{
  const esm=await import('../dist/index.js');
  const declarations=await readFile('dist/index.d.ts','utf8');
  const designType=declarations.match(/export declare const design: \{([^}]+)\}/)?.[1];
  assert.ok(designType);
  const declared=[...designType.matchAll(/readonly "([^"]+)": Readonly<Record<string,string>>;/g)].map(match=>match[1]);
  assert.deepEqual(declared,Object.keys(esm.design));
  for(const group of Object.values(esm.design)) assert.ok(Object.values(group).every(value=>typeof value==='string'));
 });
 test('foundation declarations expose the shipped provenance fields',async()=>{
  const esm=await import('../dist/index.js');
  const declarations=await readFile('dist/index.d.ts','utf8');
  const foundationType=declarations.match(/export declare const foundation: \{([^}]+)\}/)?.[1];
  assert.ok(foundationType);
  const declared=[...foundationType.matchAll(/readonly (\w+):/g)].map(match=>match[1]);
  assert.deepEqual(declared.sort(),Object.keys(esm.foundation).sort());
  assert.equal(typeof esm.foundation.sourceRepository,'string');
  assert.equal(typeof esm.foundation.sourceCommit,'string');
  if ('sourceFiles' in esm.foundation) assert.ok(esm.foundation.sourceFiles.every(value=>typeof value==='string'));
  if ('normalization' in esm.foundation) assert.ok(Object.values(esm.foundation.normalization).every(value=>typeof value==='string'));
 });
 test('package exports resolve and CSS preserves scoped roles',async()=>{
  const pkg=JSON.parse(await readFile('package.json','utf8'));
  for(const value of Object.values(pkg.exports)) for(const path of typeof value==='string'?[value]:Object.values(value)) assert.ok((await readFile(path)).length);
  for(const t of Object.values(themes)) assert.ok((await readFile(`dist/${t.mode}.css`,'utf8')).includes(`--${family}-bg: ${t.tokens.bg.toLowerCase()}`));
  assert.deepEqual(JSON.parse(await readFile('dist/tokens.json','utf8')).themes,themes);
 });
}
if(kind==='vim'){
 test('both variants load and switch in Vim and Neovim',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'theme-vim-'));let checked=0;
  try{
   for(const [bin,args] of [['vim',['-Nu','NONE','-n','-es','-V1']],['nvim',['--headless','-u','NONE','-n']]]){
    const probe=spawnSync(bin,['--version'],{encoding:'utf8'});if(probe.error)continue;
    for(const mode of ['light','dark']){
     const file=join(dir,bin+'-'+mode+'.vim');
     const script=`set rtp^=${process.cwd()}\nsyntax on\nset termguicolors\nset background=${mode}\ncolorscheme ${family}\ncall assert_equal('${family}-${mode}',g:colors_name)\ncall assert_equal('${themes[mode].tokens.text.toLowerCase()}',tolower(synIDattr(hlID('Normal'),'fg','gui')))\ncall assert_equal('${themes[mode].tokens.bg.toLowerCase()}',tolower(synIDattr(hlID('Normal'),'bg','gui')))\nset notermguicolors\ncolorscheme ${family}-${mode}\ncall assert_true(str2nr(synIDattr(hlID('Normal'),'fg','cterm')) >= 16)\nif !empty(v:errors)\n  for err in v:errors | echom err | endfor\n  cquit 1\nendif\nqa!\n`;
     await writeFile(file,script);
     const r=spawnSync(bin,[...args,'-S',file],{encoding:'utf8'});assert.equal(r.status,0,bin+' '+mode+' '+r.stderr+r.stdout);checked++;
    }
   }
   assert.ok(checked>=4,'Install Vim and Neovim to run the native smoke tests.');
  }finally{await rm(dir,{recursive:true,force:true});}
 });
}
if(kind==='emacs'){
 test('Emacs loads both native themes and restores default face colors',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'theme-emacs-'));
  try{
   const script=join(dir,'test.el');
   await writeFile(script,`(add-to-list 'custom-theme-load-path ${JSON.stringify(process.cwd())})\n`+Object.values(themes).map(t=>`(mapc #'disable-theme custom-enabled-themes)\n(load-theme '${t.id} t)\n(unless (equal (face-attribute 'default :foreground nil t) "${t.tokens.text}") (error "Foreground mismatch"))\n(unless (equal (face-attribute 'default :background nil t) "${t.tokens.bg}") (error "Background mismatch"))\n`).join(''));
   const r=spawnSync('emacs',['-Q','--batch','-l',script],{encoding:'utf8'});assert.equal(r.status,0,r.stderr||String(r.error));
  }finally{await rm(dir,{recursive:true,force:true});}
 });
}
if(kind==='chrome'||kind==='firefox'){
 test('browser manifests have no executable extension capabilities',async()=>{
  const files=kind==='chrome'?['themes/light/manifest.json','themes/dark/manifest.json']:['theme/manifest.json'];
  for(const file of files){
   const m=JSON.parse(await readFile(file,'utf8'));
   for(const key of ['permissions','host_permissions','content_scripts','background','chrome_url_overrides','externally_connectable'])assert.equal(m[key],undefined,key);
   assert.equal(m.version,source.version);
   if(kind==='chrome')for(const v of Object.values(m.theme.colors))assert.ok(Array.isArray(v)&&v.length===3&&v.every(n=>Number.isInteger(n)&&n>=0&&n<=255));
   else{assert.equal(m.theme.colors.toolbar,themes.light.tokens.bg);assert.equal(m.dark_theme.colors.toolbar,themes.dark.tokens.bg);assert.deepEqual(m.browser_specific_settings.gecko.data_collection_permissions.required,['none']);}
  }
 });
}
