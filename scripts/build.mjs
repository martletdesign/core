import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {vimTheme,vimDispatcher,emacsTheme,chromeTheme,firefoxTheme,highlightCSS} from './app-ports.mjs';
const data=JSON.parse(await readFile('source.json','utf8'));
const {family,label,version,themes,heritage,design,foundation,capabilities,layout,kind}=data;
const outputs=new Map();
const json=x=>JSON.stringify(x,null,2)+'\n';
const rule=t=>`[data-${family}="${t.mode}"] {\n  color-scheme: ${t.mode};\n${Object.entries(t.tokens).map(([k,v])=>`  --${family}-${k}: ${v.toLowerCase()};`).join('\n')}\n}\n`;
if(kind==='npm'){
 const value={name:label,version,heritage,design,foundation,capabilities,layout,themes};
 outputs.set('dist/tokens.json',json(value));
 outputs.set('dist/theme.css',Object.values(themes).map(rule).join('\n'));
 for(const t of Object.values(themes)){
  outputs.set(`dist/${t.mode}.css`,rule(t));
  outputs.set(`dist/${t.mode}.json`,json({version,...t}));
  outputs.set(`dist/highlight-${t.mode}.css`,highlightCSS(t,version));
 }
 const designTypes=Object.keys(design).map(key=>`readonly ${JSON.stringify(key)}: Readonly<Record<string,string>>;`).join(' ');
 const foundationExtras=[['sourceFiles', 'readonly sourceFiles: readonly string[];'], ['normalization', 'readonly normalization: Readonly<Record<string,string>>;']].filter(([key])=>key in foundation).map(([,declaration])=>declaration).join(' ');
 const shared=`const data = ${JSON.stringify(value)};\nconst {themes,heritage,design,foundation,capabilities,layout,version}=data;\nconst {light,dark}=themes;\n`;
 outputs.set('dist/index.js',shared+'export {themes,light,dark,heritage,design,foundation,capabilities,layout,version};\nexport default themes;\n');
 outputs.set('dist/index.cjs',shared+'module.exports={themes,light,dark,heritage,design,foundation,capabilities,layout,version,default:themes};\n');
 outputs.set('dist/index.d.ts',`export interface Theme { readonly id: string; readonly name: string; readonly mode: 'light' | 'dark'; readonly tokens: Readonly<Record<string,string>>; }\nexport declare const themes: {readonly light: Theme; readonly dark: Theme};\nexport declare const light: Theme;\nexport declare const dark: Theme;\nexport declare const version: string;\nexport declare const heritage: Readonly<Record<string,string>>;\nexport declare const design: { ${designTypes} };\nexport declare const foundation: { readonly origin: string; readonly sourceRepository: string; readonly sourceCommit: string; ${foundationExtras} readonly tokens: Readonly<Record<string,string>>; readonly typographyRoles: Readonly<Record<string,unknown>> };\nexport declare const layout: {readonly schemaVersion: number; readonly primitives: readonly string[]; readonly compositions: readonly string[]; readonly defaults: Readonly<Record<string,string | number>>; readonly tokens: Readonly<Record<string,string>>; readonly sources: readonly {readonly url: string; readonly repository: string; readonly commit: string; readonly files: readonly string[]}[]; readonly normalization: Readonly<Record<string,string>>};\nexport declare const capabilities: Readonly<Record<string,unknown>>;\nexport default themes;\n`);
}
if(kind==='vim'){
 for(const t of Object.values(themes)) outputs.set(`colors/${t.id}.vim`,vimTheme(t,version));
 outputs.set(`colors/${family}.vim`,vimDispatcher(family));
}
if(kind==='emacs'){
 for(const t of Object.values(themes)) outputs.set(`${t.id}-theme.el`,emacsTheme(t,version));
 outputs.set(`${family}-themes.el`,`;;; ${family}-themes.el --- ${label} Light and Dark themes -*- lexical-binding: t; -*-\n;; Copyright (C) 2026 James P. Howard, II\n;; Version: ${version}\n;; Package-Requires: ((emacs "27.1"))\n;; URL: https://github.com/${family}theme/emacs\n;; Keywords: faces, theme\n;; SPDX-License-Identifier: MIT\n;;; Commentary:\n;; Load this package to register the directory; select a variant with load-theme.\n;;; Code:\n;;;###autoload\n(when load-file-name\n  (add-to-list 'custom-theme-load-path (file-name-directory load-file-name)))\n(provide '${family}-themes)\n;;; ${family}-themes.el ends here\n`);
}
if(kind==='chrome') for(const t of Object.values(themes)) outputs.set(`themes/${t.mode}/manifest.json`,json(chromeTheme(t,version)));
if(kind==='firefox') outputs.set('theme/manifest.json',json(firefoxTheme(themes,family,version)));
if(!['npm','vim','emacs','chrome','firefox'].includes(kind)) throw new Error('Unknown port kind');
for(const [path,body] of outputs){await mkdir(dirname(path),{recursive:true});await writeFile(path,body);}
// Portable, deterministic, uncompressed ZIP writer (no external tools or dependencies).
function zip(entries){
 const local=[],central=[];let offset=0;
 const crc32=b=>{let c=0xffffffff;for(const byte of b){c^=byte;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;};
 for(const [name,body] of entries){
  const n=Buffer.from(name),b=Buffer.from(body),crc=crc32(b);
  const h=Buffer.alloc(30);h.writeUInt32LE(0x04034b50);h.writeUInt16LE(20,4);h.writeUInt16LE(0x800,6);h.writeUInt16LE(33,12);h.writeUInt32LE(crc,14);h.writeUInt32LE(b.length,18);h.writeUInt32LE(b.length,22);h.writeUInt16LE(n.length,26);
  local.push(h,n,b);
  const c=Buffer.alloc(46);c.writeUInt32LE(0x02014b50);c.writeUInt16LE(20,4);c.writeUInt16LE(20,6);c.writeUInt16LE(0x800,8);c.writeUInt16LE(33,14);c.writeUInt32LE(crc,16);c.writeUInt32LE(b.length,20);c.writeUInt32LE(b.length,24);c.writeUInt16LE(n.length,28);c.writeUInt32LE(offset,42);central.push(c,n);offset+=h.length+n.length+b.length;
 }
 const body=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(entries.length,8);end.writeUInt16LE(entries.length,10);end.writeUInt32LE(body.length,12);end.writeUInt32LE(offset,16);return Buffer.concat([...local,body,end]);
}
if(kind!=='npm'){
 await mkdir('dist',{recursive:true});
 const license=await readFile('LICENSE','utf8');
 if(kind==='chrome'){
  for(const mode of ['light','dark']) await writeFile(`dist/${family}-${mode}-chrome.zip`,zip([['manifest.json',outputs.get(`themes/${mode}/manifest.json`)],['LICENSE',license]]));
 }else if(kind==='firefox') await writeFile(`dist/${family}-firefox.zip`,zip([['manifest.json',outputs.get('theme/manifest.json')],['LICENSE',license]]));
 else await writeFile(`dist/${family}-${kind}.zip`,zip([...outputs.entries(),['LICENSE',license],['README.md',await readFile('README.md','utf8')]]));
}
console.log(`Built ${label} ${kind} ${version}.`);
