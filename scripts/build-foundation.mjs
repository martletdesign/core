import { readFile, writeFile, mkdir } from 'node:fs/promises';
const source = JSON.parse(await readFile(new URL('../source.json', import.meta.url), 'utf8'));
const { foundation, design } = source;
await mkdir('dist', { recursive: true });
const declarations = Object.entries(foundation.tokens).map(([key, value]) => `  --martlet-${key}: ${value};`).join('\n');
await writeFile('dist/foundation.css', `/* Origin: jameshoward.us. Variables only; no element styles or font downloads. */\n:root, [data-martlet] {\n${declarations}\n}\n@media (prefers-reduced-motion: reduce) {\n  :root, [data-martlet] { --martlet-transition-ui: 0s; --martlet-motion-duration: 0s; }\n}\n`);
const typography = `/* Optional typography, independent of font loading. */
:where(.martlet) { font-family: var(--martlet-font-serif); font-size: var(--martlet-text-body); line-height: var(--martlet-leading-body); }
:where(.martlet) :where(h1,h2,h3) { font-family: var(--martlet-font-serif); font-weight: 400; line-height: var(--martlet-leading-heading); text-wrap: balance; }
:where(.martlet) :where(h4,h5,h6) { font-family: var(--martlet-font-display); font-weight: 600; line-height: var(--martlet-leading-heading); }
:where(.martlet) :where(h1,h2,h3,h4,h5,h6) { overflow-wrap: anywhere; }
:where(.martlet) h1 { font-size: var(--martlet-text-h1); }
:where(.martlet) h2 { font-size: var(--martlet-text-h2); }
:where(.martlet) h3 { font-size: var(--martlet-text-h3); }
:where(.martlet) :where(nav,button,input,select,textarea,table,.martlet-ui) { font-family: var(--martlet-font-sans); }
:where(.martlet) :where(code,pre,kbd,samp), :where(.martlet-code) { font-family: var(--martlet-font-mono); }
`;
await writeFile('dist/typography.css', typography);
const fontImports = [
  '@fontsource/cambo/400.css',
  ...[400,600,700,800].map(w => `@fontsource/cinzel/${w}.css`),
  ...[400,700].flatMap(w => [`@fontsource/lato/${w}.css`, `@fontsource/lato/${w}-italic.css`]),
  ...[400,500,600,700].flatMap(w => [`@fontsource/ibm-plex-mono/${w}.css`, `@fontsource/ibm-plex-mono/${w}-italic.css`]),
];
await writeFile('dist/fonts.css', fontImports.map(path => `@import '${path}';`).join('\n')+'\n');
await writeFile('dist/full.css', "@import './theme.css';\n@import './foundation.css';\n@import './typography.css';\n@import './components.css';\n@import './layout.css';\n@import './patterns.css';\n@import './forms.css';\n");
await writeFile('dist/foundation.json', JSON.stringify(foundation,null,2)+'\n');
await writeFile('dist/capabilities.json', JSON.stringify(source.capabilities,null,2)+'\n');
await writeFile('dist/design.json', JSON.stringify(design,null,2)+'\n');

await writeFile('dist/components.css', await readFile(new URL('../styles/components.css', import.meta.url), 'utf8'));

const aliases = Object.keys(foundation.tokens).map(key => `  --${key}: var(--martlet-${key});`).join('\n');
await writeFile('dist/legacy.css', `/* Optional aliases for an existing website migrating to Martlet. */\n:root {\n${aliases}\n}\n`);

await writeFile('dist/layout.css', await readFile(new URL('../styles/layout.css',import.meta.url),'utf8'));
await writeFile('dist/layout.json', JSON.stringify(source.layout,null,2)+'\n');

for (const name of ['patterns','source-profile','forms','site','site-tokens','site-base','site-content','site-documents','site-home','site-header','site-footer','site-intro']) await writeFile(`dist/${name}.css`, await readFile(new URL(`../styles/${name}.css`, import.meta.url), 'utf8'));
await writeFile('dist/language.json', await readFile(new URL('../language.json', import.meta.url), 'utf8'));
