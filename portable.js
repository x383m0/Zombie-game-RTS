import {readFileSync,writeFileSync} from 'node:fs';
const modules=['core','navigation','combat','simulation','effects','renderer','input','main'];
const code=modules.map(name=>readFileSync(`src/${name}.js`,'utf8').replace(/^import .*;\n/gm,'').replace(/^export /gm,'')).join('\n');
const html=readFileSync('index.html','utf8').replace('<link rel="stylesheet" href="style.css">',`<style>${readFileSync('style.css','utf8')}</style>`).replace('<script type="module" src="src/main.js"></script>',`<script type="module">\n${code}\n</script>`);
writeFileSync('Jouer.html',html);
