/* 3D hover tilt for cards */
(function(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches||matchMedia('(pointer: coarse)').matches)return;
  document.querySelectorAll('.project-card,.cert-card,.skill-card,.stat-card').forEach(function(el){
    el.addEventListener('pointermove',function(e){
      if(el.classList.contains('reveal')&&!el.classList.contains('visible'))return;
      var r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
      el.style.transform='perspective(800px) rotateX('+(-y*9).toFixed(2)+'deg) rotateY('+(x*11).toFixed(2)+'deg) translateZ(10px)';
    });
    el.addEventListener('pointerleave',function(){el.style.transform=''});
  });
})();
