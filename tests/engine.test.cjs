const {test}=require('node:test'),assert=require('node:assert/strict');
const E=require('../engine.js'),n=require('../vendor/package/all.js');
const ind={kind:'indefinite'},def={kind:'definite',a:1,b:2};
test('function selection filters cards and preserves the level two guarantee',()=>{
 for(const names of [[],['sin'],['cos'],['log'],['exp'],['sin','log']])for(const level of [1,2]){if(level===2&&!names.length)continue;for(let run=0;run<40;run++){const tokens=[];for(let round=1;round<7;round++){const choices=E.pair(round,7,tokens,Math.random,level,names);for(const card of choices)if(card.includes('('))assert.ok(names.includes(card.slice(0,card.indexOf('('))));tokens.push(choices[run%2]);}if(level===2)assert.ok(tokens.some(s=>E.LEVEL2_FACTORS.includes(s)&&!E.FACTORS.includes(s)));}}
 assert.throws(()=>E.pair(1,3,[],Math.random,2,[]));
});
test('level two always includes a composite card along either selection path',()=>{
 for(let run=0;run<300;run++){const count=3+run%5,tokens=[];for(let round=1;round<count;round++){const choices=E.pair(round,count,tokens,Math.random,2);if(round===count-1&&!tokens.some(s=>E.LEVEL2_FACTORS.includes(s)&&!E.FACTORS.includes(s)))assert.ok(choices.every(s=>E.LEVEL2_FACTORS.includes(s)&&!E.FACTORS.includes(s)));tokens.push(choices[run%2]);}assert.ok(tokens.some(s=>E.LEVEL2_FACTORS.includes(s)&&!E.FACTORS.includes(s)));}
});
test('random counts range uniformly from three to seven and eligible operators are 30%',()=>{
 for(let i=0;i<5;i++)assert.equal(E.drawCount(()=>(i+.5)/5),3+i);assert.equal(E.drawCount(()=>0),3);assert.equal(E.drawCount(()=>.999999),7);
 assert.ok(E.pair(2,6,['x'],()=>.299).every(s=>E.OPS.includes(s)));
 assert.ok(E.pair(2,6,['x'],()=>.30).every(s=>E.FACTORS.includes(s)));
 assert.ok(E.pair(5,6,['x'],()=>.1).every(s=>E.FACTORS.includes(s)));
});
test('trigonometric cards use exact pi bounds for display and calculation',()=>{
 const m=E.problemMode(def,['sin(x)']);assert.equal(m.aLabel,'π/6');assert.equal(m.bLabel,'π/3');
 assert.equal(E.grade(n,['sin(x)'],m,'(sqrt(3)-1)/2').verdict,'correct');
 assert.equal(E.problemMode({...def,b:3},['cos(x^2)']).bExact,'pi/2');
 assert.equal(E.problemMode(def,['x']),def);assert.equal(E.problemMode(ind,['sin(x)']),ind);
 assert.equal(E.solve(n,['1','/','cos(x)'],E.problemMode({...def,b:3},['1','/','cos(x)'])).status,'improper');
});
test('level two cards, chain rule and composed singularities',()=>{
 assert.ok(E.pair(1,6,[],()=>.99,2).every(s=>s==='exp(2*x)'));
 assert.equal(E.grade(n,['sin(2*x)'],ind,'-cos(2*x)/2+c').verdict,'correct');
 assert.equal(E.grade(n,['2','x','cos(x^2)'],ind,'sin(x^2)+C').verdict,'correct');
 assert.equal(E.solve(n,['1','/','sin(2*x)'],def).status,'improper');
 assert.equal(E.solve(n,['1','/','cos(x^2)'],def).status,'improper');
 assert.equal(E.domain(['1','/','log(x+1)'],def),null);
});
test('display folds constants, powers, fractions and like terms',()=>{
 assert.deepEqual(E.displayTerms(['x^2','x^3','x','4']),[{coefficient:4,denominator:1,powers:{x:6}}]);
 assert.deepEqual(E.displayTerms(['x','/','2','sin(x)','/','x']),[{coefficient:1,denominator:2,powers:{'sin(x)':-1,x:2}}]);
 assert.deepEqual(E.displayTerms(['x','+','2','x']),[{coefficient:3,denominator:1,powers:{x:1}}]);
 assert.deepEqual(E.displayTerms(['x','-','x']),[]);
 assert.deepEqual(E.displayTerms(['2','/','4','x']),[{coefficient:1,denominator:2,powers:{x:-1}}]);
});
test('implicit products and denominator toggle',()=>{assert.equal(n(E.expression(['x','/','2','sin(x)','/','x'])).toString(),n('x^2/(2*sin(x))').toString());assert.equal(n(E.expression(['x','/','2','+','3'])).toString(),n('x/2+3').toString());});
test('card generation: 3–6 rounds, no adjacent or terminal operators',()=>{for(let run=0;run<500;run++){let tokens=[],total=3+run%4;for(let r=0;r<total;r++){const choices=E.pair(r,total,tokens);assert.equal(choices.length,2);if(r){for(const c of choices){assert.ok(E.FACTORS.includes(c)||E.OPS.includes(c));if(r===1||r===total-1||E.OPS.includes(tokens.at(-1)))assert.ok(!E.OPS.includes(c));}tokens.push(choices[run%2]);}}assert.doesNotThrow(()=>E.expression(tokens));}});
test('elementary primitives verified',()=>{for(const ts of [['x'],['2','x^3'],['sin(x)'],['cos(x)'],['exp(x)'],['log(x)'],['sin(x)','sin(x)']])assert.equal(E.solve(n,ts,ind).status,'solved',ts.join(' '));});
test('correct alternative forms, absolute logarithm',()=>{for(const [ts,a]of [[['x'],'x*x/2+C'],[['2','sin(x)','cos(x)'],'sin(x)^2+C'],[['1','/','x'],'ln(abs(x))+C']])assert.equal(E.grade(n,ts,ind,a).verdict,'correct');});
test('incorrect answers get counterexamples after symbolic recheck',()=>assert.equal(E.grade(n,['x'],ind,'2*x+C').verdict,'wrong'));
test('lowercase c is accepted without altering function names',()=>{assert.equal(E.grade(n,['x'],ind,'x^2/2+c').verdict,'correct');assert.equal(E.grade(n,['sin(x)'],ind,'-cos(x)+c').verdict,'correct');assert.equal(E.grade(n,['x'],ind,'c*x^2/2').verdict,'constant');});
test('integration constant must be an independent additive C',()=>{for(const a of ['x^2/2','C*x^2/2','x^2/2+C^2'])assert.equal(E.grade(n,['x'],ind,a).verdict,'constant');});
test('definite exact answer',()=>{assert.equal(E.grade(n,['x'],def,'3/2').verdict,'correct');assert.equal(E.grade(n,['x'],def,'2').verdict,'wrong');assert.equal(E.grade(n,['x'],def,'3/2+C').verdict,'input');});
test('non-elementary is distinct from engine failure',()=>{for(const ts of [['sin(x)','/','x'],['cos(x)','/','x'],['exp(x)','/','x'],['1','/','log(x)']])assert.equal(E.solve(n,ts,ind).status,'nonElementary');assert.equal(E.grade(n,['sin(x)','/','x'],ind,'NON_ELEMENTARY').verdict,'correct');assert.equal(E.grade(n,['x'],ind,'NON_ELEMENTARY').verdict,'wrong');});
test('singularities are not evaluated by endpoint subtraction',()=>{assert.equal(E.solve(n,['1','/','cos(x)'],def).status,'improper');assert.equal(E.solve(n,['1','/','log(x)'],def).status,'improper');});
test('input allowlist and complexity caps',()=>{for(const s of ['integrate(x,x)','alert(1)','x;1','x^99999','y+C','constructor(1)'])assert.throws(()=>E.normalize(s));assert.equal(E.normalize('ｘ²＋Ｃ'),'x^2+C');});
test('Japanese and English dictionary keys match',()=>{const vm=require('node:vm'),fs=require('fs');const ctx={window:{}};vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../strings.js'),'utf8'),ctx);assert.deepEqual(Object.keys(ctx.window.STRINGS.ja).sort(),Object.keys(ctx.window.STRINGS.en).sort());});
