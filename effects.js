// Canvas-only effects. No assets, no extra game RNG calls, bounded ground marks.
export function drawGround(ctx,sim,visible,options){
  for(const p of sim.marks.craters){if(!visible(p.x,p.y,p.r))continue;ctx.fillStyle='#1e211dc0';ctx.beginPath();ctx.ellipse(p.x,p.y,p.r,p.r*.65,.3,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#a6a59245';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='#11171480';ctx.beginPath();ctx.ellipse(p.x+2,p.y,p.r*.65,p.r*.4,.3,0,Math.PI*2);ctx.fill();}
  if(!options.blood)return;
  for(const p of sim.marks.blood.values()){
    if(!visible(p.x,p.y,45))continue;
    const size=7+Math.sqrt(p.count)*4,angle=(p.key%37)*.17;
    ctx.fillStyle=p.count>4?'#661d24bb':'#84262ba8';ctx.beginPath();ctx.ellipse(p.x,p.y,size,size*.62,angle,0,Math.PI*2);ctx.fill();
    if(!options.reduced){ctx.fillStyle='#9e3035a0';for(let i=0;i<4;i++){const a=angle+i*2.23,r=size*(.7+i*.28);ctx.beginPath();ctx.arc(p.x+Math.cos(a)*r,p.y+Math.sin(a)*r,1.5+(p.key+i)%3,0,Math.PI*2);ctx.fill();}}
  }
}
export function drawImpacts(ctx,sim,visible,options){
  for(const e of sim.effects){
    if(!visible(e.x,e.y,e.r+100))continue;
    const t=1-e.life/e.max;
    if(e.type==='explosion'){
      // Expanding pressure ring, brief hot core, ejecta, then lingering smoke.
      const shock=Math.min(1,t*3.4),alpha=Math.max(0,1-t*2.5);
      ctx.globalAlpha=alpha;ctx.strokeStyle='#ead5aa';ctx.lineWidth=5*(1-shock)+1;ctx.beginPath();ctx.arc(e.x,e.y,Math.max(2,e.r*shock),0,Math.PI*2);ctx.stroke();
      if(t<.23&&!options.reduced){const r=e.r*(.12+t*1.9);const glow=ctx.createRadialGradient(e.x,e.y,0,e.x,e.y,r);glow.addColorStop(0,'#fff2bf');glow.addColorStop(.3,'#ffce70');glow.addColorStop(.72,'#d76f38');glow.addColorStop(1,'#a2482200');ctx.globalAlpha=1-t/.23;ctx.fillStyle=glow;ctx.fillRect(e.x-r,e.y-r,r*2,r*2);}
      if(!options.reduced){ctx.globalAlpha=Math.max(0,1-t*1.6);for(let i=0;i<14;i++){const a=i*2.399+(e.seed%10)*.1,d=e.r*(.2+(i%5)*.12)*Math.min(1,t*3);ctx.fillStyle=i%3?'#c19a63':'#ece3b7';ctx.fillRect(e.x+Math.cos(a)*d,e.y+Math.sin(a)*d-t*18,3,3);}}
      const count=options.reduced?3:7;
      for(let i=0;i<count;i++){const a=i*2.399,drift=e.r*.25*t;ctx.globalAlpha=(1-t)*.16;ctx.fillStyle=i%2?'#242923':'#9c9d88';ctx.beginPath();ctx.arc(e.x+Math.cos(a)*drift,e.y+Math.sin(a)*drift-t*55,e.r*(.12+t*.22),0,Math.PI*2);ctx.fill();}
      if(e.killed>=8){ctx.globalAlpha=Math.min(1,(1-t)*2);ctx.font='bold 13px monospace';ctx.textAlign='center';ctx.fillStyle='#f3deae';ctx.fillText(`−${e.killed}`,e.x,e.y-e.r*.35-t*45);ctx.textAlign='start';}
    }else if(e.type==='blood'&&options.blood&&!options.reduced){ctx.globalAlpha=(1-t)*.8;ctx.fillStyle='#ac3137';for(let i=0;i<5;i++){const a=i*2.4+e.seed,d=e.r*t*(1+i*.2);ctx.beginPath();ctx.arc(e.x+Math.cos(a)*d,e.y+Math.sin(a)*d,2*(1-t)+.5,0,Math.PI*2);ctx.fill();}}
    else if(e.type==='muzzle'&&!options.reduced){ctx.globalAlpha=1-t;ctx.fillStyle='#f6d995';ctx.beginPath();ctx.arc(e.x,e.y,e.r*(1-t),0,Math.PI*2);ctx.fill();}
  }
  ctx.globalAlpha=1;
  for(const shell of sim.shells){
    const t=Math.min(1,shell.elapsed/shell.flight),height=Math.min(150,Math.hypot(shell.tx-shell.x,shell.ty-shell.y)*.2);
    const x=shell.x+(shell.tx-shell.x)*t,y=shell.y+(shell.ty-shell.y)*t,h=Math.sin(t*Math.PI)*height;
    if(!visible(x,y,h+30))continue;
    ctx.globalAlpha=.3;ctx.fillStyle='#121c16';ctx.beginPath();ctx.ellipse(x,y,6,3,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    ctx.strokeStyle='#f2ca8290';ctx.lineWidth=2;ctx.beginPath();for(let i=5;i>=0;i--){const q=Math.max(0,t-i*.013),px=shell.x+(shell.tx-shell.x)*q,py=shell.y+(shell.ty-shell.y)*q-Math.sin(q*Math.PI)*height;if(i===5)ctx.moveTo(px,py);else ctx.lineTo(px,py);}ctx.stroke();
    ctx.fillStyle='#ffedbb';ctx.beginPath();ctx.arc(x,y-h,4,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#d9a86280';ctx.lineWidth=1;ctx.beginPath();ctx.arc(shell.tx,shell.ty,8+8*(1-t),0,Math.PI*2);ctx.stroke();
  }
}
