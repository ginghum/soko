const boot=require('./game.test.cjs'),assert=require('node:assert/strict');
(async()=>{
 const g=boot({version:1,lv:30,gold:3000,cleared:true,counts:{guardian:1},materials:{ore:50}});await g.ready();g.rng(()=>.99);const s=g.api.state();let p=g.api.player();
 assert.equal(s.bossKills.guardian,1,'old story clear unlocks boss replay');assert.equal(g.api.catalogue().skills.length,18);assert.equal(g.api.catalogue().armors.length,11);assert.equal(g.api.catalogue().weapons.length,32);assert.equal(g.api.catalogue().accessories.length,20);
 g.click('menuBtn');g.act('skill:bladeFinish');assert.equal(s.skills.bladeFinish,undefined,'deep skill requires predecessor');g.act('skill:bladeEdge');g.act('skill:bladeEdge');g.act('skill:bladeEdge');assert.equal(s.skills.bladeEdge,2);g.act('skill:bladeGuard');assert.equal(g.api.skillPoints(),26);g.act('respec');assert.equal(g.api.skillPoints(),29);
 // Tower progress cannot skip floors or pay the same first-clear reward twice.
 g.act('tower:26');assert.equal(g.api.tower(),null);g.act('tower:1');g.act('towerNext');assert.equal(g.api.tower().floor,1);
 const startTickets=s.tickets;
 for(let n=1;n<=30;n++){
  assert.equal(g.api.tower().floor,n);assert.ok(g.api.enemies().length>0);
  for(const e of [...g.api.enemies()])g.api.hurtEnemy(e,100000);g.api.update(.04);
  assert.ok(g.api.tower().cleared);assert.equal(s.towerBest,n);assert.equal(g.snap().modal,null,'tower reward never opens an automatic overlay');assert.ok(Number.isFinite(s.materials.core));
  const marks=s.towerMarks,tickets=s.tickets;g.api.clearTowerFloor();assert.equal(s.towerMarks,marks);assert.equal(s.tickets,tickets,'clear callback idempotent');
  if(n<30){g.click('huntContinue');assert.equal(g.snap().modal,'towerClear');g.act('towerNext');}
 }
 assert.ok(s.towerConquered);assert.equal(s.towerFirst.length,30);assert.ok(s.tickets>startTickets);assert.ok(s.bossKills.towerMirror&&s.bossKills.towerOracle&&s.bossKills.towerVoid);
 g.act('town');g.act('tower:26');assert.equal(g.api.tower().floor,26,'unlocked checkpoint resumes');g.act('town');const before=s.tickets;g.act('tower:1');for(const e of g.api.enemies())g.api.hurtEnemy(e,100000);const afterKill=s.tickets;g.api.update(.04);assert.equal(s.tickets,afterKill,'repeat floor does not repeat first reward');g.act('town');
 // Set exchange has costs; older rare gear participates in the same set.
 s.towerMarks=50;g.act('setBuy:setSerpentMail');assert.equal(s.towerMarks,44);g.act('setBuy:setSerpentMail');assert.equal(s.towerMarks,44);g.act('setBuy:setSerpentRing');g.act('armor:setSerpentMail');g.act('acc0:setSerpentRing');assert.ok(g.api.setActive('serpent'));assert.ok(g.api.traits().has('chain'));
 g.act('boss:towerVoid');assert.equal(g.api.tower().floor,30);assert.equal(g.snap().enemies,1);s.bossDry.towerVoid=29;g.api.hurtEnemy(g.api.enemies()[0],100000);assert.ok(s.owned.includes('voidSpear'),'tower unique pity');g.act('town');
 // Protected and equipped loot cannot be destroyed through either action.
 const d=g.api.randomDrop(6,2);s.loot.push(d);g.act('lock:'+d.uid);const ore=s.materials.ore,money=s.gold;g.act('sellLoot:'+d.uid);g.act('dismantle:'+d.uid);assert.ok(s.loot.some(w=>w.uid===d.uid));assert.equal(s.materials.ore,ore);assert.equal(s.gold,money);
 g.act('lock:'+d.uid);g.act('equip:'+d.uid);g.act('dismantle:'+d.uid);assert.ok(s.loot.some(w=>w.uid===d.uid));g.act('equip:sword');g.act('dismantle:'+d.uid);assert.equal(s.materials.ore,ore+3);assert.ok(!s.loot.some(w=>w.uid===d.uid));
 // Gacha shards only accrue when an actual draw succeeds; exchange cannot grant boss gear.
 g.act('open:gacha');s.tickets=1;const shards=s.gachaShards;g.act('gacha:10');assert.equal(s.gachaShards,shards);g.act('gacha:1');assert.equal(s.gachaShards,shards+1);s.gachaShards=15;g.act('shardAcc:watcherSeal');assert.equal(s.gachaShards,15);g.act('shardAcc:fortune');assert.equal(s.gachaShards,0);assert.ok(s.accessories.includes('fortune'));
 // Damage cap and potion scaling are enforced in real combat code.
 g.act('enter:1');p=g.api.player();p.hp=g.snap().stats.hp;p.inv=0;const hp=p.hp;g.api.hitPlayer(10000);assert.ok(hp-p.hp<=Math.round(hp*.22));p.poison=3;const pots=s.potions;g.api.potion('hp');assert.equal(p.poison,0);assert.equal(s.potions,pots-1);
 // Only two windups may overlap; all bosses expose second-phase state.
 g.api.clear();for(let i=0;i<3;i++)g.api.enemy(0,(p.x+30+i*5-24)/48,(p.y-24)/48);for(const e of g.api.enemies()){e.cool=0;e.alert=10;}g.api.update(.04);assert.equal(g.api.enemies().filter(e=>e.wind>0).length,2);
 g.api.clear();g.api.enemy(14,6,6);const hydra=g.api.enemies()[0];hydra.bossId='hydra';g.api.hurtEnemy(hydra,hydra.maxHp*.55);assert.ok(hydra.secondForm);g.api.beginWindup(hydra,0);assert.equal(hydra.aims.length,3);
 g.api.clear();g.api.enemy(16,6,6);const phoenix=g.api.enemies()[0];phoenix.bossId='phoenix';const kills=s.bossKills.phoenix;g.api.hurtEnemy(phoenix,100000);assert.ok(phoenix.hp>0&&phoenix.reborn);assert.equal(s.bossKills.phoenix,kills);g.api.hurtEnemy(phoenix,100000);assert.equal(s.bossKills.phoenix,kills+1,'revive grants exactly one kill reward');g.act('town');
 // Backup roundtrip, confirmation, cancellation, invalid data and undo.
 const text=g.api.backupText(),restored=g.api.parseBackup(text);assert.equal(restored.towerBest,30);assert.equal(restored.towerConquered,true);assert.equal(restored.bossKills.guardian,s.bossKills.guardian);assert.throws(()=>g.api.parseBackup('{'));assert.throws(()=>g.api.parseBackup('{"format":"other"}'));
 g.act('open:backup');const prior=g.storage.get('ember-below-v1');g.el('backupImport').value='invalid';g.act('previewImport');assert.equal(g.storage.get('ember-below-v1'),prior);assert.ok(g.el('backupError').textContent.includes('読み込めません'));
 const data=JSON.parse(text);data.state.gold=123;g.el('backupImport').value=JSON.stringify(data);g.act('previewImport');assert.equal(g.snap().modal,'restorePreview');assert.notEqual(g.snap().state.gold,123);g.act('cancelImport');assert.notEqual(g.snap().state.gold,123);
 g.el('backupImport').value=JSON.stringify(data);g.act('previewImport');g.act('confirmImport');assert.equal(g.snap().state.gold,123);assert.equal(g.snap().floor,0);assert.ok(g.storage.get('ember-below-v1-before-import'));g.act('open:backup');g.act('restorePrevious');g.act('confirmImport');assert.notEqual(g.snap().state.gold,123);
 const safe=g.api.normalizeSave({version:1,lv:1,skills:{bladeEdge:2},loot:[{uid:'loot-99',base:'sword',name:'<img src=x onerror=alert(1)>',rarity:2,bonus:10}],gachaLog:['<script>bad</script>'],accessories:['missing'],weapon:'invalid',materials:{ore:Infinity}});assert.equal(Object.keys(safe.skills).length,0);assert.equal(safe.weapon,'sword');assert.ok(!safe.loot[0].name.includes('<'));assert.ok(!safe.gachaLog[0].includes('<'));assert.equal(safe.lootSerial,99);assert.equal(safe.materials.ore,0);
 const resume=boot(JSON.parse(g.storage.get('ember-below-v1')));await resume.ready();assert.equal(resume.snap().state.towerBest,30);
 console.log('PASS: tower 30 floors/checkpoints/unique rewards, 18 skills, sets, protected inventory, shard exchange, damage/telegraph limits, boss second forms, backup validation/confirmation/undo and old save migration.');
})().catch(e=>{console.error(e);process.exit(1)});
