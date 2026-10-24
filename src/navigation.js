import {SIZE,TILE,COLS,clamp} from './core.js';
export class Navigation{
 constructor(){this.solid=new Uint8Array(COLS*COLS);this.hard=new Uint8Array(COLS*COLS);this.owners=new Array(COLS*COLS);this.flow=new Int32Array(COLS*COLS);}
 index(x,y){return clamp(Math.floor(x/TILE),0,COLS-1)+clamp(Math.floor(y/TILE),0,COLS-1)*COLS;}
 rebuild(buildings){this.solid.fill(0);this.hard.fill(0);this.owners.fill(null);for(const b of buildings)if(b.hp>0){for(let y=b.y/TILE;y<(b.y+b.h)/TILE;y++)for(let x=b.x/TILE;x<(b.x+b.w)/TILE;x++){const i=x+y*COLS;this.solid[i]=1;this.hard[i]=b.kind==='house'||b.kind==='warehouse'?1:0;this.owners[i]=b;}}this.makeFlow(SIZE/2,SIZE/2);}
 blocked(x,y,r=0){if(x<r||y<r||x>SIZE-r||y>SIZE-r)return true;for(const dx of [-r,r])for(const dy of [-r,r])if(this.solid[this.index(x+dx,y+dy)])return true;return false;}
 owner(x,y){return this.owners[this.index(x,y)];}
 line(ax,ay,bx,by){const n=Math.ceil(Math.hypot(bx-ax,by-ay)/16);for(let k=1;k<=n;k++)if(this.blocked(ax+(bx-ax)*k/n,ay+(by-ay)*k/n))return false;return true;}
 // Shared BFS toward HQ. Destructible defenses remain traversable in this field:
 // zombies reach and attack them, while permanent city buildings are routed around.
 makeFlow(x,y){this.flow.fill(-1);const start=this.index(x,y),queue=new Int32Array(COLS*COLS);let head=0,tail=1;queue[0]=start;this.flow[start]=0;while(head<tail){const i=queue[head++],cx=i%COLS;for(const n of [cx>0?i-1:-1,cx<COLS-1?i+1:-1,i-COLS,i+COLS])if(n>=0&&n<this.flow.length&&!this.hard[n]&&this.flow[n]<0){this.flow[n]=this.flow[i]+1;queue[tail++]=n;}}}
 flowGoal(x,y){const i=this.index(x,y);let best=i;for(const n of [i%COLS>0?i-1:-1,i%COLS<COLS-1?i+1:-1,i-COLS,i+COLS])if(n>=0&&n<this.flow.length&&this.flow[n]>=0&&(this.flow[best]<0||this.flow[n]<this.flow[best]))best=n;return {x:(best%COLS+.5)*TILE,y:(Math.floor(best/COLS)+.5)*TILE};}
 // A* for commanded units; binary heap keeps long-map orders practical.
 path(ax,ay,bx,by){let goal=this.index(bx,by),start=this.index(ax,ay);if(this.solid[goal]){let found=false;for(let r=1;r<10&&!found;r++)for(let y=-r;y<=r&&!found;y++)for(let x=-r;x<=r;x++){const nx=Math.floor(bx/TILE)+x,ny=Math.floor(by/TILE)+y;if(nx>=0&&ny>=0&&nx<COLS&&ny<COLS&&!this.solid[nx+ny*COLS]){goal=nx+ny*COLS;found=true;break;}}if(!found)return [];}
 const g=new Float64Array(COLS*COLS).fill(Infinity),parent=new Int32Array(g.length).fill(-1),closed=new Uint8Array(g.length),heap=[];
 const heuristic=i=>Math.abs(i%COLS-goal%COLS)+Math.abs(Math.floor(i/COLS)-Math.floor(goal/COLS));
 const push=(i,f)=>{let k=heap.length;heap.push({i,f});while(k){let p=(k-1)>>1;if(heap[p].f<=f)break;heap[k]=heap[p];k=p;}heap[k]={i,f};};
 const pop=()=>{const first=heap[0],last=heap.pop();if(heap.length){let k=0;while(2*k+1<heap.length){let c=2*k+1;if(c+1<heap.length&&heap[c+1].f<heap[c].f)c++;if(heap[c].f>=last.f)break;heap[k]=heap[c];k=c;}heap[k]=last;}return first.i;};
 g[start]=0;push(start,heuristic(start));while(heap.length){const i=pop();if(closed[i])continue;if(i===goal){const route=[];for(let n=i;n!==start;n=parent[n])route.push({x:(n%COLS+.5)*TILE,y:(Math.floor(n/COLS)+.5)*TILE});route.reverse();if(!this.blocked(bx,by,20))route.push({x:bx,y:by});return route;}
 closed[i]=1;for(const n of [i%COLS>0?i-1:-1,i%COLS<COLS-1?i+1:-1,i-COLS,i+COLS])if(n>=0&&n<g.length&&!this.solid[n]&&!closed[n]&&g[i]+1<g[n]){g[n]=g[i]+1;parent[n]=i;push(n,g[n]+heuristic(n));}}
 return [];}
}
