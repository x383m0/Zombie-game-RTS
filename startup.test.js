import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
execFileSync(process.execPath,['scripts/portable.js'],{cwd:root});
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].map(m=>({attrs:m[1],code:m[2]}));

// An offline browser-like harness executes the actual generated scripts, not
// imports of the engine alone. Any missing dependency or DOM ID fails here.
function offlinePage(){
  const events=new Map(),nodes=new Map(),timers=new Map();let raf,now=0,timerId=0;
  const gradient={addColorStop(){}};
  const ctx=new Proxy({createRadialGradient:()=>gradient},{get:(o,k)=>k in o?o[k]:(()=>{})});
  function node(id=''){
    return {id,hidden:false,open:false,style:{},dataset:{},textContent:'',value:'',classList:{add(){},remove(){},toggle(){}},
      addEventListener(){},getContext:()=>ctx,showModal(){this.open=true;},close(){this.open=false;},
      replaceChildren(){},append(){},click(){this.onclick?.();}};
  }
  for(const match of html.matchAll(/id="([^"]+)"/g))nodes.set(match[1],node(match[1]));
  for(const id of ['menu','help','result'])nodes.get(id).hidden=true;
  nodes.get('scenario').value='defense';nodes.get('population').value='1000';
  const requireNode=id=>{assert.ok(nodes.has(id),`Missing HTML element #${id}`);return nodes.get(id);};
  const heading=node();
  const document={documentElement:{dataset:{}},getElementById:requireNode,
    querySelector(selector){if(selector==='dialog[open]')return [...nodes.values()].find(n=>n.open)||null;if(selector==='#panel h1')return heading;if(selector.startsWith('#'))return requireNode(selector.slice(1));throw Error(`Unexpected selector ${selector}`);},
    querySelectorAll:selector=>selector==='dialog[open]'?[...nodes.values()].filter(n=>n.open):[],createElement:()=>node(),createTextNode:text=>({textContent:text})};
  const env={document,console,innerWidth:1363,innerHeight:936,devicePixelRatio:1,structuredClone,Blob,URL,
    location:{protocol:'file:',reload(){}},performance:{now:()=>now},
    addEventListener(type,fn){const list=events.get(type)||[];list.push(fn);events.set(type,list);},
    requestAnimationFrame(fn){raf=fn;return 1;},setTimeout(fn){timers.set(++timerId,fn);return timerId;},clearTimeout(id){timers.delete(id);},
    fetch(){throw Error('An offline HTML entry must not fetch modules or assets.');}};
  env.window=env;vm.createContext(env);
  for(const script of scripts)vm.runInContext(script.code,env,{filename:'index.html',timeout:10000});
  return {document,nodes,events,env,timers,step(count){for(let i=0;i<count;i++){assert.equal(typeof raf,'function','Render loop stopped');now+=1000/30;const frame=raf;raf=null;frame(now);}}};
}

test('index and Jouer are identical offline pages without module or asset fetches',()=>{
  assert.equal(html,readFileSync(new URL('../Jouer.html',import.meta.url),'utf8'));
  assert.equal(scripts.length,2);
  assert.ok(scripts.every(s=>!s.attrs.includes('module')&&!s.attrs.includes('src=')));
  assert.ok(!/<link[^>]+rel="stylesheet"/.test(html));
  assert.ok(!scripts.some(s=>/^import /m.test(s.code)));
});
test('generated index boots offline, draws the map, initializes counters and advances after New Game',()=>{
  const p=offlinePage();assert.equal(p.document.documentElement.dataset.gameState,'ready');
  assert.equal(p.nodes.get('startup').hidden,true);assert.equal(p.nodes.get('u-count').textContent,27);
  assert.equal(p.nodes.get('menu').open,true);assert.ok(Number(p.nodes.get('z-count').textContent.replace(/\D/g,''))>0);
  p.nodes.get('new').onclick();p.step(75);
  assert.notEqual(p.nodes.get('clock').textContent,'00:00');assert.ok(Number(p.nodes.get('credits').textContent.replace(/\D/g,''))>900);
  assert.equal(p.document.documentElement.dataset.gameState,'ready');
});
test('startup diagnostics expose runtime errors instead of leaving a blank frozen map',()=>{
  const p=offlinePage();for(const fn of p.events.get('error'))fn({message:'Test runtime failure'});
  assert.equal(p.document.documentElement.dataset.gameState,'error');assert.equal(p.nodes.get('startup').hidden,false);
  assert.equal(p.nodes.get('startup-details').textContent,'Test runtime failure');assert.equal(p.nodes.get('menu').open,false);
  p.env.ZombieBoot.ready();assert.equal(p.nodes.get('startup').hidden,false);
});
test('missing development modules display instructions for opening the offline entry',()=>{
  const p=offlinePage();for(const fn of p.events.get('error'))fn({target:{tagName:'SCRIPT',src:'file:///src/main.js'}});
  assert.match(p.nodes.get('startup-details').textContent,/index\.html ou Jouer\.html/);
});
