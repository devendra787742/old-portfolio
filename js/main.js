// ═══════════════════════════════════════
//  CURSOR
// ═══════════════════════════════════════
const cur=document.getElementById('cur'), ring=document.getElementById('cur-ring');
let mx=0,my=0,rx=0,ry=0;
document.addEventListener('mousemove',e=>{ mx=e.clientX;my=e.clientY; cur.style.left=mx-6+'px';cur.style.top=my-6+'px'; });
(function L(){ rx+=(mx-rx)*.12;ry+=(my-ry)*.12; ring.style.left=rx-17+'px';ring.style.top=ry-17+'px'; requestAnimationFrame(L); })();
document.querySelectorAll('a,button,.skill-card,.project-card,.cert-card,.stat-card,.lang-card').forEach(el=>{
  el.addEventListener('mouseenter',()=>{ cur.style.transform='scale(2)'; ring.style.transform='scale(1.5)'; ring.style.borderColor='#ffe66d'; });
  el.addEventListener('mouseleave',()=>{ cur.style.transform='scale(1)'; ring.style.transform='scale(1)'; ring.style.borderColor=''; });
});

// ═══════════════════════════════════════
//  BACKGROUND — 2D GAME WORLD
// ═══════════════════════════════════════
const bgC=document.getElementById('bg-canvas'), bgX=bgC.getContext('2d');
let W,H;
function rsz(){ W=bgC.width=window.innerWidth; H=bgC.height=window.innerHeight; }
rsz(); window.addEventListener('resize',rsz);

let mxr=.5,myr=.5;
document.addEventListener('mousemove',e=>{ mxr=e.clientX/window.innerWidth; myr=e.clientY/window.innerHeight; });

const stars=Array.from({length:150},()=>({
  x:Math.random(),y:Math.random()*.75,
  s:Math.ceil(Math.random()*2)*2,
  spd:Math.random()*.00016+.00004,
  col:['#00f0ff','#7b2fff','#ffe66d','#ffffff','#39ff8f'][Math.floor(Math.random()*5)],
  a:Math.random()*.55+.2, tw:Math.random()*Math.PI*2,
}));

const mtnLayers=[
  {col:'rgba(7,16,38,1)',  oy:.78,amp:.17,fr:.0022,px:.9},
  {col:'rgba(5,26,16,1)',  oy:.84,amp:.10,fr:.0038,px:.55},
  {col:'rgba(3,14,8,1)',   oy:.895,amp:.055,fr:.007,px:.3},
];

const clouds=Array.from({length:8},()=>({
  x:Math.random(),y:.06+Math.random()*.24,
  w:60+Math.random()*140,h:16+Math.random()*24,
  spd:.00005+Math.random()*.00009, a:.05+Math.random()*.07,
}));

const blds=[
  {x:.03,w:.032,h:.09},{x:.08,w:.02,h:.14},{x:.12,w:.026,h:.07},
  {x:.17,w:.038,h:.11},{x:.23,w:.02,h:.16},{x:.27,w:.034,h:.08},
  {x:.51,w:.032,h:.09},{x:.57,w:.02,h:.15},{x:.61,w:.042,h:.07},
  {x:.69,w:.02,h:.13},{x:.74,w:.034,h:.10},{x:.81,w:.026,h:.14},
  {x:.87,w:.032,h:.09},{x:.93,w:.02,h:.07},
];

const TILE=32, TILEY=16;
let scrollX=0, t=0;

