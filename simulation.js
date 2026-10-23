import {SIZE,TILE,STEP,clamp,dist2,random,SpatialHash,segmentDistance} from './core.js';
import {Navigation} from './navigation.js';
import {HEAVY,clusterTarget,GroundMarks} from './combat.js';
export const BUILD={mortar:{label:'Mortier',w:128,h:128,hp:550,cost:420},cannon:{label:'Canon HE',w:64,h:64,hp:650,cost:320},wall:{label:'Barricade',w:64,h:64,hp:950,cost:40},tower:{label:'Tourelle',w:64,h:64,hp:500,cost:220},depot:{label:'Dépôt',w:128,h:128,hp:800,cost:180},barracks:{label:'Caserne',w:128,h:128,hp:900,cost:250}};
export const TROOPS={artillery:{hp:650,r:22,speed:48,range:1450,damage:260,fire:6,mag:1,reserve:24,cost:800},soldier:{hp:100,r:8,speed:95,range:330,damage:24,fire:.24,mag:30,reserve:150,cost:45},apc:{hp:900,r:19,speed:105,range:390,damage:35,fire:.16,mag:80,reserve:400,cost:350},tank:{hp:1600,r:23,speed:66,range:520,damage:140,fire:2.5,mag:1,reserve:35,cost:600},civilian:{hp:60,r:7,speed:63,range:0,cost:0}};
export class Simulation{
 constructor({seed=7421,mode='defense',zombies=2500}={}){this.seed=seed;this.rng=random(seed);this.mode=mode;this.time=0;this.kills=0;this.infected=0;this.rescued=0;this.supplies=900;this.nextId=1;this.units=[];this.zombies=[];this.buildings=[];this.bullets=[];this.shells=[];this.marks=new GroundMarks();this.blastKills=0;this.bestBlast=0;this.effects=[];this.bloodFxThisTick=0;this.noises=[];this.events=[];this.wave=0;this.nextWave=35;this.status='playing';this.income=0;this.nav=new Navigation();this.zgrid=new SpatialHash();this.hgrid=new SpatialHash();this.makeMap();this.nav.rebuild(this.buildings);this.spawn('soldier',24,4100,4380,170);this.spawn('tank',1,4260,4450,30);this.spawn('apc',1,3910,4450,30);this.spawn('artillery',1,4160,4370,30);this.spawn('civilian',80);this.spawn('zombie',zombies);this.log(mode==='sandbox'?'Sandbox actif. Placez vos forces et déclenchez une horde.':'Périmètre actif. Défendez le QG pendant 5 minutes.');}
 log(text){this.events.unshift({time:this.time,text});this.events.length=Math.min(6,this.events.length);}
 makeMap(){const r=this.rng;for(let y=256;y<SIZE-320;y+=384)for(let x=256;x<SIZE-320;x+=384){if(Math.hypot(x-4096,y-4096)<800||r()<.22)continue;const w=r()<.2?192:128,h=r()<.3?192:128;this.buildings.push({id:this.nextId++,kind:w===192?'warehouse':'house',x,y,w,h,hp:99999,maxHp:99999,variant:Math.floor(r()*3)});}
 const base=(kind,x,y,w,h,hp)=>this.buildings.push({id:this.nextId++,kind,x,y,w,h,hp,maxHp:hp,cooldown:0,ammo:HEAVY[kind]?.capacity||600});
 base('hq',4032,4032,128,128,4000);base('depot',3840,4032,128,128,800);base('barracks',4288,4032,128,128,900);
 for(let x=3712;x<=4480;x+=64){if(x<4032||x>4160){base('wall',x,3712,64,64,950);base('wall',x,4544,64,64,950);}}
 for(let y=3776;y<4544;y+=64){if(y<4032||y>4160){base('wall',3712,y,64,64,950);base('wall',4480,y,64,64,950);}}
 base('tower',3776,3776,64,64,500);base('tower',4416,3776,64,64,500);base('mortar',3904,3840,128,128,550);base('cannon',4096,3776,64,64,650);}
 free(x,y,r=10){return !this.nav.blocked(x,y,r)&&!this.units.some(u=>u.hp>0&&dist2(u,{x,y})<(u.r+r+2)**2);}
 position(x,y,spread=100,r=8){for(let k=0;k<150;k++){const px=x===undefined?80+this.rng()*(SIZE-160):clamp(x+(this.rng()-.5)*spread*2,32,SIZE-32),py=y===undefined?80+this.rng()*(SIZE-160):clamp(y+(this.rng()-.5)*spread*2,32,SIZE-32);if(this.nav.blocked(px,py,r))continue;if(x===undefined&&Math.hypot(px-4096,py-4096)<900)continue;return {x:px,y:py};}return null;}
 spawn(kind,n,x,y,spread=160){n=Math.min(n,kind==='zombie'?20000-this.zombies.length:600-this.units.length);let made=0;for(let i=0;i<n;i++){const p=this.position(x,y,spread,kind==='zombie'?5:TROOPS[kind]?.r||8);if(!p)continue;if(kind==='zombie')this.zombies.push({id:this.nextId++,...p,hp:48,maxHp:48,r:5,speed:24+this.rng()*17,angle:this.rng()*6.28,think:this.rng()*.4,target:null,cooldown:0});else{const t=TROOPS[kind];if(!t)continue;this.units.push({id:this.nextId++,...p,kind,...t,maxHp:t.hp,angle:0,body:0,ammo:t.mag||0,reserve:t.reserve||0,reload:0,cooldown:this.rng()*.4,think:0,target:null,path:[],selected:false,stance:'guard',infection:0});}made++;}return made;}
 affordable(cost){return this.mode==='sandbox'||this.supplies>=cost;}
 spend(cost){if(!this.affordable(cost))return false;if(this.mode!=='sandbox')this.supplies-=cost;return true;}
 recruit(kind){const t=TROOPS[kind];if(!t||kind==='civilian')return false;const b=this.buildings.find(b=>b.kind===(kind==='soldier'?'barracks':'hq')&&b.hp>0);if(!b||this.units.length>=600||!this.affordable(t.cost)){this.log('Recrutement impossible : bâtiment, crédits ou limite.');return false;}const made=this.spawn(kind,1,b.x+b.w/2,b.y+b.h+100,70);if(made){this.spend(t.cost);this.log(`${kind==='soldier'?'Soldat':kind==='tank'?'Char':'Blindé'} déployé.`);}return !!made;}
 placement(kind,x,y){const d=BUILD[kind];if(!d)return null;x=Math.floor(x/TILE)*TILE;y=Math.floor(y/TILE)*TILE;const b={kind,x,y,...d};if(x<0||y<0||x+d.w>SIZE||y+d.h>SIZE)return null;for(let yy=y;yy<y+d.h;yy+=TILE)for(let xx=x;xx<x+d.w;xx+=TILE)if(this.nav.solid[this.nav.index(xx,yy)])return null;for(const u of [...this.units,...this.zombies])if(u.hp>0&&u.x+u.r>x&&u.x-u.r<x+d.w&&u.y+u.r>y&&u.y-u.r<y+d.h)return null;if(this.mode!=='sandbox'&&!this.buildings.some(a=>a.kind!=='wall'&&!['house','warehouse'].includes(a.kind)&&a.hp>0&&Math.hypot(x-a.x,y-a.y)<1000))return null;return b;}
 build(kind,x,y){const b=this.placement(kind,x,y);if(this.buildings.length>=3000||!b||!this.spend(b.cost))return false;this.buildings.push({...b,id:this.nextId++,maxHp:b.hp,cooldown:0,ammo:HEAVY[kind]?.capacity||600});this.nav.rebuild(this.buildings);return true;}
 command(ids,x,y,stance='move'){const list=this.units.filter(u=>ids.has(u.id)&&u.kind!=='civilian'&&u.hp>0),cols=Math.ceil(Math.sqrt(list.length));let issued=0;list.forEach((u,i)=>{const px=clamp(x+(i%cols-(cols-1)/2)*38,32,SIZE-32),py=clamp(y+(Math.floor(i/cols)-(cols-1)/2)*38,32,SIZE-32);u.path=this.nav.path(u.x,u.y,px,py);u.stance=stance;u.bombard=null;if(u.path.length)issued++;});if(list.length)this.log(issued?'Ordre transmis.':'Destination inaccessible.');return issued;}
 move(u,goal,dt,speed=u.speed){const dx=goal.x-u.x,dy=goal.y-u.y,d=Math.hypot(dx,dy);if(d<2)return true;const step=Math.min(d,speed*dt),vx=dx/d*step,vy=dy/d*step;let moved=false;if(!this.nav.blocked(u.x+vx,u.y,u.r)){u.x+=vx;moved=true;}if(!this.nav.blocked(u.x,u.y+vy,u.r)){u.y+=vy;moved=true;}if(moved)u.body=Math.atan2(dy,dx);return d<Math.max(8,step+2);}
 fire(shooter,target,kind){
  const x=shooter.x,y=shooter.y,a=Math.atan2(target.y-y,target.x-x),heavy=HEAVY[kind];
  shooter.angle=a;shooter.cooldown=shooter.fire||.18;
  if(heavy?.indirect){
    const flight=clamp(Math.hypot(target.x-x,target.y-y)/650,.8,2.2);
    this.shells.push({x,y,tx:target.x,ty:target.y,elapsed:0,flight,kind});
    this.emit({type:'muzzle',x,y,life:.18,max:.18,r:22,angle:a});
  }else{
    const tank=kind==='tank',speed=heavy?560:950;
    this.bullets.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:heavy?2:.65,damage:heavy?.damage||shooter.damage||30,splash:heavy?.radius||0,kind});
    if(heavy)this.emit({type:'muzzle',x,y,life:.16,max:.16,r:20,angle:a});
  }
  this.noises.push({x,y,life:heavy?5:3});if(this.noises.length>32)this.noises.shift();
 }
 emit(effect){this.effects.push(effect);if(this.effects.length>240)this.effects.shift();}
 damageZombie(z,amount){
  if(z.hp<=0)return;z.hp-=amount;
  if(z.hp<=0){this.kills++;this.marks.stain(z.x,z.y);if(this.bloodFxThisTick++<32)this.emit({type:'blood',x:z.x,y:z.y,life:.45,max:.45,r:16,seed:z.id});}
 }
 explode(x,y,weapon){
  const def=typeof weapon==='string'?HEAVY[weapon]:weapon;
  if(!def)return 0;
  let killed=0;
  this.zgrid.query(x,y,def.radius,z=>{
    const d=Math.sqrt(dist2(z,{x,y}));
    if(d>def.radius||!this.nav.line(x,y,z.x,z.y))return;
    const before=z.hp,falloff=1-.82*d/def.radius;
    this.damageZombie(z,def.damage*falloff);
    if(before>0&&z.hp<=0)killed++;
    else if(z.hp>0){const force=(def.impulse||130)*falloff;z.pushX=(z.pushX||0)+(z.x-x)/(d||1)*force;z.pushY=(z.pushY||0)+(z.y-y)/(d||1)*force;}
  });
  this.blastKills+=killed;this.bestBlast=Math.max(this.bestBlast,killed);
  this.marks.crater(x,y,def.radius);
  this.emit({type:'explosion',x,y,life:1.65,max:1.65,r:def.radius,seed:this.nextId+Math.floor(this.time*30),killed});
  this.noises.push({x,y,life:5});if(this.noises.length>32)this.noises.shift();
  return killed;
 }
 bombard(ids,x,y){
  if(x<0||y<0||x>SIZE||y>SIZE)return 0;
  let count=0;
  for(const u of this.units)if(ids.has(u.id)&&u.kind==='artillery'&&u.hp>0){
    const d=Math.hypot(x-u.x,y-u.y);
    if(d<HEAVY.artillery.minRange||d>u.range)continue;
    u.bombard={x,y};u.path=[];u.stance='guard';count++;
  }
  if(count)this.log(`Barrage d’artillerie : ${count} pièce(s) en position.`);
  return count;
 }
 setupSiege(){
  this.zombies=[];this.bullets=[];this.shells=[];
  this.spawn('zombie',3500,4096,3100,310);
  this.spawn('artillery',1,3980,4290,25);
  this.log('Banc d’essai : 3 500 zombies face aux mortiers et aux canons.');
 }
 tick(dt=STEP){if(this.status!=='playing')return;this.bloodFxThisTick=0;this.time+=dt;this.income+=dt;const hq=this.buildings.find(b=>b.kind==='hq');if(this.income>=1){this.supplies+=8*Math.floor(this.income);this.income%=1;}
 if(this.mode==='defense'&&this.time>=this.nextWave){this.wave++;this.nextWave+=40;const a=this.rng()*Math.PI*2;this.spawn('zombie',200+this.wave*75,4096+Math.cos(a)*1750,4096+Math.sin(a)*1750,420);this.log(`Horde ${this.wave} détectée en approche.`);}
 this.zgrid.rebuild(this.zombies);this.hgrid.rebuild(this.units);let dirty=false;
 for(const z of this.zombies){if(z.hp<=0)continue;if(z.pushX||z.pushY){const dx=(z.pushX||0)*dt,dy=(z.pushY||0)*dt;for(let i=0,n=Math.max(1,Math.ceil(Math.hypot(dx,dy)/4));i<n;i++){if(!this.nav.blocked(z.x+dx/n,z.y,z.r))z.x+=dx/n;if(!this.nav.blocked(z.x,z.y+dy/n,z.r))z.y+=dy/n;}z.pushX=(z.pushX||0)*Math.exp(-6*dt);z.pushY=(z.pushY||0)*Math.exp(-6*dt);}z.cooldown=Math.max(0,z.cooldown-dt);z.think-=dt;if(z.think<=0){z.think=.35+this.rng()*.15;z.target=this.hgrid.nearest(z.x,z.y,250,u=>this.nav.line(z.x,z.y,u.x,u.y));}
 let goal;if(z.target&&z.target.hp>0&&dist2(z,z.target)<320**2){goal=z.target;const d=Math.sqrt(dist2(z,goal));if(d<z.r+goal.r+5){if(z.cooldown<=0){goal.hp-=goal.kind==='soldier'||goal.kind==='civilian'?12:5;if(goal.kind==='soldier'||goal.kind==='civilian')goal.infection=goal.infection||18;z.cooldown=.8;}continue;}}
 else {z.target=null;goal=this.nav.flowGoal(z.x,z.y);for(let i=this.noises.length-1;i>=0;i--){const noise=this.noises[i];if(dist2(z,noise)<480**2&&this.nav.line(z.x,z.y,noise.x,noise.y)){goal=noise;break;}}}
 const dx=goal.x-z.x,dy=goal.y-z.y,d=Math.hypot(dx,dy)||1;let sx=0,sy=0,count=0;this.zgrid.query(z.x,z.y,12,n=>{if(n===z||count>=6)return;const d2=dist2(z,n);if(d2>0&&d2<100){sx+=(z.x-n.x)/d2*10;sy+=(z.y-n.y)/d2*10;count++;}},24);const desired={x:z.x+dx/d*24+sx,y:z.y+dy/d*24+sy};z.angle=Math.atan2(dy,dx);this.move(z,desired,dt);
 // Attack the defense directly ahead instead of trying to pass through it.
 const obstacle=this.nav.owner(z.x+dx/d*(z.r+5),z.y+dy/d*(z.r+5));if(obstacle&&obstacle.kind!=='house'&&obstacle.kind!=='warehouse'&&z.cooldown<=0){obstacle.hp-=12;z.cooldown=.7;if(obstacle.hp<=0){dirty=true;this.log(`${obstacle.kind==='hq'?'QG':'Défense'} détruit.`);}}
 }
 this.zgrid.rebuild(this.zombies);
 const depots=this.buildings.filter(b=>['depot','hq'].includes(b.kind)&&b.hp>0);
 for(const u of this.units){if(u.hp<=0)continue;u.cooldown=Math.max(0,u.cooldown-dt);if(u.infection>0){u.infection-=dt;if(u.infection<=0){u.hp=0;this.spawn('zombie',1,u.x,u.y,1);this.infected++;continue;}}
 const depot=depots.find(b=>dist2(u,{x:b.x+b.w/2,y:b.y+b.h/2})<270**2);if(depot){u.reserve=Math.min(TROOPS[u.kind].reserve||0,u.reserve+dt*25);u.infection=0;u.hp=Math.min(u.maxHp,u.hp+dt*2);}
 if(u.kind==='civilian'){if(dist2(u,{x:4096,y:4096})<330**2){u.hp=0;this.rescued++;this.supplies+=20;continue;}if(!u.path.length||u.think<=0){u.path=this.nav.path(u.x,u.y,4096,4380);u.think=5;}u.think-=dt;if(u.path.length&&this.move(u,u.path[0],dt))u.path.shift();continue;}
 u.think-=dt;if(u.think<=0){u.think=.15+this.rng()*.1;u.target=u.kind==='artillery'?clusterTarget(this.zgrid,u.x,u.y,u.range,HEAVY.artillery.minRange):this.zgrid.nearest(u.x,u.y,u.range,z=>this.nav.line(u.x,u.y,z.x,z.y));}
 const target=u.bombard&&u.kind==='artillery'?u.bombard:u.target&&u.target.hp>0&&dist2(u,u.target)<u.range**2?u.target:null;
 const moving=u.path.length&&!(u.stance==='attack'&&target);if(moving){if(this.move(u,u.path[0],dt))u.path.shift();}
 if(u.reload>0){u.reload-=dt;if(u.reload<=0){const load=Math.min(u.mag,Math.floor(u.reserve));u.ammo=load;u.reserve-=load;}}
 else if(u.ammo===0&&u.reserve>=1)u.reload=HEAVY[u.kind]?.reload||2;
 if(target){u.angle=Math.atan2(target.y-u.y,target.x-u.x);if(u.cooldown<=0&&u.ammo>0&&u.reload<=0&&!(u.kind==='artillery'&&moving)&&(HEAVY[u.kind]?.indirect||this.nav.line(u.x,u.y,target.x,target.y))){this.fire(u,target,u.kind);u.ammo--;}}
 }
 for(const b of this.buildings){
  const heavy=HEAVY[b.kind];
  if((b.kind!=='tower'&&!heavy)||b.hp<=0)continue;
  b.cooldown=Math.max(0,b.cooldown-dt);
  const x=b.x+b.w/2,y=b.y+b.h/2;
  const depot=depots.some(d=>dist2({x,y},{x:d.x+d.w/2,y:d.y+d.h/2})<700**2);
  const capacity=heavy?.capacity||600;
  if(depot)b.ammo=Math.min(capacity,b.ammo+dt*(heavy?.supply||10));
  if(b.cooldown>0||b.ammo<1)continue;
  b.think=(b.think||0)-dt;if(b.think>0)continue;b.think=.65;
  const muzzle=z=>{const a=Math.atan2(z.y-y,z.x-x),reach=(b.w/2+8)/Math.max(Math.abs(Math.cos(a)),Math.abs(Math.sin(a)));return {x:x+Math.cos(a)*reach,y:y+Math.sin(a)*reach};};
  const visible=z=>{const p=muzzle(z);return this.nav.line(p.x,p.y,z.x,z.y);};
  const target=heavy?clusterTarget(this.zgrid,x,y,heavy.range,heavy.minRange||0,heavy.indirect?()=>true:visible):this.zgrid.nearest(x,y,400,visible);
  if(!target)continue;
  const p=heavy?.indirect?{x,y}:muzzle(target),shooter={...p,damage:32};
  this.fire(shooter,target,b.kind);b.angle=shooter.angle;b.cooldown=heavy?.interval||.18;b.think=0;b.ammo--;
 }
 for(const shell of this.shells){
  shell.elapsed+=dt;
  if(shell.elapsed>=shell.flight){this.explode(shell.tx,shell.ty,shell.kind);shell.done=true;}
 }
 this.shells=this.shells.filter(s=>!s.done);
 for(const b of this.bullets){const ax=b.x,ay=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;let first=null,firstT=Infinity;const len=Math.hypot(b.x-ax,b.y-ay);this.zgrid.query((ax+b.x)/2,(ay+b.y)/2,len/2+8,z=>{if(segmentDistance(z.x,z.y,ax,ay,b.x,b.y)<(z.r+2)**2){const t=((z.x-ax)*b.vx+(z.y-ay)*b.vy)/(b.vx*b.vx+b.vy*b.vy);if(t<firstT){firstT=t;first=z;}}});let hit=null;for(let i=1,n=Math.ceil(len/8);i<=n;i++){const x=ax+(b.x-ax)*i/n,y=ay+(b.y-ay)*i/n;if(this.nav.blocked(x,y,0)){hit={x,y};break;}if(first&&Math.hypot(x-first.x,y-first.y)<12){hit={x:first.x,y:first.y,z:first};break;}}
 if(hit){b.life=0;if(b.splash){this.explode(hit.x,hit.y,HEAVY[b.kind]||{radius:b.splash,damage:b.damage,impulse:130});}else if(hit.z)this.damageZombie(hit.z,b.damage);}

 }
 // Dead infected humans turn immediately; civilians and soldiers share the epidemic.
 for(const u of this.units)if(u.hp<=0&&u.infection>0){this.spawn('zombie',1,u.x,u.y,2);this.infected++;u.infection=0;}
 this.units=this.units.filter(u=>u.hp>0);this.zombies=this.zombies.filter(z=>z.hp>0);this.bullets=this.bullets.filter(b=>b.life>0);for(const e of this.effects)e.life-=dt;this.effects=this.effects.filter(e=>e.life>0).slice(-300);for(const n of this.noises)n.life-=dt;this.noises=this.noises.filter(n=>n.life>0);if(dirty)this.nav.rebuild(this.buildings);
 if(this.mode==='defense'){if(hq.hp<=0){this.status='lost';this.log('Le QG est tombé.');}else if(this.time>=300){this.status='won';this.log('Évacuation terminée. Secteur tenu !');}}
 }
 snapshot(){return {version:2,marks:this.marks.snapshot(),shells:this.shells,blastKills:this.blastKills,bestBlast:this.bestBlast,seed:this.seed,rng:this.rng.state(),mode:this.mode,time:this.time,kills:this.kills,infected:this.infected,rescued:this.rescued,supplies:this.supplies,nextId:this.nextId,wave:this.wave,nextWave:this.nextWave,status:this.status,income:this.income,units:this.units.map(({target,...u})=>({...u,targetId:target?.hp>0?target.id:null})),zombies:this.zombies.map(({target,...z})=>({...z,targetId:target?.hp>0?target.id:null})),buildings:this.buildings,bullets:this.bullets,noises:this.noises};}
 static load(data){validateSave(data);const s=new Simulation({seed:data.seed,mode:data.mode,zombies:0});for(const key of ['time','kills','infected','rescued','supplies','nextId','wave','nextWave','status','income','units','zombies','buildings','bullets','noises'])s[key]=structuredClone(data[key]);const targets=new Map([...s.units,...s.zombies].map(e=>[e.id,e]));for(const e of [...s.units,...s.zombies]){e.target=targets.get(e.targetId)||null;delete e.targetId;}s.shells=structuredClone(data.shells||[]);s.marks.restore(data.marks);s.blastKills=data.blastKills||0;s.bestBlast=data.bestBlast||0;s.rng.restore(data.rng);s.nav.rebuild(s.buildings);s.log('Sauvegarde restaurée.');return s;}
}
export function validateSave(d){const fail=()=>{throw Error('Sauvegarde invalide ou incompatible.');};if(!d||![1,2].includes(d.version)||!['defense','sandbox'].includes(d.mode)||!['playing','won','lost'].includes(d.status))fail();for(const k of ['seed','rng','time','kills','infected','rescued','supplies','nextId','wave','nextWave','income'])if(!Number.isFinite(d[k])||d[k]<0)fail();const ids=new Set();for(const [name,max] of [['units',600],['zombies',20000],['buildings',3000]]){if(!Array.isArray(d[name])||d[name].length>max)fail();for(const e of d[name]){if(!e||!Number.isInteger(e.id)||ids.has(e.id)||e.id>=d.nextId)fail();ids.add(e.id);for(const k of ['x','y','hp','maxHp'])if(!Number.isFinite(e[k]))fail();if(e.x<0||e.y<0||e.x>SIZE||e.y>SIZE||e.hp>e.maxHp||e.maxHp<=0)fail();if(name==='buildings'){if(!['hq','house','warehouse',...Object.keys(BUILD)].includes(e.kind)||![64,128,192].includes(e.w)||![64,128,192].includes(e.h)||e.x%64||e.y%64||e.x+e.w>SIZE||e.y+e.h>SIZE)fail();}else{for(const k of ['r','speed','angle','cooldown','think'])if(!Number.isFinite(e[k]))fail();if(e.r<1||e.r>30||e.speed<0||e.speed>200)fail();if(name==='units'){if(!TROOPS[e.kind]||!Array.isArray(e.path)||e.path.length>17000)fail();for(const p of e.path)if(!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.y<0||p.x>SIZE||p.y>SIZE)fail();for(const k of ['ammo','reserve','reload','infection','body'])if(!Number.isFinite(e[k])||e[k]<0&&k!=='body')fail();}}}}
 if(d.buildings.filter(b=>b.kind==='hq').length!==1)fail();
 for(const [name,keys,max] of [['bullets',['x','y','vx','vy','life','damage','splash'],20000],['noises',['x','y','life'],32]]){if(!Array.isArray(d[name])||d[name].length>max)fail();for(const item of d[name])for(const key of keys)if(!Number.isFinite(item[key]))fail();}
 for(const b of d.buildings)if(!['house','warehouse'].includes(b.kind)){for(const key of ['cooldown','ammo'])if(b[key]!==undefined&&!Number.isFinite(b[key]))fail();if(['tower','cannon','mortar'].includes(b.kind)&&(!Number.isFinite(b.ammo)||!Number.isFinite(b.cooldown)))fail();}
 for(const u of d.units){for(const key of u.kind==='civilian'?[]:['range','damage','fire','mag'])if(!Number.isFinite(u[key])||u[key]<0)fail();if(!['move','attack','guard'].includes(u.stance))fail();}
 for(const e of [...d.units,...d.zombies])if(e.targetId!==null&&e.targetId!==undefined&&!Number.isInteger(e.targetId))fail();
 if(d.version===2){
 if(!Array.isArray(d.shells)||d.shells.length>4096||!d.marks||!Array.isArray(d.marks.blood)||d.marks.blood.length>4096||!Array.isArray(d.marks.craters)||d.marks.craters.length>192)fail();
 for(const key of ['blastKills','bestBlast'])if(!Number.isFinite(d[key])||d[key]<0)fail();
 for(const shell of d.shells){for(const key of ['x','y','tx','ty','elapsed','flight'])if(!Number.isFinite(shell[key]))fail();if(!HEAVY[shell.kind]?.indirect||shell.flight<.1||shell.flight>3||shell.elapsed<0||shell.elapsed>shell.flight)fail();for(const key of ['x','y','tx','ty'])if(shell[key]<0||shell[key]>SIZE)fail();}
 for(const mark of d.marks.blood){for(const key of ['key','x','y','count'])if(!Number.isFinite(mark[key]))fail();if(mark.count<1||mark.count>30||mark.x<0||mark.y<0||mark.x>SIZE||mark.y>SIZE)fail();}
 for(const mark of d.marks.craters){for(const key of ['x','y','r'])if(!Number.isFinite(mark[key]))fail();if(mark.r<1||mark.r>65)fail();}
 }
 for(const u of d.units)if(u.kind!=='civilian'&&(u.range>2000||u.damage>10000||u.fire<.03||u.fire>60||u.mag>1000||u.ammo>1000||u.reserve>10000))fail();
 for(const b of d.bullets)if(Math.abs(b.vx)>2000||Math.abs(b.vy)>2000||b.life<0||b.life>3||b.damage<0||b.damage>10000||b.splash<0||b.splash>256)fail();
 for(const u of d.units)if(u.bombard&&(!Number.isFinite(u.bombard.x)||!Number.isFinite(u.bombard.y)||u.bombard.x<0||u.bombard.y<0||u.bombard.x>SIZE||u.bombard.y>SIZE))fail();
 for(const z of d.zombies)for(const key of ['pushX','pushY'])if(z[key]!==undefined&&(!Number.isFinite(z[key])||Math.abs(z[key])>10000))fail();
 return true;}
