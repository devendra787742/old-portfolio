(function(){
  var CERTS={
    oracle:{t:"Oracle Certified Professional: Java SE 17 Developer",src:"assets/certificates/oracle-java-se-17-developer.pdf"},
    sap:{t:"SAP Certified – Data Analyst – SAP Analytics Cloud",src:"assets/certificates/sap-data-analyst-analytics-cloud.pdf"},
    epic:{t:"Game Development and Prototyping – Epic Games",src:"assets/certificates/epic-games-game-development-prototyping.pdf"},
    google:{t:"Start the UX Design Process – Google",src:"assets/certificates/google-ux-design-process.pdf"}
  };
  var modal=document.querySelector('.cert-modal');
  var frame=modal.querySelector('.cert-frame'),link=modal.querySelector('.cert-open');
  var title=modal.querySelector('.cert-modal-title');
  function open(k){var c=CERTS[k];if(!c)return;frame.src=c.src+'#view=FitH';frame.title=c.t;link.href=c.src;title.textContent=c.t;modal.classList.add('open');}
  function close(){modal.classList.remove('open');frame.removeAttribute('src');}
  document.querySelectorAll('.cert-view').forEach(function(a){
    a.addEventListener('click',function(e){e.preventDefault();var k=a.getAttribute('data-cert');
      if(matchMedia('(pointer: coarse)').matches||innerWidth<768){window.open(CERTS[k].src,'_blank','noopener');return;}
      open(k);});
  });
  modal.addEventListener('click',function(e){if(e.target===modal||e.target.classList.contains('cert-modal-close'))close();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')close();});
})();
