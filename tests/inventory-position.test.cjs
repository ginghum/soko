const assert=require('node:assert/strict'),boot=require('./game.test.cjs');
(async()=>{
 const g=boot();await g.ready();const s=g.api.state();
 s.owned.push('spear');for(let i=0;i<12;i++)s.loot.push(g.api.randomDrop(5,1));
 g.act('open:equipment');g.act('tab:loot');
 const body=g.el('modalBody');let html=body.innerHTML;
 // Model the browser's scroll clamp when the inventory DOM is replaced.
 Object.defineProperty(body,'innerHTML',{get:()=>html,set:v=>{html=v;body.scrollTop=0;body.scrollLeft=0;}});
 function atPosition(action){body.scrollTop=840;body.scrollLeft=12;g.act(action);assert.equal(body.scrollTop,840,action+' keeps vertical position');assert.equal(body.scrollLeft,12,action+' keeps horizontal position');}
 let item=s.loot[5];const equip=g.api.menuElements().find(e=>e.dataset.action==='equip:'+item.uid);equip.focus();
 atPosition('equip:'+item.uid);assert.equal(s.weapon,item.uid);assert.ok(!g.api.menuElements().find(e=>e.dataset.action==='equip:'+item.uid),'equipped button is disabled');
 atPosition('lock:'+item.uid);assert.ok(item.locked);atPosition('lock:'+item.uid);assert.ok(!item.locked);
 atPosition('equip:spear');assert.equal(s.weapon,'spear');
 let focused;for(const el of g.api.menuElements()){const original=el.focus;el.focus=function(...args){focused=el;original.apply(el,args);};}
 const seller=g.api.menuElements().find(e=>e.dataset.action==='sellLoot:'+item.uid);seller.focus();atPosition('sellLoot:'+item.uid);assert.ok(!s.loot.includes(item));
 // A removed row must leave keyboard focus on another usable inventory action.
 assert.ok(focused&&!focused.disabled);assert.ok(body.innerHTML.includes('data-action="'+focused.dataset.action+'"'));assert.notEqual(focused.dataset.action,'sellLoot:'+item.uid);
 item=s.loot[4];atPosition('dismantle:'+item.uid);assert.ok(!s.loot.includes(item));
 // Force an otherwise guaranteed experience crystal: ticket enemies bypass it.
 g.act('town');g.act('ticketHunt:1');s.expDry=7;g.rng(()=>0);const before={xp:s.xp,items:JSON.stringify(s.expItems)};
 for(const e of g.api.enemies())g.api.hurtEnemy(e,100000);g.api.update(.04);
 assert.equal(s.xp,before.xp);assert.equal(JSON.stringify(s.expItems),before.items);assert.equal(s.expDry,7);
 console.log('PASS: inventory equip/lock/sell/dismantle preserve scroll and usable keyboard focus; ticket enemies and wave clear grant no experience or crystals.');
})().catch(e=>{console.error(e);process.exit(1)});