function drawBg(){
  t+=.007; scrollX+=.28;
  bgX.clearRect(0,0,W,H);

  // Sky
  const sg=bgX.createLinearGradient(0,0,0,H);
  sg.addColorStop(0,'#020508'); sg.addColorStop(.5,'#050a12'); sg.addColorStop(.72,'#060f18'); sg.addColorStop(1,'#040d06');
  bgX.fillStyle=sg; bgX.fillRect(0,0,W,H);

  // Subtle grid
  bgX.strokeStyle='rgba(0,240,255,.022)'; bgX.lineWidth=1;
  for(let x=0;x<W;x+=60){ bgX.beginPath();bgX.moveTo(x,0);bgX.lineTo(x,H);bgX.stroke(); }
  for(let y=0;y<H;y+=60){ bgX.beginPath();bgX.moveTo(0,y);bgX.lineTo(W,y);bgX.stroke(); }

  // Stars
  stars.forEach(s=>{
    s.y-=s.spd; if(s.y<0){s.y=.75;s.x=Math.random();}
    s.tw+=.022;
    bgX.globalAlpha=s.a*(.65+.35*Math.sin(s.tw));
    bgX.fillStyle=s.col;
    bgX.fillRect(Math.round((s.x+(mxr-.5)*.016)%1*W), Math.round(s.y*H*.75), s.s, s.s);
  });
  bgX.globalAlpha=1;

  // Moon
  const moonX=W*.8+(mxr-.5)*(-32), moonY=H*.09+(myr-.5)*(-18);
  bgX.globalAlpha=.06; bgX.fillStyle='#c8e8ff'; bgX.beginPath(); bgX.arc(moonX,moonY,52,0,Math.PI*2); bgX.fill();
  bgX.globalAlpha=.12; bgX.beginPath(); bgX.arc(moonX,moonY,36,0,Math.PI*2); bgX.fill();
  bgX.globalAlpha=.22; bgX.beginPath(); bgX.arc(moonX,moonY,22,0,Math.PI*2); bgX.fill();
  bgX.globalAlpha=1;
  [[7,-9],[15,4],[-5,11],[-11,-3]].forEach(([dx,dy])=>{
    bgX.fillStyle='rgba(100,160,200,.1)'; bgX.fillRect(moonX+dx-3,moonY+dy-3,6,6);
  });

  // Pixel clouds
  clouds.forEach(c=>{
    c.x+=c.spd; if(c.x>1.25) c.x=-.25;
    bgX.fillStyle=`rgba(140,190,255,${c.a})`;
    const cx=(c.x+(mxr-.5)*.055)%1.5*W, cy=c.y*H;
    for(let bx=0;bx<c.w;bx+=8) for(let by=0;by<c.h;by+=8)
      if(Math.hypot(bx-c.w/2,by-c.h/2)<c.w*.44) bgX.fillRect(cx+bx,cy+by,8,8);
  });

  // Mountain layers (parallax)
  const groundY=H*.89;
  mtnLayers.forEach((m,i)=>{
    const ox=(mxr-.5)*55*m.px;
    bgX.beginPath(); bgX.moveTo(-10+ox,H);
    for(let x=-10;x<=W+10;x+=3){
      const nx=x+scrollX*m.px*.22;
      const y=m.oy*H
        -Math.abs(Math.sin(nx*m.fr+i*1.4))*m.amp*H
        -Math.abs(Math.sin(nx*m.fr*1.9+2.3))*m.amp*.4*H;
      bgX.lineTo(x+ox,y);
    }
    bgX.lineTo(W+10+ox,H); bgX.closePath(); bgX.fillStyle=m.col; bgX.fill();
  });

  // City buildings + animated windows
  const cOx=(mxr-.5)*25;
  blds.forEach((b,bi)=>{
    const bx=b.x*W+cOx, bw=Math.round(b.w*W/8)*8, bh=Math.round(b.h*H/8)*8, by=groundY-bh;
    bgX.fillStyle='rgba(2,7,4,.98)'; bgX.fillRect(bx,by,bw,bh);
    for(let wy=by+8;wy<groundY-8;wy+=12){
      for(let wx=bx+4;wx<bx+bw-4;wx+=9){
        const lit=Math.sin(bi*17.3+wx*.31+wy*.47+t*1.8)>.5;
        bgX.fillStyle=lit?`rgba(255,225,100,${.12+.22*Math.abs(Math.sin(t*.6+wx))})`:'rgba(2,7,4,.98)';
        bgX.fillRect(wx,wy,4,6);
      }
    }
  });

  // Ground tiles
  const tOx=(mxr-.5)*28;
  const st=Math.floor((-scrollX+tOx)/TILE)-1, en=st+Math.ceil(W/TILE)+4;
  for(let i=st;i<en;i++){
    const tx=i*TILE+(scrollX%TILE)+tOx;
    bgX.fillStyle='rgba(57,255,143,.52)'; bgX.fillRect(tx,groundY,TILE-1,4);
    bgX.fillStyle='rgba(14,48,20,.96)';   bgX.fillRect(tx,groundY+4,TILE-1,TILEY-4);
    bgX.fillStyle='rgba(8,28,12,.92)';    bgX.fillRect(tx,groundY+TILEY,TILE-1,TILEY);
  }

  // Ground glow
  const gg=bgX.createLinearGradient(0,groundY-14,0,groundY+55);
  gg.addColorStop(0,'rgba(57,255,143,.16)'); gg.addColorStop(1,'rgba(57,255,143,0)');
  bgX.fillStyle=gg; bgX.fillRect(0,groundY-14,W,70);

  requestAnimationFrame(drawBg);
}
drawBg();

