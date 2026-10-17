(function(root){
'use strict';
const FACTORS=['2','3','4','x','x^2','x^3','sin(x)','cos(x)','log(x)','exp(x)'];
const LEVEL2_FACTORS=[...FACTORS,'sin(2*x)','cos(2*x)','sin(x^2)','cos(x^2)','log(x+1)','exp(2*x)'];
const OPS=['+','-','*','/'];
function pick(a,r){return a[Math.floor(r()*a.length)];}
function drawCount(r=Math.random){return 3+Math.floor(r()*5);}
function problemMode(mode,tokens){
 if(!mode||mode.kind!=='definite'||!tokens.some(s=>/^(sin|cos)\(/.test(s)))return mode;
 return {...mode,a:Math.PI/6,b:mode.b===3?Math.PI/2:Math.PI/3,aExact:'pi/6',bExact:mode.b===3?'pi/2':'pi/3',aLabel:'π/6',bLabel:mode.b===3?'π/2':'π/3'};
}
function pair(round,total,tokens,r=Math.random,level=1,functionNames=['sin','cos','log','exp']){
 if(round===0) return [0,1].map(()=>r()<.5?{kind:'indefinite'}:{kind:'definite',a:1,b:r()<.5?2:3});
 const permitted=s=>!s.includes('(')||functionNames.includes(s.slice(0,s.indexOf('(')));
 const pool=(level===2?LEVEL2_FACTORS:FACTORS).filter(permitted),composites=LEVEL2_FACTORS.slice(FACTORS.length).filter(permitted);
 if(level===2&&!composites.length)throw Error('Choose at least one function for level 2');
 if(level===2&&round===total-1&&!tokens.some(s=>composites.includes(s)))return [0,1].map(()=>pick(composites,r));
 const allow=round>1&&round<total-1&&!OPS.includes(tokens.at(-1));
 return [0,1].map(()=>allow&&r()<.30?pick(OPS,r):pick(pool,r));
}
function expression(tokens){
 if(!tokens.length||OPS.includes(tokens[0])||OPS.includes(tokens.at(-1)))throw Error('invalid');
 let terms=[],num=[],den=[],below=false,sign='';
 const flush=()=>{if(!num.length)throw Error('invalid'); terms.push(sign+'('+num.map(s=>'('+s+')').join('*')+')'+(den.length?'/('+den.map(s=>'('+s+')').join('*')+')':''));num=[];den=[];below=false;};
 tokens.forEach((s,i)=>{if(OPS.includes(s)&&OPS.includes(tokens[i-1]))throw Error('invalid');if(s==='+'||s==='-'){flush();sign=s;}else if(s==='/')below=!below;else if(s!=='*')(below?den:num).push(s);});flush();return terms.join('');
}
function displayTerms(tokens){
 // Fold the finite card vocabulary without changing calculation or domain checks.
 expression(tokens);
 const terms=[];let coefficient=1,denominator=1,powers={},below=false;
 const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);
 function flush(){const g=gcd(coefficient,denominator);terms.push({coefficient:coefficient/g,denominator:denominator/g,powers:{...powers}});coefficient=1;denominator=1;powers={};below=false;}
 for(const token of tokens){if(token==='+'||token==='-'){flush();coefficient=token==='-'?-1:1;}else if(token==='/')below=!below;else if(token!=='*'){
  if(/^\d+$/.test(token)){if(below)denominator*=Number(token);else coefficient*=Number(token);}
  else {const match=token.match(/^x(?:\^(\d+))?$/);const key=match?'x':token;const degree=match?Number(match[1]||1):1;powers[key]=(powers[key]||0)+(below?-degree:degree);}
 }}flush();
 const combined=new Map();
 for(const term of terms){term.powers=Object.fromEntries(Object.entries(term.powers).filter(([,p])=>p).sort(([a],[b])=>a.localeCompare(b)));const key=JSON.stringify(term.powers),old=combined.get(key);if(old){const num=old.coefficient*term.denominator+term.coefficient*old.denominator,den=old.denominator*term.denominator,g=gcd(num,den);old.coefficient=num/g;old.denominator=den/g;}else combined.set(key,term);}
 return [...combined.values()].filter(t=>t.coefficient!==0);
}
function normalize(raw){
 let s=raw.replace(/²/g,'^2').replace(/³/g,'^3').normalize('NFKC').replace(/−|–/g,'-').replace(/×|·/g,'*').replace(/÷/g,'/').replace(/π/g,'pi').replace(/\bln\b/g,'log').replace(/\bE\b/g,'e').replace(/\*\*/g,'^').trim();
 if(!s||s.length>300||! /^[0-9a-zA-Z+\-*/^().\s]+$/.test(s))throw Error('input');
 s=s.replace(/\bc\b/g,'C');
 const allowed=new Set(['x','C','pi','e','sin','cos','tan','cot','sec','csc','asin','acos','atan','sinh','cosh','tanh','log','exp','sqrt','abs']);
 for(const name of s.match(/[a-zA-Z]+/g)||[])if(!allowed.has(name))throw Error('input');
 if(/\^\s*\(?\s*\d{4,}/.test(s)|| (s.match(/\^/g)||[]).length>8)throw Error('input');
 return s;
}
function zero(n,s){try{return n(s).expand().toString()==='0'||n('simplify('+s+')').toString()==='0';}catch{return false;}}
function equal(n,a,b){
 if(zero(n,'('+a+')-('+b+')'))return true;
 const trig=s=>s.replace(/sin\(x\)\^2/g,'((1-cos(2*x))/2)').replace(/cos\(x\)\^2/g,'((1+cos(2*x))/2)');
 try{if(zero(n,'('+trig(n(a).expand().toString())+')-('+trig(n(b).expand().toString())+')'))return true;}catch{}
 try{return zero(n,'('+n(a).expand().toString()+')-('+n(b).expand().toString()+')');}catch{return false;}
}
function elementary(s){return !/integrate|erf|Ei\(|Si\(|Ci\(|Shi\(|Chi\(|gamma|hypergeometric|fresnel/i.test(s);}
function knownNonElementary(n,expr){
 for(const base of ['sin(x)/x','cos(x)/x','exp(x)/x','1/log(x)']){
  try{const ratio=n('('+expr+')/('+base+')').toString();if(!n(ratio).variables().includes('x')&&ratio!=='0')return true;}catch{}
 }return false;
}
// Positive bounds and this finite card vocabulary make these domain checks exhaustive.
function domain(tokens,mode){
 if(mode.kind!=='definite')return null;
 let below=false;
 for(const s of tokens){if(s==='+'||s==='-')below=false;else if(s==='/')below=!below;
  else if(below){const match=s.match(/^(sin|cos|log)\((.*)\)$/);if(!match)continue;
   const argument=x=>match[2]==='2*x'?2*x:match[2]==='x^2'?x*x:match[2]==='x+1'?x+1:x;
   const a=argument(mode.a),b=argument(mode.b);
   if(match[1]==='log'&&a<=1&&b>=1)return 'improper';
   if(match[1]==='sin'&&Math.ceil(a/Math.PI)*Math.PI<=b)return 'improper';
   if(match[1]==='cos'&&Math.ceil((a-Math.PI/2)/Math.PI)*Math.PI+Math.PI/2<=b)return 'improper';
  }
 }return null;
}
function solve(n,tokens,mode){
 const expr=expression(tokens),bad=domain(tokens,mode);
 if(bad)return {status:'improper',expr};
 let primitive;try{primitive=n.integrate(expr,'x').toString();}catch{return {status:knownNonElementary(n,expr)?'nonElementary':'unknown',expr};}
 if(!elementary(primitive))return {status:knownNonElementary(n,expr)?'nonElementary':'unknown',expr};
 if(!equal(n,n.diff(primitive,'x').toString(),expr))return {status:'unknown',expr};
 if(mode.kind==='indefinite')return {status:'solved',expr,primitive,answer:primitive+'+C'};
 try{const answer=n(primitive,{x:mode.bExact??mode.b}).subtract(n(primitive,{x:mode.aExact??mode.a})).toString();if(/NaN|Infinity|undefined|\bi\b/.test(answer))return {status:'unknown',expr};return {status:'solved',expr,primitive,answer};}catch{return {status:'unknown',expr};}
}
function grade(n,tokens,mode,raw){
 const solution=solve(n,tokens,mode);
 if(raw==='NON_ELEMENTARY')return {...solution,verdict:solution.status==='nonElementary'?'correct':solution.status==='solved'?'wrong':'unknown'};
 let s;try{s=normalize(raw);n(s);}catch{return {...solution,verdict:'input'};}
 if(mode.kind==='indefinite'){
  if(!n(s).variables().includes('C'))return {...solution,verdict:'constant'};
  if(!equal(n,n.diff(s,'C').toString(),'1'))return {...solution,verdict:'constant'};
  let derivative=n.diff(s,'x').toString();
  if(equal(n,derivative,solution.expr))return {...solution,verdict:'correct'};
  // Second pass: canonical trigonometric identities, then symbolic simplification.
  const rewrite=v=>v.replace(/sin\(x\)\^2/g,'(1-cos(2*x))/2').replace(/cos\(x\)\^2/g,'(1+cos(2*x))/2');
  if(equal(n,rewrite(derivative),rewrite(solution.expr)))return {...solution,verdict:'correct'};
  // Numerical counterexamples can disprove equality; they never prove it.
  let count=0;
  for(const x of [.37,.71,1.23,1.81,2.49,3.17])try{const a=Number(n(derivative,{x,C:0}).evaluate().text()),b=Number(n(solution.expr,{x}).evaluate().text());if(Number.isFinite(a)&&Number.isFinite(b)){count++;if(Math.abs(a-b)>1e-7*(1+Math.abs(b)))return {...solution,verdict:'wrong'};}}catch{}
  return {...solution,verdict:'unknown'};
 }
 if(n(s).variables().length)return {...solution,verdict:'input'};
 if(solution.status!=='solved')return {...solution,verdict:'unknown'};
 if(equal(n,s,solution.answer))return {...solution,verdict:'correct'};
 const a=Number(n(s).evaluate().text()),b=Number(n(solution.answer).evaluate().text());
 return {...solution,verdict:Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)>1e-8*(1+Math.abs(b))?'wrong':'unknown'};
}
const api={FACTORS,LEVEL2_FACTORS,OPS,drawCount,pair,problemMode,expression,displayTerms,normalize,solve,grade,domain};
if(typeof module!=='undefined')module.exports=api;else root.IntegralEngine=api;
})(typeof self!=='undefined'?self:this);
