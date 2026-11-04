/* Distribución elíptica proporcional a la pantalla y al número real de módulos. */
(() => {
  'use strict';
  function init(){
    const board=document.querySelector('body .workspace');
    const grid=board?.querySelector('.module-grid');
    if(!grid)return;
    const items=[...grid.querySelectorAll('.module-shell')];
    function layout(){
      const width=board.getBoundingClientRect().width;
      if(!width)return;
      const small=width<=540,medium=width<=800;
      const cardW=small?146:medium?164:Math.min(210,Math.max(166,width*.155));
      const cardH=small?104:medium?112:126;
      const height=small?1940:medium?1530:width<1100?1120:960;
      board.style.setProperty('--gg-tec-orbit-height',height+'px');
      board.style.setProperty('--gg-tec-card-width',cardW+'px');
      board.style.setProperty('--gg-tec-card-height',cardH+'px');
      const rx=Math.max(0,(width-cardW)/2-(small?10:22));
      const ry=(height-cardH)/2-(small?90:65);
      const n=items.length;
      items.forEach((item,i)=>{
        const theta=-Math.PI/2 + i*Math.PI*2/n;
        const x=width/2+Math.cos(theta)*rx;
        const y=height/2+Math.sin(theta)*ry;
        item.style.setProperty('--ox',x.toFixed(2)+'px');
        item.style.setProperty('--oy',y.toFixed(2)+'px');
      });
      const hint=board.querySelector('.gg-orbit-hint');
      if(hint)hint.textContent=n+' ESPACIOS · UNA SOLA PLATAFORMA';
    }
    layout();
    if('ResizeObserver' in window)new ResizeObserver(layout).observe(board);
    else window.addEventListener('resize',layout,{passive:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
