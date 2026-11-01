const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function boot(seed){
 const dom=new Map(),events={},storage=new Map(seed?[['ember-below-v1',JSON.stringify(seed)]]:[]);let frame,time=0;
 const gradient={addColorStop(){}};const ctx=new Proxy({createRadialGradient:()=>gradient}, {get:(o,k)=>o[k]||(()=>{})});
 function element(id){if(!dom.has(id))dom.set(id,{id,parentElement:{getBoundingClientRect:()=>({width:1000,height:640})},style:{},dataset:{},classList:{add(){},remove(){},toggle(){}},hidden:false,textContent:'',innerHTML:'',getContext:()=>ctx,getBoundingClientRect:()=>({width:1000,height:640}),querySelectorAll:()=>[],querySelector:()=>element(id+"-span"),focus(){},firstElementChild:{style:{}},setPointerCapture(){}});return dom.get(id)}
 const doc={getElementById:element,querySelectorAll:()=>[],addEventListener:(k,f)=>events[k]=f,hidden:false,activeElement:element('body')};
 const sandbox={document:doc,window:{addEventListener(){}},Image:class {constructor(){this.complete=true;this.naturalWidth=this.naturalHeight=1254}set src(s){queueMicrotask(()=>this.onload())}},ResizeObserver:class{constructor(f){this.f=f}observe(){this.f()}},devicePixelRatio:1,requestAnimationFrame:f=>frame=f,setTimeout:()=>0,clearTimeout(){},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},console,Math};
 vm.runInNewContext(fs.readFileSync('docs/game.js','utf8').replace('// Read-only diagnostic', 'window._combatTest={catalogue:()=>({weapons:WEAPONS,armors:ARMOR,accessories:ACCESSORIES,traits:TRAITS,skills:SKILLS,sets:SETS}),quests:()=>QUESTS,enemy,hurtEnemy,attack,update,resolveEnemyAttack,state:()=>state,objects:()=>objects,enterRegion,enterBoss,bossReward,traits,randomDrop,walkable,cast,dodge,interact,move,potion,hitPlayer,beginWindup,canWindup,enterTower,clearTowerFloor,tower:()=>tower,setCount,setActive,skillPoints,normalizeSave,backupText,parseBackup,commitRestore,lootFilter:()=>lootFilter,world:()=>world,attacks:()=>attacks,keys:()=>keys,clear:()=>{enemies=[];attacks=[]},enemies:()=>enemies,player:()=>player}; // Read-only diagnostic'),sandbox);const tick=(seconds)=>{for(let i=0;i<Math.ceil(seconds/.04);i++){time+=40;frame(time)}};
 const key=(key,seconds)=>{events.keydown({key,repeat:false,preventDefault(){}});tick(seconds);events.keyup({key})};
 const click=(id)=>element(id).onclick();const act=(v)=>element('modalBody').onclick({target:{closest:()=>({dataset:{action:v},disabled:false})}});
 return {api:sandbox.window._combatTest,ready:async()=>{await new Promise(r=>setImmediate(r));click(seed?'continueBtn':'startBtn');if(!seed)click('closeModal');tick(.1)},rng:fn=>{sandbox.Math=Object.create(Math);sandbox.Math.random=fn},snap:()=>sandbox.window.emberSnapshot(),tick,key,click,act,el:element,storage};
}
module.exports=boot;
if(require.main===module)(async()=>{
 const game=boot();await game.ready();assert.equal(game.api.quests().length,18);assert.ok(game.api.quests().every(q=>typeof q.text==="string"&&Number.isFinite(q.target)&&Number.isFinite(q.gold)&&Number.isFinite(q.xp)),"quest catalogue contains only complete quests");assert.equal(game.snap().floor,0);assert.equal(game.snap().state.gold,80);assert.equal(game.snap().stats.hp,100);
 game.key('d',.5);assert.ok(game.snap().player.x>840,'keyboard movement works');
 game.click('menuBtn');const paused=game.snap().player.x;game.key('d',1);assert.equal(game.snap().player.x,paused,'modal pauses movement');game.click('closeModal');
 game.click('menuBtn');game.act('enter:1');assert.equal(game.snap().floor,1);assert.equal(game.snap().enemies,13);
 game.key('d',.65);game.key('s',.6);game.tick(5);assert.ok(game.snap().enemies<13,'normal attacks kill nearby enemy');assert.ok(game.snap().state.materials.gel>=1,'enemy drops material');assert.ok(game.snap().state.xp>0,'enemy gives XP');
 game.click('returnBtn');game.act('town');assert.equal(game.snap().floor,0);assert.equal(game.snap().player.hp,game.snap().stats.hp);assert.ok(JSON.parse(game.storage.get('ember-below-v1')).materials.gel>0,'progress persists');
 const seed=JSON.parse(game.storage.get('ember-below-v1'));seed.gold=5000;seed.lv=12;seed.owned=['sword'];seed.materials.ore=20;seed.counts.slimes=5;
 const rich=boot(seed);await rich.ready();rich.click('menuBtn');rich.act('buyweapon:spear');assert.ok(rich.snap().state.owned.includes('spear'));assert.equal(rich.snap().state.gold,4850);rich.act('equip:spear');assert.equal(rich.snap().state.weapon,'spear');rich.act('upgrade');assert.equal(rich.snap().state.upgrade.spear,1);assert.equal(rich.snap().state.materials.ore,19);rich.act('buyarmor:steel');rich.act('armor:steel');assert.equal(rich.snap().stats.def,12);rich.act('learn:ice');assert.ok(rich.snap().state.spells.includes('ice'));rich.act('claim:slimes');assert.ok(rich.snap().state.claimed.includes('slimes'));const gold=rich.snap().state.gold;rich.act('claim:slimes');assert.equal(rich.snap().state.gold,gold,'quest reward cannot be claimed twice');
 rich.act('enter:1');rich.key('d',.7);rich.key('s',.6);rich.click('menuBtn');const mp=rich.snap().player.mp;rich.act('cast:ice');assert.ok(rich.snap().player.mp<mp,'spell consumes MP');rich.tick(.1);rich.click('returnBtn');rich.act('town');
 // Walk the actual connected map to both stairs, then fight the boss with normal combat.
 function walkTo(g,x,y){for(let limit=0;limit<1000;limit++){const p=g.snap().player,dx=x-p.x,dy=y-p.y;if(Math.abs(dx)<8&&Math.abs(dy)<8)return;g.key(Math.abs(dx)>8?(dx>0?'d':'a'):(dy>0?'s':'w'),.04);if(g.snap().modal==='down')throw Error('unexpected defeat');}throw Error('unreachable '+x+','+y+' from '+JSON.stringify(g.snap().player));}
 rich.click('menuBtn');rich.act('enter:1');for(let f=1;f<=3;f++){walkTo(rich,6*48+24,6*48+24);walkTo(rich,18*48+24,6*48+24);walkTo(rich,29*48+24,6*48+24);walkTo(rich,29*48+24,19*48+24);rich.tick(6);if(f===3){for(let n=0;n<100&&!rich.snap().state.cleared;n++){const boss=rich.snap().enemyDetails.find(e=>e.type===3);if(!boss)break;if(Math.hypot(boss.x-rich.snap().player.x,boss.y-rich.snap().player.y)>95)walkTo(rich,Math.round(boss.x),Math.round(boss.y));rich.tick(.5);}}if(f<3){walkTo(rich,30*48+24,21*48+24);rich.key('e',.04);assert.equal(rich.snap().modal,'stairs');rich.act('enter:'+(f+1));}else{assert.ok(rich.snap().state.cleared,'boss can be defeated');assert.ok(rich.snap().state.owned.includes('guardian'),'boss gives unique weapon');}}
 rich.click('returnBtn');rich.act('town');const saved=JSON.parse(rich.storage.get('ember-below-v1'));const resumed=boot(saved);await resumed.ready();assert.ok(resumed.snap().state.cleared);assert.equal(resumed.snap().floor,0);assert.ok(resumed.snap().state.upgrade.spear);

 // Old saves migrate into the new hunting loop; no story progress is granted there.
 const hunterSeed={...seed,lv:50,owned:['sword','staff'],weapon:'staff',cleared:false,counts:{slimes:0,bones:0,rescue:0,guardian:0}};
 delete hunterSeed.loot;delete hunterSeed.huntBest;delete hunterSeed.huntKills;
 const huntGame=boot(hunterSeed);await huntGame.ready();assert.equal(huntGame.snap().state.loot.length,0,'old save migration');
 huntGame.click('menuBtn');huntGame.act('hunt:1');assert.equal(huntGame.snap().hunt.wave,1);assert.ok(!huntGame.snap().objects.some(o=>o.type==='stairs'),'hunt has no descending stairs');
 const oldXP=huntGame.snap().state.xp;
 for(let wave=1;wave<=5;wave++){
  for(let n=0;n<200&&!huntGame.snap().hunt.cleared;n++)huntGame.tick(.2);
  assert.ok(huntGame.snap().hunt.cleared,'wave '+wave+' clears');assert.equal(huntGame.snap().modal,null,'wave reward never opens an automatic overlay');huntGame.click('huntContinue');assert.equal(huntGame.snap().modal,'huntClear','result can be opened deliberately');
  assert.equal(huntGame.snap().state.huntBest,wave);assert.ok(huntGame.snap().state.loot.length>=wave,'guaranteed loot per wave');
  if(wave<5)huntGame.act('huntNext');
 }
 assert.equal(huntGame.snap().state.cleared,false,'hunt elite does not complete story');assert.equal(huntGame.snap().state.counts.guardian,0,'hunt elite does not grant story quest');
 const item=huntGame.snap().state.loot[0];huntGame.act('viewLoot');huntGame.act('equip:'+item.uid);assert.equal(huntGame.snap().state.weapon,item.uid);const invCount=huntGame.snap().state.loot.length;huntGame.act('sellLoot:'+item.uid);assert.equal(huntGame.snap().state.loot.length,invCount,'cannot sell equipped item');
 huntGame.act('equip:sword');const beforeSell=huntGame.snap().state.gold;huntGame.act('sellLoot:'+item.uid);assert.equal(huntGame.snap().state.gold,beforeSell+item.value);assert.equal(huntGame.snap().state.loot.length,invCount-1);
 huntGame.act('town');assert.equal(huntGame.snap().hunt,null);const huntSave=JSON.parse(huntGame.storage.get('ember-below-v1'));const huntResume=boot(huntSave);await huntResume.ready();assert.equal(huntResume.snap().state.huntBest,5);assert.ok(huntResume.snap().state.loot.length>0,'loot persists');
 console.log('PASS: old save migration, five hunt waves, elite separation, guaranteed randomized loot, equip, sell guard, return and persistence.');

 const combat=boot({...seed,owned:['sword','staff'],weapon:'sword'});await combat.ready();combat.click('menuBtn');
 for(const id of ['axe','hammer','crossbow','venom']){combat.act('buyweapon:'+id);assert.ok(combat.snap().state.owned.includes(id),'new weapon purchasable: '+id);}
 combat.act('equip:crossbow');combat.act('enter:1');combat.api.clear();let p=combat.api.player();p.inv=0;
 combat.api.enemy(5,(p.x+260-24)/48,(p.y-24)/48);let ranged=combat.api.enemies()[0];combat.api.attack();combat.tick(.8);assert.ok(ranged.hp<ranged.maxHp,'crossbow projectile reaches distant target');
 combat.click('menuBtn');combat.act('equip:venom');combat.click('closeModal');combat.api.clear();p=combat.api.player();combat.api.enemy(3,(p.x+35-24)/48,(p.y-24)/48);let poisoned=combat.api.enemies()[0];combat.api.attack();p.cool=999;const afterHit=poisoned.hp;combat.api.update(1.05);assert.equal(poisoned.hp,afterHit-6,'venom deals timed damage');
 combat.click('menuBtn');combat.act('equip:hammer');combat.click('closeModal');poisoned.wind=1;combat.api.attack();assert.equal(poisoned.wind,0,'hammer interrupts windup');assert.ok(poisoned.stun>0,'hammer stuns');
 combat.api.clear();combat.api.enemy(4,(p.x-24)/48,(p.y-24)/48);const spider=combat.api.enemies()[0];spider.aim={x:p.x,y:p.y};p.poison=0;p.inv=1;combat.api.resolveEnemyAttack(spider);assert.equal(p.poison,0,'dodged spider hit does not poison');p.inv=0;combat.api.resolveEnemyAttack(spider);assert.equal(p.poison,4,'spider applies poison on hit');
 combat.api.clear();for(const type of [1,4,5,6,7]){combat.api.enemy(type,(p.x-24)/48,(p.y-24)/48);combat.api.hurtEnemy(combat.api.enemies().at(-1),10000);}
 for(const key of ['bats','spiders','archers','wisps','beetles'])assert.ok(combat.snap().state.counts[key]>0,'new quest counter '+key);
 assert.ok(combat.snap().state.materials.silk>0&&combat.snap().state.materials.ember>0&&combat.snap().state.materials.shell>0,'new monster materials');
 console.log('PASS: new weapon purchases, long-range crossbow hit, venom DOT, hammer interrupt, spider poison and invulnerability, new quest counters and materials.');
 console.log('PASS: movement, pause, combat, drops, XP, return, persistence, shop, armor, forge, spells, quest reward, 3 connected floors, boss reward, resume.');
})().catch(e=>{console.error(e);process.exit(1)});
