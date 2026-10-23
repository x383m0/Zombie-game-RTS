import './portable.js';
import {cpSync,mkdirSync} from 'node:fs';
mkdirSync('dist',{recursive:true});for(const p of ['index.html','Jouer.html','style.css','src'])cpSync(p,`dist/${p}`,{recursive:true});
