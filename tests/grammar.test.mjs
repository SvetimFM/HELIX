import test from 'node:test';
import assert from 'node:assert/strict';
import {VERSION,OP,SORTS,example,normalize,canonical,encode,decode,overlay,project,abstractUp,refinements,reconstruct,glue,relationalSolutions,toInstrumentScene} from '../src/grammar.mjs';
const copy = x=>JSON.parse(JSON.stringify(x));
function throws(f,part){assert.throws(f,e=>e.message.includes(part),part)}
test('alphabet implements all declared operators as typed relations',()=>{
 assert.equal(SORTS.length,5);assert.ok(Object.keys(OP).length>=15);
 for(const [name,o] of Object.entries(OP)){assert.equal(o.arity.length,2,name);assert.ok(o.glyph)}
});
test('canonical round-trip: 2,000 shuffled equivalent documents',()=>{
 const base=example(),serialized=canonical(base);
 for(let i=0;i<2000;i++){
  const d=copy(base);
  for(const key of ['symbols','facts','views','abstractions']){if(i%2)d[key].reverse();else d[key].sort((a,b)=>((a.id.charCodeAt(0)+i)%3)-((b.id.charCodeAt(0)+i)%3))}
  assert.equal(canonical(decode(encode(d))),serialized);
 }
});
test('malformed and mismatched types rejected',()=>{
 const s=example();
 throws(()=>normalize({...s,symbols:[...s.symbols,{id:'seed',sort:'entity',label:'duplicate'}]}),'duplicate');
 throws(()=>normalize({...s,facts:[...s.facts,{id:'bad',op:'BEFORE',args:['self','seed']}]}),'must be event');
 throws(()=>decode(encode(s).replace('⟦ HGL1','⟦ MAL')),'expected HGL1');
 throws(()=>normalize({...s,facts:[...s.facts,{id:'extra',op:'UNCERTAIN',args:['self','f01'],attrs:{confidence:1.2}}]}),'invalid attr');
});
test('overlays of shared ontology obey ACI laws on symbolic facts',()=>{
 const e=example(),a=normalize({...e,facts:e.facts.slice(0,5)}),b=normalize({...e,facts:e.facts.slice(3,8)}),c=normalize({...e,facts:e.facts.slice(7,14)});
 assert.equal(canonical(overlay(a,a)),canonical(a),'idempotence');
 assert.equal(canonical(overlay(a,b)),canonical(overlay(b,a)),'commutativity');
 assert.equal(canonical(overlay(overlay(a,b),c)),canonical(overlay(a,overlay(b,c))),'associativity');
 throws(()=>overlay(a,{...b,symbols:b.symbols.map(s=>s.id==='seed'?{...s,label:'different'}:s)}),'collision');
});
test('view projections are idempotent and preserve only authored facts',()=>{
 const s=example(),p=project(s,'possibilityA');
 assert.ok(p.facts.length<=s.facts.length);
 assert.equal(canonical(project(p,'possibilityA')),canonical(p));
 assert.ok(p.facts.every(f=>s.facts.some(g=>g.id===f.id)));
 assert.ok(!p.facts.some(f=>f.world==='futureB'));
});
test('focus distributes over overlay with same declarations',()=>{
 const s=example(),a=normalize({...s,facts:s.facts.slice(0,8)}),b=normalize({...s,facts:s.facts.slice(8,14)});
 assert.equal(canonical(project(overlay(a,b),'possibilityA')),canonical(overlay(project(a,'possibilityA'),project(b,'possibilityA'))));
});
test('abstraction changes representational target without inventing facts',()=>{
 const s=example(),up=abstractUp(s);const fact=up.facts.find(f=>f.id==='f01');assert.equal(fact.args[1],'meaning');
 assert.deepEqual(refinements(s,'meaning'),['attempt','meaning']);
 assert.equal(up.facts.length,s.facts.length);
});
test('coverage exposes missing facts but does not infer them',()=>{
 const s=example();const r=reconstruct(s,['possibilityA']);
 assert.equal(r.complete,false);assert.ok(r.unseen.length>0);
 const all=reconstruct(s,['inner']);assert.ok(all.observed.every(f=>f.observer===undefined||f.observer==='self'));
});
test('local-to-global gluing distinguishes unique/ambiguous/inconsistent',()=>{
 assert.equal(glue([{x:1},{y:0,x:1}],['x','y']).status,'unique');
 assert.equal(glue([{x:1}],['x','y']).status,'ambiguous');
 assert.equal(glue([{x:1},{x:0}],['x']).status,'inconsistent');
});
test('locally satisfiable odd cycle has no global assignment',()=>{
 const x=['a','b','c'];const ds=Object.fromEntries(x.map(k=>[k,[0,1]]));
 const constraints=[a=>a.a!==a.b,a=>a.b!==a.c,a=>a.a!==a.c];
 assert.equal(relationalSolutions(x,ds,constraints).length,0);
 assert.equal(relationalSolutions(['a','b'],ds,[a=>a.a!==a.b]).length,2);
});
test('open worlds remain open under sonification',()=>{
 const s=example(),m=toInstrumentScene(s);assert.equal(m.notes.length,5);assert.ok(m.notes.some(n=>n.branch==='A'));assert.ok(m.notes.some(n=>n.branch==='B'));
 assert.ok(m.edges.length>=2);
});
test('untrusted JSON cannot inject arbitrary unknown keys into model',()=>{
 const s=example();throws(()=>normalize({...s,evil:'payload'}),'unsupported key');
 throws(()=>normalize({...s,facts:[...s.facts,{id:'z1',op:'BEFORE',args:['seed','arrival'],secret:1}]}),'unsupported key');
});

test('projection removes out-of-scope quoted statements without dangling fact references',()=>{
 const d=example();d.views.push({id:'exclude_quote',observer:'self',worlds:[],include:['f15'],kinds:[]});
 const p=project(d,'exclude_quote');assert.equal(p.facts.length,0);assert.doesNotThrow(()=>normalize(p));
});
