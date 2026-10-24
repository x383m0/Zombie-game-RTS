import {readFileSync,writeFileSync} from 'node:fs';

const modules=['core','navigation','combat','simulation','effects','renderer','input','main'];
const code=modules.map(name=>readFileSync(`src/${name}.js`,'utf8')
  .replace(/^import .*;\n/gm,'').replace(/^export /gm,'')).join('\n');
const script = content => `<script>\n${content.replace(/<\/script/gi,'<\\/script')}\n</script>`;
const page=readFileSync('src/page.html','utf8')
  .replace('<!-- BOOTSTRAP -->',()=>script(readFileSync('src/boot.js','utf8')));
const html=page
  .replace('<link rel="stylesheet" href="style.css">',()=>`<style>${readFileSync('style.css','utf8')}</style>`)
  .replace('<!-- GAME_SCRIPT -->',()=>script(`"use strict";\n(() => {\n${code}\n})();`));
// Both entry points work on file:// as well as HTTP. Keep a separate module
// entry for development; never require users to start a server just to play.
writeFileSync('index.html',html);
writeFileSync('Jouer.html',html);
writeFileSync('dev.html',page.replace('<!-- GAME_SCRIPT -->',()=>'<script type="module" src="src/main.js"></script>'));
