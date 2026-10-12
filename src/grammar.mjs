/** HĒLIX / HGL-1: typed, world-indexed, perspectival relational hypergraphs.
 * No privileged closed-world model. Facts are statements, not guaranteed reality.
 * No semantic equivalence to neural embeddings is asserted.
 */
export const VERSION = 'HGL1';
export const SORTS = Object.freeze(['entity','event','quality','observer','world']);
export const OP = Object.freeze({
  ROLE:{glyph:'↦',arity:['event','entity'],attrs:{role:'string'}},
  BEFORE:{glyph:'≺',arity:['event','event']},
  CAUSES:{glyph:'⇒',arity:['event','event']},
  SIMILAR:{glyph:'≈',arity:['any','any'],attrs:{degree:'unit'}},
  PERCEIVES:{glyph:'∠',arity:['observer','event']},
  REMEMBERS:{glyph:'◉',arity:['observer','event']},
  ANTICIPATES:{glyph:'⌁',arity:['observer','event']},
  IN_WORLD:{glyph:'◇',arity:['event','world']},
  QUALITY:{glyph:'◐',arity:['event','quality']},
  AFFECT:{glyph:'♥',arity:['observer','event'],attrs:{valence:'signed',arousal:'unit'}},
  ASSOCIATES:{glyph:'∼',arity:['event','event']},
  BELIEVES:{glyph:'∠',arity:['observer','fact']},
  UNCERTAIN:{glyph:'?',arity:['observer','fact'],attrs:{confidence:'unit'}},
  CONTRASTS:{glyph:'⇎',arity:['fact','fact']},
  POSSIBLE:{glyph:'⊞',arity:['observer','world']}
});
const MAX = {symbols:600,facts:2400,views:100,abstractions:200};
const isObject = x => x!==null && typeof x==='object' && !Array.isArray(x);
const sorted = (xs) => [...xs].sort((a,b)=>a.id.localeCompare(b.id));
const validId=x=>typeof x==='string'&&/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(x);
const finite=(x,min,max)=>typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max;
const text=(x,max=4096)=>typeof x==='string'&&x.length<=max;
function assert(ok,message){if(!ok)throw new Error(message)}
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function keysOnly(o,keys,label){for(const k of Object.keys(o))assert(keys.includes(k),`${label}: unsupported key ${k}`)}
function attrsCopy(attrs,spec,label){
  assert(isObject(attrs),`${label}: attrs must be an object`);
  keysOnly(attrs,Object.keys(spec),label); const out={};
  for(const [key,type] of Object.entries(spec)){
    const v=attrs[key]; assert(v!==undefined,`${label}: missing attr ${key}`);
    assert(type==='string'?text(v,256):type==='unit'?finite(v,0,1):finite(v,-1,1),`${label}: invalid attr ${key}`);
    out[key]=v;
  }return out;
}
function normalizeSymbol(s){
  assert(isObject(s),'symbol object required');keysOnly(s,['id','sort','label','time','valence','salience','branch'],`symbol ${s.id}`);
  assert(validId(s.id),`invalid symbol id ${String(s.id)}`);
  assert(SORTS.includes(s.sort),`invalid sort at ${s.id}`);
  assert(text(s.label,240),`invalid label at ${s.id}`);
  const o={id:s.id,sort:s.sort,label:s.label};
  if(s.time!==undefined){assert(s.sort==='event'&&finite(s.time,-10000,10000),`invalid temporal coordinate at ${s.id}`);o.time=s.time}
  if(s.valence!==undefined){assert(s.sort==='event'&&finite(s.valence,-1,1),`invalid valence at ${s.id}`);o.valence=s.valence}
  if(s.salience!==undefined){assert(s.sort==='event'&&finite(s.salience,0,1),`invalid salience at ${s.id}`);o.salience=s.salience}
  if(s.branch!==undefined){assert(s.sort==='event'&&validId(s.branch),`invalid branch at ${s.id}`);o.branch=s.branch}
  return o;
}
function normalizeFact(f, symbols, facts){
  assert(isObject(f),'fact object required');keysOnly(f,['id','op','args','attrs','world','observer'],`fact ${f.id}`);
  assert(validId(f.id),`invalid fact id ${f.id}`);assert(OP[f.op],`unknown operation ${f.op}`);
  const definition=OP[f.op];assert(Array.isArray(f.args)&&f.args.length===definition.arity.length,`${f.id}: arity mismatch`);
  const args=f.args.map((v,i)=>{assert(validId(v),`${f.id}: invalid operand id`);const sort=definition.arity[i];
    if(sort==='fact')assert(facts.has(v),`${f.id}: unresolved fact operand ${v}`);
    else {assert(symbols.has(v),`${f.id}: unknown symbol ${v}`);if(sort!=='any')assert(symbols.get(v).sort===sort,`${f.id}: operand ${v} must be ${sort}`)}return v});
  const out={id:f.id,op:f.op,args};
  out.attrs=attrsCopy(f.attrs??{},definition.attrs??{},f.id);
  if(f.world!==undefined){assert(symbols.get(f.world)?.sort==='world',`${f.id}: world must reference a world symbol`);out.world=f.world}
  if(f.observer!==undefined){assert(symbols.get(f.observer)?.sort==='observer',`${f.id}: observer must reference observer symbol`);out.observer=f.observer}
  return out;
}
export function normalize(input){
  assert(isObject(input),'document must be object');keysOnly(input,['version','title','now','symbols','facts','views','abstractions'],'document');
  assert(input.version===VERSION,`expected document version ${VERSION}`);assert(text(input.title??'',300),'invalid title');
  assert(finite(input.now??0,-10000,10000),'invalid now');
  const symbols0=input.symbols??[], facts0=input.facts??[], views0=input.views??[], abstractions0=input.abstractions??[];
  for(const [name,arr] of Object.entries({symbols:symbols0,facts:facts0,views:views0,abstractions:abstractions0}))assert(Array.isArray(arr)&&arr.length<=MAX[name],`invalid or excessive ${name}`);
  const symbols=sorted(symbols0.map(normalizeSymbol)),sm=new Map(symbols.map(s=>[s.id,s]));assert(sm.size===symbols.length,'duplicate symbol ID');
  const fm=new Set();for(const f of facts0){assert(validId(f?.id)&&!fm.has(f.id),`duplicate or invalid fact ID ${f?.id}`);fm.add(f.id)}
  const facts=sorted(facts0.map(f=>normalizeFact(f,sm,fm)));
  const views=sorted(views0.map(v=>{assert(isObject(v)&&validId(v.id),'invalid view');keysOnly(v,['id','observer','worlds','include','kinds'],'view');
    assert(sm.get(v.observer)?.sort==='observer',`view ${v.id}: invalid observer`);
    const worlds=v.worlds??[],include=v.include??[],kinds=v.kinds??[];
    assert(Array.isArray(worlds)&&Array.isArray(include)&&Array.isArray(kinds),'invalid view masks');
    worlds.forEach(w=>assert(sm.get(w)?.sort==='world',`view ${v.id}: unknown world ${w}`));
    include.forEach(f=>assert(fm.has(f),`view ${v.id}: unknown fact ${f}`));
    kinds.forEach(op=>assert(OP[op],`view ${v.id}: unknown kind ${op}`));
    return{id:v.id,observer:v.observer,worlds:[...new Set(worlds)].sort(),include:[...new Set(include)].sort(),kinds:[...new Set(kinds)].sort()}}));
  assert(new Set(views.map(v=>v.id)).size===views.length,'duplicate view ID');
  const abstractions=sorted(abstractions0.map(a=>{
    assert(isObject(a)&&validId(a.id),'invalid abstraction');keysOnly(a,['id','specific','general'],'abstraction');
    assert(sm.has(a.specific)&&sm.has(a.general),`abstraction ${a.id}: unknown symbol`);
    assert(sm.get(a.specific).sort===sm.get(a.general).sort,`abstraction ${a.id}: sorts differ`);
    return {id:a.id,specific:a.specific,general:a.general};
  }));assert(new Set(abstractions.map(a=>a.id)).size===abstractions.length,'duplicate abstraction ID');
  return {version:VERSION,title:input.title??'',now:input.now??0,symbols,facts,views,abstractions};
}
export function canonical(input){return JSON.stringify(normalize(input))}
export function encode(input){const d=normalize(input);return [`⟦ ${VERSION}`,`TITLE ${JSON.stringify(d.title)}`,`NOW ${d.now}`,...d.symbols.map(x=>`● ${JSON.stringify(x)}`),...d.facts.map(x=>`◆ ${JSON.stringify(x)}`),...d.views.map(x=>`⌖ ${JSON.stringify(x)}`),...d.abstractions.map(x=>`↑ ${JSON.stringify(x)}`),'⟧'].join('\n')}
export function decode(source){
  assert(typeof source==='string'&&source.length<=2000000,'invalid source size');
  const lines=source.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);assert(lines[0]===`⟦ ${VERSION}`&&lines.at(-1)==='⟧','expected HGL1 scope');
  const d={version:VERSION,title:'',now:0,symbols:[],facts:[],views:[],abstractions:[]};const seen=new Set();
  for(const line of lines.slice(1,-1)){
    const space=line.indexOf(' ');assert(space>=1,'missing record separator');
    const tag=line.slice(0,space),raw=line.slice(space+1);
    if(tag==='TITLE'||tag==='NOW'){assert(!seen.has(tag),`duplicate ${tag}`);seen.add(tag);d[tag==='TITLE'?'title':'now']=tag==='TITLE'?JSON.parse(raw):Number(raw);continue}
    const prop={'●':'symbols','◆':'facts','⌖':'views','↑':'abstractions'}[tag];assert(prop,`unknown record type ${tag}`);d[prop].push(JSON.parse(raw));
  }return normalize(d);
}
export const overlay=(a,b)=>{
  a=normalize(a);b=normalize(b);assert(a.now===b.now,'overlay requires same temporal reference');
  const combine=(xs,ys,name)=>{const map=new Map(xs.map(x=>[x.id,x]));for(const y of ys){const x=map.get(y.id);if(x)assert(same(x,y),`collision in ${name}: ${y.id}`);else map.set(y.id,y)}return [...map.values()]};
  return normalize({...a,title:a.title===b.title?a.title:'',symbols:combine(a.symbols,b.symbols,'symbols'),facts:combine(a.facts,b.facts,'facts'),views:combine(a.views,b.views,'views'),abstractions:combine(a.abstractions,b.abstractions,'abstractions')});
};
/** A view does not claim that its selection is the full truth about the observer. */
export function project(input,viewId){const d=normalize(input),view=d.views.find(v=>v.id===viewId);assert(view,`no view ${viewId}`);const included=d.facts.filter(f=>
  (!view.include.length||view.include.includes(f.id))&&
  (!view.kinds.length||view.kinds.includes(f.op))&&
  (!view.worlds.length||f.world===undefined||view.worlds.includes(f.world))&&
  (f.observer===undefined||f.observer===view.observer)
 );
 // Statements that quote other statements are admitted only if their referenced facts remain in scope.
 // Repeat to a fixed point, because references can be nested.
 const chosen=new Map(included.map(f=>[f.id,f]));let changed=true;while(changed){changed=false;for(const f of [...chosen.values()]){if(f.args.some((id,i)=>OP[f.op].arity[i]==='fact'&&!chosen.has(id))){chosen.delete(f.id);changed=true}}}
 return {...d,facts:[...chosen.values()],views:d.views.map(v=>({...v,include:v.include.filter(id=>chosen.has(id))}))};}
