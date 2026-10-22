/* Space universe: 3D solar system with scroll-driven camera journey + cursor dog */
(function(){
'use strict';
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
var coarse=matchMedia('(pointer: coarse)').matches;
var hero=document.getElementById('hero');
var updaters=[];
function initSpace(){
  var canvas=document.getElementById('space-canvas'),T=window.THREE;
  var renderer;
  try{renderer=new T.WebGLRenderer({canvas:canvas,alpha:true,antialias:innerWidth>900});}catch(e){return false;}
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,innerWidth<768?1.25:1.75));
  var scene=new T.Scene(),cam=new T.PerspectiveCamera(45,1,.1,3000),root=new T.Group();scene.add(root);
  function tex(stops,seed){var c=document.createElement('canvas');c.width=512;c.height=256;var g=c.getContext('2d'),gr=g.createLinearGradient(0,0,0,256);
    stops.forEach(function(s,i){gr.addColorStop(i/(stops.length-1),s)});g.fillStyle=gr;g.fillRect(0,0,512,256);
    var r=seed,rnd=function(){return(r=r*16807%2147483647)/2147483647};
    for(var i=0;i<280;i++){g.fillStyle=rnd()>.5?'#fff':'#000';g.globalAlpha=.03+rnd()*.07;g.beginPath();g.ellipse(rnd()*512,rnd()*256,10+rnd()*60,2+rnd()*10,0,0,6.283);g.fill()}
    return new T.CanvasTexture(c)}
  function glow(col,a){var c=document.createElement('canvas');c.width=c.height=128;var g=c.getContext('2d'),r=g.createRadialGradient(64,64,0,64,64,64);
    r.addColorStop(0,'rgba('+col+','+a+')');r.addColorStop(1,'rgba('+col+',0)');g.fillStyle=r;g.fillRect(0,0,128,128);
    return new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(c),blending:T.AdditiveBlending,depthWrite:false,transparent:true}))}
  // stars
  function stars(n,size,op){var p=new Float32Array(n*3);for(var i=0;i<n;i++){var u=Math.random()*6.283,v=Math.acos(2*Math.random()-1),d=900+Math.random()*700;
      p[i*3]=d*Math.sin(v)*Math.cos(u);p[i*3+1]=d*Math.cos(v);p[i*3+2]=d*Math.sin(v)*Math.sin(u)}
    var g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(p,3));
    var m=new T.PointsMaterial({color:0xcfe3ff,size:size,sizeAttenuation:false,transparent:true,opacity:op,depthWrite:false});var s=new T.Points(g,m);scene.add(s);return s}
  var weak=innerWidth<768,sA=stars(weak?700:1600,1.4,.8),sB=stars(weak?300:700,2.2,.9);
  [['120,60,255',-700,200,-1200,1500],['0,200,255',800,-150,-1300,1400],['255,80,160',100,350,-1500,1100]].forEach(function(n){var s=glow(n[0],.22);s.position.set(n[1],n[2],n[3]);s.scale.set(n[4],n[4]*.6,1);scene.add(s)});
  var gal=glow('200,210,255',.35);gal.position.set(-900,-250,-1400);gal.scale.set(500,120,1);gal.material.rotation=.5;scene.add(gal);
  // sun
  var sun=new T.Mesh(new T.SphereGeometry(5,48,32),new T.MeshBasicMaterial({map:tex(['#ffcf5a','#ff9a1f','#ffcf5a'],7)}));root.add(sun);
  var sg=glow('255,170,60',.9);sg.scale.set(34,34,1);sun.add(sg);var sg2=glow('255,220,150',.5);sg2.scale.set(15,15,1);sun.add(sg2);
  root.add(new T.PointLight(0xfff0d8,2.4,0,0));scene.add(new T.AmbientLight(0x6a7aa0,.45));
  function atmo(r,col){return new T.Mesh(new T.SphereGeometry(r*1.12,40,28),new T.ShaderMaterial({uniforms:{c:{value:new T.Color(col)}},vertexShader:'varying vec3 n;varying vec3 v;void main(){n=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);v=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',fragmentShader:'varying vec3 n;varying vec3 v;uniform vec3 c;void main(){float i=pow(.72-dot(n,v),3.);gl_FragColor=vec4(c,1.)*i;}',blending:T.AdditiveBlending,side:T.BackSide,transparent:true,depthWrite:false}))}
  var DATA=[['Mercury',.5,9,.9,['#8c8279','#b8ad9f','#756c62'],'Closest planet to the Sun. One orbit takes 88 Earth days.'],
    ['Venus',.9,12.5,.65,['#d9b27c','#e8cfa0','#b98d57'],'Hottest planet, wrapped in a thick carbon dioxide atmosphere.'],
    ['Earth',1,16.5,.5,['#1f5fa8','#3c8a4f','#1f5fa8'],'Our home, and the only known world with life. It has one Moon.'],
    ['Mars',.7,20.5,.4,['#b5502d','#d9855b','#8c3a20'],'The Red Planet. Iron oxide dust gives it its colour.'],
    ['Jupiter',2.6,34,.22,['#c9a27a','#e8d3b3','#a9744f','#e0c9a6'],'The largest planet. Its Great Red Spot is a giant storm.'],
    ['Saturn',2.2,44,.16,['#d9c18d','#ecdcb0','#c2a56d'],'Known for its bright ring system of ice and rock.'],
    ['Uranus',1.5,53,.11,['#8fd6dc','#b6edf0','#7cc3cb'],'An ice giant that rotates tilted on its side.'],
    ['Neptune',1.4,61,.09,['#2f4fd6','#5b7cf0','#2540b0'],'The farthest planet, with supersonic winds.']];
  var bodies=[{mesh:sun,name:'Sun',info:'Our star. It holds about 99.8% of the solar system\'s mass.',r:5}],moon;
  DATA.forEach(function(d,i){d[1]*=1.5;var pv=new T.Group();pv.rotation.y=i*.9;root.add(pv);
    var m=new T.Mesh(new T.SphereGeometry(d[1],40,28),(function(){var t=tex(d[4],i+3);return new T.MeshStandardMaterial({map:t,bumpMap:t,bumpScale:1.5,roughness:.9})})());m.position.x=d[2];m.rotation.z=d[0]==='Uranus'?1.4:.3;pv.add(m);var AC={Earth:0x4aa3ff,Venus:0xffd9a0,Mars:0xff9a70,Jupiter:0xe8c9a0,Saturn:0xf0e0b0,Uranus:0x9fe8ee,Neptune:0x6f8cff}[d[0]];if(AC)m.add(atmo(d[1],AC));
    var ring=new T.Line(new T.BufferGeometry().setFromPoints(Array.from({length:129},function(_,k){var a=k/128*6.283;return new T.Vector3(Math.cos(a)*d[2],0,Math.sin(a)*d[2])})),new T.LineBasicMaterial({color:0x5a7bd0,transparent:true,opacity:.18}));root.add(ring);
    if(d[0]==='Saturn'){[[1.45,2.0,.55,0xd8c394],[2.1,2.6,.35,0xb9a477]].forEach(function(r){var rm=new T.Mesh(new T.RingGeometry(d[1]*r[0],d[1]*r[1],72),new T.MeshBasicMaterial({color:r[3],transparent:true,opacity:r[2],side:T.DoubleSide}));rm.rotation.x=Math.PI/2-.45;m.add(rm)})}
    if(d[0]==='Earth'){var mo=new T.Mesh(new T.SphereGeometry(.28,24,16),new T.MeshStandardMaterial({color:0xbdbdbd,roughness:1}));moon=new T.Group();moon.add(mo);mo.position.x=3.4;m.add(moon)}
    bodies.push({mesh:m,pivot:pv,name:d[0],info:d[5],r:d[1],w:d[3]*.12,spin:.4+(i%3)*.15})});
  // asteroid belt
  var ap=new Float32Array((weak?400:900)*3);for(var i=0;i<ap.length;i+=3){var a=Math.random()*6.283,rr=24+Math.random()*4;ap[i]=Math.cos(a)*rr;ap[i+1]=(Math.random()-.5)*.8;ap[i+2]=Math.sin(a)*rr}
  var ag=new T.BufferGeometry();ag.setAttribute('position',new T.BufferAttribute(ap,3));var belt=new T.Points(ag,new T.PointsMaterial({color:0x9a9080,size:1.6,sizeAttenuation:false}));root.add(belt);
  // camera state
  var V=T.Vector3,S={yaw:.35,pitch:.35,rad:reduce?105:300,t:new V()},G={yaw:.35,pitch:.35,rad:105,t:new V(),focus:null},mx=0,my=0,tmp=new V();
  function layout(){var w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();root.position.x=0}
  layout();addEventListener('resize',layout);
  addEventListener('scroll',function(){canvas.style.opacity=Math.max(.8,1-scrollY/(innerHeight*2));if(G.focus&&scrollY>innerHeight*.3){G.focus=null;info.style.display='none'}var v=scrollY<innerHeight*.8;rb.style.display=v?'block':'none'});
  // UI
  var tip=document.createElement('div');tip.id='sp-tip';var info=document.createElement('div');info.id='sp-info';
  var rb=document.createElement('button');rb.id='sp-reset';rb.textContent='Reset view';rb.setAttribute('aria-label','Reset solar system view');
  document.body.append(tip,info,rb);rb.style.display='block';
  function reset(){G.focus=null;G.yaw=.35;G.pitch=.35;G.rad=105;G.t.set(0,0,0);info.style.display='none'}rb.onclick=reset;
  var ray=new T.Raycaster(),nd=new T.Vector2();
  function pick(e){nd.set(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1);ray.setFromCamera(nd,cam);var h=ray.intersectObjects(bodies.map(function(b){return b.mesh}),false)[0];
    return h&&bodies.filter(function(b){return b.mesh===h.object})[0]}
  var drag=false,moved=0,lx=0,ly=0;
  hero.addEventListener('pointerdown',function(e){if(e.target.closest('a,button'))return;drag=e.pointerType==='mouse';moved=0;lx=e.clientX;ly=e.clientY});
  addEventListener('pointerup',function(e){if(drag||e.pointerType!=='mouse'){}drag=false});
  hero.addEventListener('pointermove',function(e){mx=e.clientX/innerWidth-.5;my=e.clientY/innerHeight-.5;
    if(drag){var dx=e.clientX-lx,dy=e.clientY-ly;lx=e.clientX;ly=e.clientY;moved+=Math.abs(dx)+Math.abs(dy);G.yaw-=dx*.005;G.pitch=Math.max(.08,Math.min(1.3,G.pitch+dy*.004));return}
    if(e.target.closest('a,button')){tip.style.display='none';return}
    var b=pick(e);if(b){tip.textContent=b.name;tip.style.display='block';tip.style.left=e.clientX+14+'px';tip.style.top=e.clientY+14+'px'}else tip.style.display='none'});
  hero.addEventListener('pointerleave',function(){tip.style.display='none'});
  hero.addEventListener('click',function(e){if(moved>5||e.target.closest('a,button'))return;var b=pick(e);if(!b)return;G.focus=b;G.rad=b.r*5+5;
    info.innerHTML='<b></b><span></span>';info.firstChild.textContent=b.name;info.lastChild.textContent=b.info;info.style.display='block'});
  hero.addEventListener('wheel',function(e){if(!e.ctrlKey&&!e.metaKey)return;e.preventDefault();G.rad=Math.max(40,Math.min(260,G.rad*(1+e.deltaY*.002)))},{passive:false});
  var t0=0;
  updaters.push(function(dt,t){
    if(document.hidden)return;
    bodies.forEach(function(b){if(b.pivot){if(!reduce)b.pivot.rotation.y+=b.w*dt;b.mesh.rotation.y+=b.spin*dt}});
    if(!reduce){sun.rotation.y+=.05*dt;belt.rotation.y+=.01*dt;if(moon)moon.rotation.y+=1.5*dt;sA.rotation.y+=.002*dt;sB.rotation.y-=.003*dt}
    sA.material.opacity=.65+Math.sin(t*1.3)*.2;sB.material.opacity=.7+Math.sin(t*2.1+1)*.25;
    if(G.focus){G.focus.mesh.getWorldPosition(G.t)}
    else if(scrollY>40){var h=Math.max(0,Math.min(1,1-scrollY/innerHeight)),pr=Math.min(1,scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight)),n=bodies.length,f=pr*(n-1),k=Math.min(n-2,Math.floor(f)),u=f-k;u=u*u*(3-2*u);
      bodies[k].mesh.getWorldPosition(tmp);var A=tmp.clone();bodies[k+1].mesh.getWorldPosition(tmp);A.lerp(tmp,u);
      G.t.copy(A).multiplyScalar(1-h);G.rad=((bodies[k].r*(1-u)+bodies[k+1].r*u)*5+8)*(1-h)+105*h}
    else G.t.set(0,0,0);
    S.t.lerp(G.t,.07);S.rad+=(G.rad-S.rad)*(reduce?.2:.04);S.yaw+=(G.yaw-S.yaw)*.07;S.pitch+=(G.pitch-S.pitch)*.07;
    var y=S.yaw+mx*.12,p=S.pitch+my*.06;
    cam.position.set(S.t.x+S.rad*Math.cos(p)*Math.sin(y),S.t.y+S.rad*Math.sin(p),S.t.z+S.rad*Math.cos(p)*Math.cos(y));cam.lookAt(S.t);if(innerWidth>900)cam.translateX(-S.rad*.32);
    renderer.render(scene,cam)});
  return true}
