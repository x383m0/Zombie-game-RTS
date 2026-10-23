import {clamp,dist2} from './core.js';

// Heavy weapons share ammunition, targeting and impact rules.
export const HEAVY = {
  tank: {radius:92, damage:155, impulse:130, flight:0, reload:3},
  cannon: {radius:112, damage:165, impulse:170, range:720, interval:2.6, capacity:60, supply:1.5},
  mortar: {radius:160, damage:220, impulse:240, range:1250, minRange:160, interval:5.5, capacity:30, supply:.45, indirect:true},
  artillery: {radius:185, damage:260, impulse:300, minRange:180, indirect:true, reload:3.5}
};

// Choose a real enemy near the center of a dense cell. This scans occupied
// spatial buckets rather than comparing every enemy with every other enemy.
export function clusterTarget(grid,x,y,range,minRange=0,visible=()=>true){
  let best=null,score=-1;
  for(const bucket of grid.buckets.values()){
    if(!bucket.length||bucket.length<score)continue;
    const first=bucket.find(z=>z.hp>0);
    if(!first||dist2(first,{x,y})>(range+140)**2)continue;
    let cx=0,cy=0,n=0;
    for(let i=0;i<Math.min(bucket.length,16);i++)if(bucket[i].hp>0){cx+=bucket[i].x;cy+=bucket[i].y;n++;}
    if(!n)continue;
    cx/=n;cy/=n;
    let candidate=null,nearest=Infinity;
    for(let i=0;i<Math.min(bucket.length,16);i++){
      const z=bucket[i],d=dist2(z,{x,y}),center=dist2(z,{x:cx,y:cy});
      if(z.hp>0&&d<=range*range&&d>=minRange*minRange&&center<nearest&&visible(z)){candidate=z;nearest=center;}
    }
    if(candidate&&bucket.length>score){best=candidate;score=bucket.length;}
  }
  return best;
}

// Bounded ground decals; a massacre adds density to a cell rather than
// retaining thousands of individual corpses and permanent particle objects.
export class GroundMarks{
  constructor(){this.blood=new Map();this.craters=[];}
  stain(x,y){
    const key=Math.floor(x/32)+Math.floor(y/32)*256,old=this.blood.get(key);
    if(old){old.x=(old.x*old.count+x)/(old.count+1);old.y=(old.y*old.count+y)/(old.count+1);old.count=Math.min(30,old.count+1);}
    else this.blood.set(key,{key,x,y,count:1});
    if(this.blood.size>4096)this.blood.delete(this.blood.keys().next().value);
  }
  crater(x,y,r){this.craters.push({x,y,r:clamp(r*.34,12,65)});if(this.craters.length>192)this.craters.shift();}
  snapshot(){return {blood:[...this.blood.values()].map(v=>({...v})),craters:this.craters.map(v=>({...v}))};}
  restore(data){this.blood=new Map((data?.blood||[]).map(v=>[v.key,{...v}]));this.craters=(data?.craters||[]).map(v=>({...v}));}
}