/** coarsens symbol references while keeping typed sorts; identities of facts retained. */
export function abstractUp(input){const d=normalize(input),mapping=new Map(d.abstractions.map(a=>[a.specific,a.general]));
  const chase=(id)=>{const seen=new Set();while(mapping.has(id)){assert(!seen.has(id),`cyclic abstraction at ${id}`);seen.add(id);id=mapping.get(id)}return id};
  const facts=d.facts.map(f=>({...f,args:f.args.map((id,i)=>OP[f.op].arity[i]==='fact'?id:chase(id)),world:f.world?chase(f.world):undefined,observer:f.observer?chase(f.observer):undefined}));
  return normalize({...d,facts});}
/** possible refinements, not claimed unique; returns all known concrete children. */
export function refinements(input,general){const d=normalize(input);const out=new Set([general]);let changed=true;while(changed){changed=false;for(const a of d.abstractions){if(out.has(a.general)&&!out.has(a.specific)){out.add(a.specific);changed=true}}}return [...out].sort()}
/** Full-coverage projection reconstruction without inventing excluded facts. */
export function reconstruct(input,viewIds){const d=normalize(input);const covered=new Map();for(const id of viewIds){for(const f of project(d,id).facts)covered.set(f.id,f)}const unseen=d.facts.filter(f=>!covered.has(f.id)).map(f=>f.id);return{observed:[...covered.values()].sort((a,b)=>a.id.localeCompare(b.id)),unseen,complete:unseen.length===0}}
/** Partial sections: local assignments. Unique gluing only under coverage+agreement. */
export function glue(sections,universe){
  const global=new Map(), conflicts=[];for(const section of sections){for(const [key,value] of Object.entries(section)){if(global.has(key)&&!same(global.get(key),value))conflicts.push(key);else global.set(key,value)}}
  const missing=universe.filter(k=>!global.has(k));return{status:conflicts.length?'inconsistent':missing.length?'ambiguous':'unique',assignment:Object.fromEntries(global),conflicts:[...new Set(conflicts)].sort(),missing};
}
/** Finite relational constraints may be locally possible but globally obstructed. */
export function relationalSolutions(variables,domains,constraints){
  assert(variables.length<=15,'too many variables for exhaustive search');const out=[];const rec=(index,assignment)=>{if(index===variables.length){if(constraints.every(c=>c(assignment)))out.push({...assignment});return}const name=variables[index];for(const value of domains[name]??[]){assignment[name]=value;rec(index+1,assignment)}};rec(0,{});return out;
}
export function toInstrumentScene(input){
 const d=normalize(input), observer=d.symbols.find(s=>s.sort==='observer')?.label||'A situated voice', events=d.symbols.filter(s=>s.sort==='event');
 const worldIds=d.symbols.filter(s=>s.sort==='world').map(s=>s.id);assert(worldIds.length<=2,'musical instrument currently supports at most two named alternative worlds; HGL grammar supports any number');const branchName=new Map(worldIds.map((id,i)=>[id,i===0?'A':i===1?'B':'shared']));
 const edges=[],nodes=events.map((s)=>({id:s.id,label:s.label,t:Math.max(-4,Math.min(4,s.time??0)),stance:'imagined',branch:branchName.get(s.branch)||'shared',level:d.abstractions.some(a=>a.general===s.id)?'abstract':'concrete',valence:s.valence??0,salience:s.salience??0.65}));
 const byId=new Map(nodes.map(n=>[n.id,n]));for(const f of d.facts){
  if(f.op==='REMEMBERS'||f.op==='ANTICIPATES'||f.op==='PERCEIVES'){const n=byId.get(f.args[1]);if(n)n.stance={REMEMBERS:'remembered',ANTICIPATES:'anticipated',PERCEIVES:'present'}[f.op]}
  if(f.op==='IN_WORLD'){const n=byId.get(f.args[0]);if(n)n.branch=branchName.get(f.args[1])||'shared'}
  if(f.op==='AFFECT'){const n=byId.get(f.args[1]);if(n)n.valence=f.attrs.valence}
  if(['CAUSES','BEFORE','ASSOCIATES','SIMILAR'].includes(f.op)&&byId.has(f.args[0])&&byId.has(f.args[1]))edges.push({from:f.args[0],to:f.args[1],kind:{CAUSES:'instantiates',BEFORE:'anticipates',ASSOCIATES:'echoes',SIMILAR:'reframes'}[f.op]});
 }
 return {observer,idea:d.title||'An open experience',meaning:'A situated chord, not a privileged world model.',now:Math.max(-4,Math.min(4,d.now)),notes:nodes,edges};
}
export function example(){return normalize({version:VERSION,title:'The chord at the threshold',now:0,symbols:[
{id:'self',sort:'observer',label:'A person choosing to create'},
{id:'seed',sort:'event',label:'An idea appears',time:-3,valence:.7,salience:.8},
{id:'attempt',sort:'event',label:'Building in the present',time:0,valence:.4,salience:1},
{id:'arrival',sort:'event',label:'A shared future is built',time:3,valence:.9,salience:.9},
{id:'silence',sort:'event',label:'The idea remains unshared',time:3,valence:-.7,salience:.65},
{id:'meaning',sort:'event',label:'Making something possible',time:0,valence:.6,salience:.9},
{id:'futureA',sort:'world',label:'Possible continuation A'},
{id:'futureB',sort:'world',label:'Possible continuation B'},
{id:'community',sort:'entity',label:'The community'},
{id:'hope',sort:'quality',label:'Hope'}],facts:[
{id:'f01',op:'BEFORE',args:['seed','attempt']},
{id:'f02',op:'BEFORE',args:['attempt','arrival'],world:'futureA'},
{id:'f03',op:'BEFORE',args:['attempt','silence'],world:'futureB'},
{id:'f04',op:'CAUSES',args:['seed','attempt'],observer:'self'},
{id:'f05',op:'ANTICIPATES',args:['self','arrival'],world:'futureA'},
{id:'f06',op:'ANTICIPATES',args:['self','silence'],world:'futureB'},
{id:'f07',op:'IN_WORLD',args:['arrival','futureA']},
{id:'f08',op:'IN_WORLD',args:['silence','futureB']},
{id:'f09',op:'ROLE',args:['arrival','community'],attrs:{role:'beneficiary'}},
{id:'f10',op:'QUALITY',args:['attempt','hope']},
{id:'f11',op:'AFFECT',args:['self','attempt'],attrs:{valence:.4,arousal:.8}},
{id:'f12',op:'POSSIBLE',args:['self','futureA']},
{id:'f13',op:'POSSIBLE',args:['self','futureB']},
{id:'f14',op:'ASSOCIATES',args:['seed','meaning']},
{id:'f15',op:'UNCERTAIN',args:['self','f05'],attrs:{confidence:.5}}
],views:[{id:'inner',observer:'self',include:[],kinds:[],worlds:[]},{id:'possibilityA',observer:'self',worlds:['futureA'],include:[],kinds:[]}],abstractions:[{id:'a1',specific:'attempt',general:'meaning'}]})}