function initDog(){
  var T=window.THREE;if(!T||reduce||coarse||innerWidth<768)return;
  var c=document.getElementById('dog-canvas'),r;try{r=new T.WebGLRenderer({canvas:c,alpha:true,antialias:true})}catch(e){return}
  c.style.display='block';r.setPixelRatio(Math.min(devicePixelRatio||1,2));r.setSize(150,120,false);
  var sc=new T.Scene(),cm=new T.PerspectiveCamera(32,1.25,.1,50);cm.position.set(2.6,2.6,6.4);cm.lookAt(0,1.05,0);var sh=new T.Mesh(new T.CircleGeometry(1.1,24),new T.MeshBasicMaterial({color:0,transparent:true,opacity:.3,depthWrite:false}));sh.rotation.x=-Math.PI/2;sh.position.y=.02;sh.scale.set(1.5,.7,1);sc.add(sh);
  sc.add(new T.AmbientLight(0xffffff,.75));var dl=new T.DirectionalLight(0xffffff,.9);dl.position.set(3,6,5);sc.add(dl);
  var M=function(col){return new T.MeshStandardMaterial({color:col,roughness:.85})},fur=M(0xc68642),dark=M(0x8a5a2b),light=M(0xe3b886),blk=new T.MeshBasicMaterial({color:0x111111});
  function mesh(g,m,x,y,z){var o=new T.Mesh(g,m);o.position.set(x,y,z);return o}
  var dog=new T.Group(),body=new T.Group();dog.add(body);sc.add(dog);
  var torso=mesh(new T.SphereGeometry(.5,24,16),fur,0,1.15,0);torso.scale.set(1.65,.82,.8);body.add(torso);
  var head=new T.Group();head.position.set(1.1,1.72,0);body.add(head);head.add(mesh(new T.SphereGeometry(.38,24,16),fur,0,0,0));
  head.add(mesh(new T.BoxGeometry(.38,.2,.24),light,.38,-.1,0));head.add(mesh(new T.SphereGeometry(.07,12,8),blk,.58,-.04,0));
  var eyes=[.17,-.17].map(function(z){var e=mesh(new T.SphereGeometry(.05,10,8),blk,.26,.08,z);head.add(e);return e});
  var ears=[.2,-.2].map(function(z){var e=new T.Group();e.position.set(-.05,.3,z);e.add(mesh(new T.BoxGeometry(.13,.32,.09),dark,0,.1,0));head.add(e);return e});
  var tail=new T.Group();tail.position.set(-.95,1.4,0);tail.add(mesh(new T.CylinderGeometry(.05,.08,.62,8),fur,-.15,.2,0));tail.children[0].rotation.z=.6;body.add(tail);
  var legs=[[.6,.24,0],[.6,-.24,1],[-.6,.24,1],[-.6,-.24,0]].map(function(l){var p=new T.Group();p.position.set(l[0],.9,l[1]);p.add(mesh(new T.CylinderGeometry(.08,.07,.8,8),fur,0,-.4,0));p.add(mesh(new T.SphereGeometry(.1,10,8),dark,.03,-.8,0));body.add(p);return{g:p,ph:l[2],front:l[0]>0}});
  var pos={x:80,y:innerHeight-40},vel={x:0,y:0},cur={x:pos.x,y:pos.y},state='walk',idle=0,sit=0,ph=0,yawT=.35,yaw=.35,blink=0,nb=2;
  var OFF={x:-70,y:6};
  addEventListener('pointermove',function(e){cur.x=e.clientX;cur.y=e.clientY;if(state==='sit'&&Math.hypot(cur.x+OFF.x-pos.x,cur.y+OFF.y-pos.y)>70){state='walk';idle=0}},{passive:true});
  updaters.push(function(dt,t){
    if(document.hidden)return;
    var tx=Math.max(70,Math.min(innerWidth-70,cur.x+OFF.x)),ty=Math.max(30,Math.min(innerHeight-6,cur.y+OFF.y)),dx=tx-pos.x,dy=ty-pos.y,d=Math.hypot(dx,dy);
    if(state==='walk'){var sp=Math.min(420,d*3.2),k=Math.min(1,dt*4),ux=d>1?dx/d:0,uy=d>1?dy/d:0;vel.x+=(ux*sp-vel.x)*k;vel.y+=(uy*sp-vel.y)*k;pos.x+=vel.x*dt;pos.y+=vel.y*dt;
      var s=Math.hypot(vel.x,vel.y);if(d<8&&s<25){idle+=dt;if(idle>.4){state='sit';vel.x=vel.y=0}}else idle=0;
      if(Math.abs(vel.x)>12)yawT=vel.x>0?.35:Math.PI-.35}
    var spd=Math.hypot(vel.x,vel.y);sit+=((state==='sit'?1:0)-sit)*Math.min(1,dt*4);yaw+=(yawT-yaw)*Math.min(1,dt*8);
    pos.x=Math.max(70,Math.min(innerWidth-70,pos.x));pos.y=Math.max(30,Math.min(innerHeight-6,pos.y));
    ph+=spd*dt*.05;var mv=Math.min(1,spd/60)*(1-sit),w=Math.sin(ph)*.75*mv;
    dog.rotation.y=yaw;dog.position.y=Math.abs(Math.sin(ph))*.05*mv-.5*sit;body.rotation.z=.7*sit;
    legs.forEach(function(l){var sw=(l.ph?-w:w);l.g.rotation.z=l.front?(sw*(1-sit)-.7*sit):(sw*(1-sit)+1.4*sit-.0)});
    var wag=Math.sin(t*(mv>.1?14:6))*.5;tail.rotation.y=wag;tail.rotation.z=.15*Math.sin(t*3);
    torso.scale.y=.82+Math.sin(t*2.2)*.018*(1+sit);head.rotation.z=-.3*sit*.5+Math.sin(ph*2)*.05*mv;
    ears.forEach(function(e,i){e.rotation.z=(i?.15:-.1)+Math.sin(t*(1.3+i))*.05+(mv>.3?-.25:0)+(Math.sin(t*.7)>.97?.3:0)});
    nb-=dt;if(nb<0){blink=.12;nb=2+Math.random()*3}blink=Math.max(0,blink-dt);eyes.forEach(function(e){e.scale.y=blink>0?.1:1});
    c.style.transform='translate('+(pos.x-75).toFixed(1)+'px,'+(pos.y-104).toFixed(1)+'px)';r.render(sc,cm)})}
var tries=0;(function boot(){if(window.THREE){initSpace()||document.documentElement.classList.add('no-webgl');initDog();var last=performance.now();
  (function loop(n){requestAnimationFrame(loop);var dt=Math.min(.05,(n-last)/1000);last=n;updaters.forEach(function(u){u(dt,n/1000)})})(last)}
  else if(tries++<50)setTimeout(boot,100);else document.documentElement.classList.add('no-webgl')})();
})();
