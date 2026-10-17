'use strict';
const APP_VERSION='0.1.0';
const CHANGELOG=[{version:APP_VERSION,date:'2026-10-17',items:[{ja:'3〜7回のランダムなカード選択と、積分・別解の記号判定を追加。',en:'Draw a random number of cards and verify integrals symbolically.'}]}];
const $=id=>document.getElementById(id),t=key=>I18N.t(key);
const saved=k=>{try{return localStorage.getItem(k);}catch{return null;}},store=(k,v)=>{try{localStorage.setItem(k,v);}catch{}};
const seenKey='integral-cards/seen-version';
if(!saved(seenKey)&&!saved('integral-cards/lang'))store(seenKey,APP_VERSION);
I18N.init('integral-cards/lang',STRINGS);
let total,round,tokens,mode,choices,selected=null,playing=false,busy=false,worker=null,message='',solution=null,revealed=false,epoch=0;
let level=saved('integral-cards/level')==='2'?2:1;
let advanceTimer=0,successTimer=0;
function reset(){epoch++;clearTimeout(advanceTimer);clearTimeout(successTimer);$('success-overlay').hidden=true;if(worker)worker.terminate();worker=null;total=IntegralEngine.drawCount();round=0;tokens=[];mode=null;selected=null;playing=false;busy=false;message='';solution=null;revealed=false;$('answer').value='';deal();}
function deal(){choices=IntegralEngine.pair(round,total,tokens,Math.random,level);selected=null;render();}
function cardLabel(c){return typeof c==='string'?c==='*'?'×':c==='/'?'÷':c==='-'?'−':c: c.kind==='indefinite'?'∫':`∫ [${c.aLabel??c.a}, ${c.bLabel??c.b}]`;}
function math(cards){
 const node=(tag,text,...children)=>{const el=document.createElementNS('http://www.w3.org/1998/Math/MathML',tag);if(text!==null)el.textContent=text;el.append(...children);return el;};
 const argument=s=>s==='x^2'?node('msup',null,node('mi','x'),node('mn','2')):s==='2*x'?node('mrow',null,node('mn','2'),node('mi','x')):s==='x+1'?node('mrow',null,node('mi','x'),node('mo','+'),node('mn','1')):node('mi',s);
 const factor=(name,power)=>{let base;if(name==='x')base=node('mi','x');else{const [,fn,arg]=name.match(/^(\w+)\((.*)\)$/);base=fn==='exp'?node('msup',null,node('mi','e'),argument(arg)):node('mrow',null,node('mi',fn),node('mo','('),argument(arg),node('mo',')'));}return power===1?base:node('msup',null,base,node('mn',String(power)));};
 const area=node('math',null);area.setAttribute('display','inline');
 IntegralEngine.displayTerms(cards).forEach((term,i)=>{const numerator=node('mrow',null),denominator=node('mrow',null);let top=[],bottom=[];
  for(const [name,power]of Object.entries(term.powers))(power>0?top:bottom).push(factor(name,Math.abs(power)));
  if(Math.abs(term.coefficient)!==1||!top.length)top.unshift(node('mn',String(Math.abs(term.coefficient))));
  if(term.denominator!==1)bottom.unshift(node('mn',String(term.denominator)));
  numerator.append(...top);denominator.append(...bottom);
  if(term.coefficient<0)area.append(node('mo','−'));else if(i)area.append(node('mo','+'));
  area.append(bottom.length?node('mfrac',null,numerator,denominator):numerator);
 });if(!area.children.length)area.append(node('mn','0'));return area;
}
function render(){
 $('lang-select').value=I18N.lang();$('round').textContent=`${Math.min(round+1,total)} / ${total}`;
 $('level-select').value=String(level);
 $('step-label').textContent=t(round===0?'first':'next');
 $('progress').style.width=`${(round+(selected!==null?1:0))/total*100}%`;
 $('draw-panel').hidden=playing;$('answer-panel').hidden=!playing;
 $('next').hidden=true;
 for(let i=0;i<2;i++){const el=$('card-'+i);el.disabled=selected!==null;el.classList.toggle('chosen',selected===i);el.classList.toggle('unchosen',selected!==null&&selected!==i);el.querySelector('.face').textContent=selected===null?'∫':cardLabel(choices[i]);el.querySelector('.card-note').textContent=selected===null?t('choose'):selected===i?'✓':'—';el.setAttribute('aria-label',t(i===0?'left':'right'));}
 const shownMode=IntegralEngine.problemMode(mode,tokens);
 const items=mode?[cardLabel(shownMode),...tokens.map(cardLabel)]:[];
 $('collection').replaceChildren(...items.map((v,i)=>{const el=document.createElement('span');el.className='chip'+(i===0?' integral':'');el.textContent=v;return el;}));
 $('collection-empty').hidden=items.length>0;
 $('equation').replaceChildren();
 if(tokens.length){let exp;try{exp=IntegralEngine.expression(tokens);}catch{exp=tokens.map(cardLabel).join(' ');}
  const sign=document.createElement('span');sign.className='integral-sign';sign.textContent='∫';
  if(shownMode?.kind==='definite'){const lim=document.createElement('span');lim.className='limits';const a=document.createElement('span'),b=document.createElement('span');a.textContent=shownMode.bLabel??shownMode.b;b.textContent=shownMode.aLabel??shownMode.a;lim.append(a,b);sign.append(lim);}
  let formatted;try{formatted=math(tokens);}catch{formatted=document.createElement('span');formatted.textContent=exp;}
  $('equation').append(sign,formatted);if(playing||round===total-1&&selected!==null){const dx=document.createElement('span');dx.textContent='dx';$('equation').append(dx);}
 }else $('equation').textContent=t('building');
 $('status').textContent=t(busy?'busy':message||'ready');$('status').hidden=!playing;
 for(const id of ['check','impossible','show','answer'])$(id).disabled=busy;
 $('solution').hidden=!revealed;$('solution').replaceChildren();
 if(revealed){const label=document.createElement('strong');label.textContent=t('solution');$('solution').append(label);const body=document.createElement('p');body.textContent=solution?.status==='solved'?solution.answer:t(solution?.status||'unknown');$('solution').append(body);}
 const full=!!(document.fullscreenElement||document.webkitFullscreenElement);document.body.classList.toggle('fullscreen',full);
 for(const attr of ['title','aria-label'])$('fullscreen-btn').setAttribute(attr,t(full?'c.exitFullscreen':'c.fullscreen'));
 for(const id of ['settings-btn','changelogBtn'])$(id).classList.toggle('has-news',saved(seenKey)!==APP_VERSION);
 $('changelog-list').replaceChildren(...CHANGELOG.map(e=>{const section=document.createElement('section');const h=document.createElement('h3');h.textContent=`v${e.version} (${e.date})`;const p=document.createElement('p');p.textContent=e.items.map(i=>i[I18N.lang()]).join(' ');section.append(h,p);return section;}));
}
function advance(){clearTimeout(advanceTimer);if(selected===null||playing)return;if(round===total-1){playing=true;render();$('answer').focus();}else{round++;deal();$('card-0').focus();}}
for(let i=0;i<2;i++)$('card-'+i).onclick=()=>{if(selected!==null||playing)return;selected=i;if(round===0)mode=choices[i];else tokens.push(choices[i]);render();const current=epoch;advanceTimer=setTimeout(()=>{if(current===epoch)advance();},600);};
$('next').onclick=advance;
$('reset').onclick=reset;
$('level-select').onchange=e=>{level=Number(e.target.value);store('integral-cards/level',String(level));reset();};
document.querySelectorAll('[data-insert]').forEach(button=>button.onclick=()=>{
 const input=$('answer');if(busy)return;const start=input.selectionStart??input.value.length,end=input.selectionEnd??start,selectedText=input.value.slice(start,end),template=button.dataset.insert;
 const text=template==='^'?'^()':template.includes('(x)')?template.replace('(x)','('+(selectedText||'x')+')'):template;
 if(input.value.length-(end-start)+text.length>input.maxLength)return;
 input.setRangeText(text,start,end,'end');input.focus();if(template==='^')input.setSelectionRange(start+2,start+2);else if(template.includes('(x)')){const inside=start+text.indexOf('(')+1;input.setSelectionRange(inside,inside+(selectedText||'x').length);}input.dispatchEvent(new Event('input',{bubbles:true}));
});
$('key-backspace').onclick=()=>{if(busy)return;const input=$('answer'),start=input.selectionStart??0,end=input.selectionEnd??start;input.setRangeText('',start===end?Math.max(0,start-1):start,end,'end');input.focus();input.dispatchEvent(new Event('input',{bubbles:true}));};
$('key-right').onclick=()=>{if(busy)return;const input=$('answer'),position=Math.min(input.value.length,(input.selectionEnd??0)+1);input.focus();input.setSelectionRange(position,position);};
async function run(action,answer){if(busy)return;busy=true;revealed=false;render();const current=epoch;
 const result=await new Promise(resolve=>{const localWorker=new Worker('worker.js');worker=localWorker;let timer=setTimeout(()=>finish({status:'unknown',verdict:'unknown'}),9000);function finish(data){clearTimeout(timer);localWorker.terminate();if(worker===localWorker)worker=null;resolve(data);}localWorker.onmessage=e=>finish(e.data);localWorker.onerror=()=>finish({status:'unknown',verdict:'unknown'});localWorker.postMessage({action,tokens,mode:IntegralEngine.problemMode(mode,tokens),answer});});
 if(current!==epoch)return;busy=false;solution=result;
 if(action==='solve'){revealed=true;message=result.status==='solved'?'ready':result.status;}else {message=result.verdict;revealed=['wrong','constant'].includes(result.verdict);}
 render();
 if(action==='grade'&&result.verdict==='correct'){clearTimeout(successTimer);$('success-overlay').hidden=false;successTimer=setTimeout(()=>$('success-overlay').hidden=true,1100);}
}
$('answer-form').onsubmit=e=>{e.preventDefault();run('grade',$('answer').value);};
$('impossible').onclick=()=>run('grade','NON_ELEMENTARY');$('show').onclick=()=>run('solve');
function openDialog(id){document.querySelectorAll('dialog[open]').forEach(d=>d.close());if(id==='changelogOverlay')store(seenKey,APP_VERSION);$(id).showModal();$('settings-btn').setAttribute('aria-expanded',String(id==='settings-panel'));render();}
document.querySelectorAll('dialog').forEach(d=>{d.querySelector('.close').onclick=()=>d.close();d.addEventListener('click',e=>{if(e.target!==d)return;const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();});d.addEventListener('close',()=>$('settings-btn').setAttribute('aria-expanded','false'));});
for(const [b,d]of Object.entries({'settings-btn':'settings-panel','feedback-btn':'feedbackOverlay','help-btn':'helpOverlay','changelogBtn':'changelogOverlay','appVersion':'changelogOverlay'}))$(b).onclick=()=>openDialog(d);
document.querySelectorAll('[data-open]').forEach(e=>e.onclick=()=>openDialog(e.dataset.open));
$('appVersion').textContent='v'+APP_VERSION;$('lang-select').onchange=e=>I18N.set(e.target.value);I18N.onChange(render);
$('clear-data').onclick=()=>{if(!confirm(t('clearConfirm')))return;try{Object.keys(localStorage).filter(k=>k.startsWith('integral-cards/')).forEach(k=>localStorage.removeItem(k));}catch{}location.reload();};
document.addEventListener('keydown',e=>{if(e.key==='?'&&!e.target.closest('input,textarea,select,[contenteditable="true"]')){e.preventDefault();openDialog('helpOverlay');}});
$('fullscreen-btn').hidden=!(document.documentElement.requestFullscreen||document.documentElement.webkitRequestFullscreen);
$('fullscreen-btn').onclick=async()=>{try{if(document.fullscreenElement||document.webkitFullscreenElement)await(document.exitFullscreen||document.webkitExitFullscreen).call(document);else await(document.documentElement.requestFullscreen||document.documentElement.webkitRequestFullscreen).call(document.documentElement);}catch{}};
document.addEventListener('fullscreenchange',render);document.addEventListener('webkitfullscreenchange',render);
reset();initQuickTips();
