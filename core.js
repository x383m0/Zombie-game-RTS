export const SIZE=8192, TILE=64, COLS=SIZE/TILE, STEP=1/30;
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const dist2=(a,b)=>(a.x-b.x)**2+(a.y-b.y)**2;
export function random(seed=1){let s=seed>>>0;const fn=()=>{s=(Math.imul(1664525,s)+1013904223)>>>0;return s/4294967296};fn.state=()=>s;fn.restore=n=>s=n>>>0;return fn;}
export function segmentDistance(x,y,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,t=clamp(((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1),0,1);return (x-ax-t*dx)**2+(y-ay-t*dy)**2;}
// Numeric keys, bounded neighborhood searches, no full-population scans per zombie.
export class SpatialHash{
 constructor(cell=96){this.cell=cell;this.buckets=new Map();}
 key(x,y){return Math.floor(x/this.cell)+Math.floor(y/this.cell)*1024;}
 rebuild(items){this.buckets.clear();for(const e of items)if(e.hp>0){const k=this.key(e.x,e.y);let b=this.buckets.get(k);if(!b)this.buckets.set(k,b=[]);b.push(e);}}
 query(x,y,r,fn,limit=Infinity){const c=this.cell;let scanned=0;for(let j=Math.floor((y-r)/c);j<=Math.floor((y+r)/c);j++)for(let i=Math.floor((x-r)/c);i<=Math.floor((x+r)/c);i++){const b=this.buckets.get(i+j*1024);if(b)for(const e of b)if(e.hp>0){fn(e);if(++scanned>=limit)return;}}}
 nearest(x,y,r,predicate=()=>true){let best=null,d=r*r;this.query(x,y,r,e=>{const v=(e.x-x)**2+(e.y-y)**2;if(v<d&&predicate(e)){d=v;best=e;}});return best;}
}
