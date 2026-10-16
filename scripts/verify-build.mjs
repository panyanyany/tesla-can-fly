import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=path=>readFile(new URL(`../dist/${path}`,import.meta.url),'utf8');
for(const lang of ['zh','en']){
 const home=await read(`${lang}/index.html`),play=await read(`${lang}/play/index.html`);
 assert.ok(home.includes(`href="/${lang}/play/"`),`${lang}: hero CTA must link to game`);
 assert.ok(!home.includes('<canvas'),`${lang}: home must not initialize game canvas`);
 assert.ok(play.includes('id="scene"'),`${lang}: game canvas missing`);
 assert.ok(play.includes(`href="/${lang}/"`),`${lang}: home link missing`);
 for(const [name,html] of [['home',home],['play',play]]){
  assert.equal((html.match(/src="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-LM61Y9VGDC"/g)||[]).length,1,`${lang}/${name}: expected one GA4 loader`);
  assert.equal((html.match(/gtag\('config', 'G-LM61Y9VGDC'\)/g)||[]).length,1,`${lang}/${name}: expected one GA4 initialization`);
 }
 for(const match of home.matchAll(/<script[^>]+src="([^"]+)"/g)){
  if(!match[1].startsWith('/'))continue;
  const source=await read(match[1].replace(/^\//,''));
  assert.ok(!source.includes('WebGLRenderer'),`${lang}: Three.js was bundled into landing page`);
 }
}
assert.ok((await read('404.html')).includes('404'));
const config=JSON.parse(await readFile(new URL('../wrangler.jsonc',import.meta.url),'utf8'));
assert.equal(config.assets.directory,'./dist');
assert.equal(config.assets.not_found_handling,'404-page');
assert.ok(!config.main,'Static-only deployment must not need an SSR Worker');
console.log('Verified bilingual static routes, CTA separation, game entry and Worker asset configuration.');