// ═══════════════════════════════════════
//  FX CANVAS — PARTICLES
// ═══════════════════════════════════════
const fxC=document.getElementById('fx-canvas'), fxX=fxC.getContext('2d');
fxC.width=window.innerWidth; fxC.height=window.innerHeight;
window.addEventListener('resize',()=>{ fxC.width=window.innerWidth; fxC.height=window.innerHeight; });

const pts=[];
let lpx=0,lpy=0;
document.addEventListener('mousemove',e=>{
  if(Math.hypot(e.clientX-lpx,e.clientY-lpy)<8) return;
  lpx=e.clientX; lpy=e.clientY;
  if(Math.random()>.42) return;
  pts.push({ x:e.clientX,y:e.clientY,
    vx:(Math.random()-.5)*2.4, vy:(Math.random()-.5)*2.4-1,
    s:Math.ceil(Math.random()*2+1)*2, life:1, dec:.026+Math.random()*.022,
    col:['#00f0ff','#7b2fff','#39ff8f','#ffe66d'][Math.floor(Math.random()*4)] });
});
document.addEventListener('click',e=>{
  for(let i=0;i<14;i++){
    const a=(i/14)*Math.PI*2,sp=2.5+Math.random()*3.5;
    pts.push({ x:e.clientX,y:e.clientY, vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,
      s:4, life:1, dec:.017, col:['#00f0ff','#39ff8f','#ffe66d','#7b2fff'][i%4] });
  }
});

(function drawFX(){
  fxX.clearRect(0,0,fxC.width,fxC.height);
  for(let i=pts.length-1;i>=0;i--){
    const p=pts[i];
    p.x+=p.vx; p.y+=p.vy; p.vy+=.065; p.life-=p.dec;
    if(p.life<=0){pts.splice(i,1);continue;}
    fxX.globalAlpha=p.life*p.life; fxX.fillStyle=p.col;
    fxX.fillRect(Math.round(p.x),Math.round(p.y),p.s,p.s);
  }
  fxX.globalAlpha=1;
  requestAnimationFrame(drawFX);
})();

// ═══════════════════════════════════════
//  HERO PARALLAX
// ═══════════════════════════════════════
const heroEl=document.getElementById('hero');
document.addEventListener('mousemove',e=>{
  const dx=(e.clientX/window.innerWidth-.5)*22;
  const dy=(e.clientY/window.innerHeight-.5)*11;
  heroEl.style.transform=`translate(${dx*.32}px,${dy*.22}px)`;
});

// ═══════════════════════════════════════
//  SCROLL REVEAL + NAV HIGHLIGHT
// ═══════════════════════════════════════
const obs=new IntersectionObserver(entries=>entries.forEach(e=>{
  if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target);}
}),{threshold:.1});
document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));

const allSecs=document.querySelectorAll('section[id],div[id]');
const navAs=document.querySelectorAll('.nav-links a');
window.addEventListener('scroll',()=>{
  let active='';
  allSecs.forEach(s=>{ if(window.scrollY>=s.offsetTop-140) active=s.id; });
  navAs.forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+active));
},{passive:true});
