/* Native, offline-friendly navigation and an explicitly local inquiry composer. */
(()=>{
 'use strict';
 const menu=document.querySelector('#mobile-nav');
 const toggle=document.querySelector('.menu-button');
 const close=document.querySelector('.menu-close');
 const reduced=matchMedia('(prefers-reduced-motion:reduce)');
 const setExpanded=open=>{toggle?.setAttribute('aria-expanded',String(open));toggle?.setAttribute('aria-label',open?'關閉選單':'開啟選單');};
 if(menu&&toggle){
  let menuAnimation=null;
  const closeMenu=()=>{
   if(!menu.open)return;
   menuAnimation?.cancel();
   if(reduced.matches){menu.close();return;}
   menuAnimation=menu.animate([{transform:'translateX(0)',opacity:1},{transform:'translateX(24px)',opacity:0}],{duration:150,easing:'ease-in',fill:'both'});
   menuAnimation.finished.then(()=>{menu.close();menuAnimation.cancel();}).catch(()=>{});
  };
  toggle.addEventListener('click',()=>{if(menu.open)closeMenu();else{
   menuAnimation?.cancel();menu.showModal();setExpanded(true);
   if(!reduced.matches)menuAnimation=menu.animate([{transform:'translateX(32px)',opacity:0},{transform:'translateX(0)',opacity:1}],{duration:240,easing:'cubic-bezier(.2,.8,.2,1)'});
  }});
  close?.addEventListener('click',closeMenu);
  menu.addEventListener('cancel',e=>{e.preventDefault();closeMenu();});
  menu.addEventListener('close',()=>{setExpanded(false);toggle.focus({preventScroll:true});});
  menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menuAnimation?.cancel();menu.close();}));
  menu.addEventListener('click',e=>{if(e.target!==menu)return;const r=menu.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeMenu();});
  matchMedia('(min-width:1121px)').addEventListener('change',e=>{if(e.matches&&menu.open)menu.close();});
 }
 // Current route stays visible in both desktop and mobile navigation.
 document.querySelectorAll('.desktop-nav a,.mobile-nav nav a').forEach(a=>{
  if(new URL(a.href).pathname===location.pathname)a.setAttribute('aria-current','page');
 });
 // Reveal once, with no hidden CSS state: content stays readable if scripting fails.
 if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
   if(!entry.isIntersecting)return;
   observer.unobserve(entry.target);
   if(!reduced.matches)entry.target.animate([{opacity:.45,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:500,easing:'cubic-bezier(.2,.8,.2,1)'});
  }),{threshold:.08});
  document.querySelectorAll('.section-head,.need-grid,.product-grid,.service-copy,.chapter-heading,.journal-grid,.three-notes,.prepare-layout,.story-layout,.contact-layout,.support-content>section').forEach(el=>observer.observe(el));
 }
 // Native details retain keyboard support, deep links and a no-script fallback.
 document.querySelectorAll('details').forEach(details=>{
  const summary=details.querySelector('summary');
  if(!summary)return;
  let animation=null;
  let expanded=details.open;
  const settle=()=>{details.open=expanded;details.style.height='';details.style.overflow='';summary.setAttribute('aria-expanded',String(expanded));};
  summary.setAttribute('aria-expanded',String(expanded));
  details.addEventListener('toggle',()=>{if(!animation){expanded=details.open;summary.setAttribute('aria-expanded',String(expanded));}});
  summary.addEventListener('click',e=>{
   if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
   e.preventDefault();
   const from=details.getBoundingClientRect().height;
   animation?.cancel();animation=null;
   expanded=!expanded;
   if(reduced.matches){settle();return;}
   details.open=true;details.style.height='';
   const to=expanded?details.getBoundingClientRect().height:summary.getBoundingClientRect().height+2;
   details.style.overflow='hidden';
   summary.setAttribute('aria-expanded',String(expanded));
   animation=details.animate([{height:from+'px'},{height:to+'px'}],{duration:240,easing:'cubic-bezier(.2,.8,.2,1)'});
   const current=animation;
   current.finished.then(()=>{if(animation!==current)return;animation=null;settle();}).catch(()=>{});
  });
  reduced.addEventListener('change',()=>{if(reduced.matches&&animation){animation.cancel();animation=null;settle();}});
  window.addEventListener('resize',()=>{if(animation){animation.cancel();animation=null;settle();}},{passive:true});
 });
 // Native anchor scrolling, with one active chapter and keyboard focus at the destination.
 const chapterGroups=[...document.querySelectorAll('.chapter-nav,.support-nav')].map(nav=>[...nav.querySelectorAll('a[href^="#"]')].map(link=>({link,target:document.getElementById(decodeURIComponent(link.hash.slice(1)))})).filter(item=>item.target));
 let scheduled=false;
 const updateChapters=()=>{
  scheduled=false;
  chapterGroups.forEach(items=>{
   let active=items[0];
   const offset=parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)||120;
   items.forEach(item=>{if(item.target.getBoundingClientRect().top<=offset+24)active=item;});
   items.forEach(item=>{if(item===active)item.link.setAttribute('aria-current','location');else item.link.removeAttribute('aria-current');});
  });
 };
 const queueChapters=()=>{if(!scheduled){scheduled=true;requestAnimationFrame(updateChapters);}};
 if(chapterGroups.some(items=>items.length)){
  addEventListener('scroll',queueChapters,{passive:true});addEventListener('resize',queueChapters,{passive:true});updateChapters();
  chapterGroups.flat().forEach(({link,target})=>link.addEventListener('click',()=>{
   if(!target.hasAttribute('tabindex')){target.setAttribute('tabindex','-1');target.addEventListener('blur',()=>target.removeAttribute('tabindex'),{once:true});}
   target.focus({preventScroll:true});
  }));
 }
 reduced.addEventListener('change',()=>{
  if(reduced.matches)document.getAnimations().forEach(a=>a.cancel());
 });
 const form=document.querySelector('#inquiry-form');
 if(form){
  const select=form.querySelector('#product');
  const needs=form.querySelector('#needs');
  const status=form.querySelector('.form-status');
  status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.setAttribute('aria-atomic','true');
  const submit=form.querySelector('[type="submit"]');
  const submitLabel=submit?.querySelector('span');
  const originalLabel=submitLabel?.textContent;
  let resetLabel;
  const requested=new URLSearchParams(location.search).get('product');
  if(['米羅','維納斯','睡精靈'].includes(requested))select.value=requested;
  form.addEventListener('submit',async e=>{
   e.preventDefault();
   if(submit?.disabled)return;
   if(submit){submit.disabled=true;submit.setAttribute('aria-busy','true');}
   const draft=`您好，我想詢問永吉床墊。\n想了解的款式：${select.value}\n\n目前睡感與想確認的事情：\n${needs.value.trim()||'想先了解選床方向與到店比較方式。'}\n\n也想確認展示款式、到店安排、尺寸與完整價格。`;
   let copied=false;
   try{await navigator.clipboard.writeText(draft);copied=true;}catch{
    const backup=document.createElement('textarea');backup.value=draft;backup.setAttribute('aria-label','詢問內容備份');backup.style.cssText='position:fixed;left:-9999px;top:0';document.body.append(backup);backup.select();
    try{copied=document.execCommand('copy');}catch{}backup.remove();
   }
   if(copied)status.textContent='已複製詢問內容。請貼到品牌既有聯絡管道；目前尚未送出或成立預約。';
   else{needs.value=draft;needs.focus();needs.select();status.textContent='無法自動複製。內容已放入文字欄位，請手動複製；目前尚未送出。';}
   status.classList.toggle('is-success',copied);
   if(submit){submit.disabled=false;submit.removeAttribute('aria-busy');}
   if(submitLabel){clearTimeout(resetLabel);submitLabel.textContent=copied?'已複製詢問內容':'請手動複製內容';resetLabel=setTimeout(()=>{submitLabel.textContent=originalLabel;},2400);}
   if(!reduced.matches)status.animate([{opacity:.5,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],{duration:200,easing:'ease-out'});
  });
 }
})();
