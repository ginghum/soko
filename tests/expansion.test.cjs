const boot=require('./game.test.cjs'),assert=require('node:assert/strict');
(async()=>{
 const g=boot({version:1,lv:20,gold:5000,owned:['sword'],weapon:'sword',materials:{ore:80},spells:['fire','ice','heal','nova']});await g.ready();g.rng(()=>.99);
 const s=g.api.state();let p=g.api.player();
 assert.equal(g.api.catalogue().weapons.length,26);assert.equal(g.api.catalogue().accessories.length,16);assert.equal(Object.keys(g.api.catalogue().traits).length,15);assert.equal(s.tickets,0);assert.deepEqual(Array.from(s.accessorySlots),[null,null]);assert.equal(g.api.quests().length,18);
 // Six new creatures use real attacks, give materials, quest counts, and ticket rolls.
 g.click('menuBtn');g.act('region:sewer');assert.equal(g.snap().floor,1);assert.equal(g.snap().enemies,13);
 g.api.clear();for(let type=8;type<=13;type++)g.api.enemy(type,6,6);
 for(const e of g.api.enemies()){e.aim={x:p.x,y:p.y};p.inv=0;p.hp=g.snap().stats.hp;g.api.resolveEnemyAttack(e);assert.ok(Number.isFinite(p.hp));}
 g.rng(()=>0);for(const e of g.api.enemies())g.api.hurtEnemy(e,100000);
 assert.equal(s.tickets,6);assert.equal(s.counts.sewerKills,6);assert.ok(s.materials.sludge&&s.materials.fang&&s.materials.spore&&s.materials.scale);
 // Every floor has a connected route to the stairs, rescue NPC, and final boss room.
 function route(tx,ty){const seen=new Set(),q=[[5,6]],target=tx+','+ty;while(q.length){const [x,y]=q.shift(),k=x+','+y;if(seen.has(k))continue;seen.add(k);if(k===target)return true;for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]])if(g.api.walkable((x+dx)*48+24,(y+dy)*48+24,12)&&!seen.has((x+dx)+','+(y+dy)))q.push([x+dx,y+dy]);}return false;}
 for(let n=1;n<=5;n++){g.api.enterRegion('sewer',n);assert.ok(route(29,19),'boss chamber reachable on floor '+n);if(n<5)assert.ok(route(30,21),'stairs reachable');assert.ok(g.snap().objects.some(o=>o.type==='treasury'));}
 g.api.enterRegion('sewer',4);const rescue=g.api.objects().find(o=>o.type==='sewerRescue');p.x=rescue.x;p.y=rescue.y;g.api.interact();assert.equal(s.counts.sewerRescue,1);
 g.api.enterRegion('sewer',5);const hydra=g.api.enemies().find(e=>e.type===14);g.rng(()=>.99);g.api.hurtEnemy(hydra,100000);assert.equal(s.bossKills.hydra,1);assert.equal(s.bossCollection.length,0,'rare drop can miss');assert.equal(s.tickets,12,'rescue and boss each give 3 tickets');
 g.act('town');g.act('boss:hydra');assert.equal(g.snap().enemies,1,'direct boss replay');const boss=g.api.enemies()[0];s.bossDry.hydra=29;g.rng(()=>.99);g.api.hurtEnemy(boss,100000);assert.equal(s.bossCollection.length,1,'30th dry kill guarantees unique');assert.equal(s.bossDry.hydra,0);
 g.act('town');g.act('mutant:hydra');assert.ok(g.api.enemies()[0].maxHp>1150);g.rng(()=>0);g.api.hurtEnemy(g.api.enemies()[0],100000);assert.equal(s.bossCollection.length,2,'missing unique is prioritized');
 g.act('town');g.act('region:frost');assert.equal(g.snap().floor,1);g.api.enterRegion('frost',4);g.api.hurtEnemy(g.api.enemies().find(e=>e.type===15),100000);g.act('town');g.act('region:shrine');g.api.enterRegion('shrine',4);g.api.hurtEnemy(g.api.enemies().find(e=>e.type===16),100000);g.api.hurtEnemy(g.api.enemies().find(e=>e.type===16),100000);assert.ok(s.bossKills.frost&&s.bossKills.phoenix,'region unlock chain');
 // Boss-exclusive gear cannot be purchased or rolled as ordinary weapons.
 g.act('town');const gold=s.gold;g.act('buyweapon:sunblade');assert.equal(s.gold,gold);assert.ok(!s.owned.includes('sunblade'));
 for(let i=0;i<50;i++)assert.ok(!g.api.randomDrop(5,3).base.match(/sunblade|serpentfang|frostlance|ashstaff/));
 // Gacha consumes exactly tickets, keeps gold, and carries pity through single draws and saves.
 g.act('open:codex');const oldTickets=s.tickets;g.act('codexClaim:5');assert.equal(s.tickets,oldTickets+3);g.act('codexClaim:5');assert.equal(s.tickets,oldTickets+3,'codex rewards are one-time');g.act('open:gacha');s.tickets=60;s.gachaCount=9;s.gachaDry=0;g.rng(()=>.99);const money=s.gold;g.act('gacha:1');assert.equal(s.tickets,59);assert.ok(s.gachaLog[0].startsWith('SR'));assert.equal(s.gold,money);
 s.gachaDry=49;g.act('gacha:1');assert.ok(s.gachaLog[0].startsWith('SSR'));assert.equal(s.gachaDry,0);
 s.tickets=9;const pulls=s.gachaTotal;g.act('gacha:10');assert.equal(s.gachaTotal,pulls,'insufficient tickets has no side effects');s.tickets=10;g.act('gacha:10');assert.equal(s.gachaLog.length,10);assert.equal(s.tickets,0);
 s.tickets=2;g.rng(()=>0);g.act('gacha:1');assert.ok(s.accessories.includes('fortune'),'SSR accessory pool');const oldOre=s.materials.ore;g.act('gacha:1');assert.equal(s.materials.ore,oldOre+3,'duplicate accessory refund');g.rng(()=>.99);
 // Accessory slots, active effects, recipe gating, and forging costs.
 for(const id of ['venomring','evadecharm','arcaneseal'])if(!s.accessories.includes(id))s.accessories.push(id);
 g.act('acc0:venomring');g.act('acc1:venomring');assert.equal(s.accessorySlots[1],null);g.act('acc1:evadecharm');assert.ok(g.api.traits().has('evade'));g.act('accRemove:0');assert.equal(s.accessorySlots[0],null);
 s.materials.sludge=3;s.materials.spore=3;s.materials.fang=2;const pots=s.potions;g.act('craft:hp');assert.equal(s.potions,pots+3);g.act('craft:mp');assert.equal(s.materials.spore,0);
 g.act('forgeUnlock');assert.ok(s.forgeUnlocked);const drop=g.api.randomDrop(5,3);s.loot.push(drop);g.act('equip:'+drop.uid);const prior=drop.traits.join();const ore=s.materials.ore;g.act('reforge');assert.notEqual(drop.traits.join(),prior);assert.equal(s.materials.ore,ore-3);
 g.act('path:nova-swift');g.act('enter:1');p=g.api.player();const mp=p.mp;p.mp=20;g.api.cast('nova');assert.equal(p.mp,4,'spell branch cost is applied');g.act('town');
 // Alternative hunting rules affect actual enemies and recovery.
 g.act('huntRule:swarm');g.act('hunt:1');assert.equal(g.snap().enemies,12);g.act('town');g.act('huntRule:attrition');g.act('hunt:1');p=g.api.player();p.hp=100;p.mp=10;for(const e of g.api.enemies())g.api.hurtEnemy(e,100000);const hp=p.hp, mana=p.mp;g.api.update(.04);assert.ok(g.snap().hunt.cleared);assert.equal(p.hp,hp);assert.ok(p.mp<mana+1,'no automatic wave recovery');g.act('town');
 g.act('save');const resumed=boot(JSON.parse(g.storage.get('ember-below-v1')));await resumed.ready();assert.ok(resumed.snap().state.bossKills.hydra);assert.equal(resumed.snap().state.accessorySlots[1],'evadecharm');assert.equal(resumed.snap().state.gachaTotal,s.gachaTotal);
 console.log('PASS: new maps/enemies, rescue and progression, rare boss drops and pity, rematches, ticket economy, gacha guarantees, accessory slots, recipes, forging, spell branches, hunting rules and save migration.');
})().catch(e=>{console.error(e);process.exit(1)});
