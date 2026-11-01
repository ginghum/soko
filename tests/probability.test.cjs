const boot=require('./game.test.cjs'),assert=require('node:assert/strict');
(async()=>{
 const g=boot({version:1,lv:30,cleared:true,gachaCount:9,gachaDry:49});await g.ready();const s=g.api.state();g.click('menuBtn');g.act('open:gacha');
 for(const [roll,rank] of [[0,'SSR'],[.004999,'SSR'],[.005,'SR'],[.049999,'SR'],[.05,'R'],[.199999,'R'],[.2,'N'],[.999999,'N']]){s.tickets=1;let n=0;g.rng(()=>n++===0?roll:.1);g.act('gacha:1');assert.ok(s.gachaLog[0].startsWith(rank+' '),roll+' => '+rank);}
 s.tickets=10;g.rng(()=>.99);const before=s.expItems[20]||0,shards=s.gachaShards;g.act('gacha:10');assert.ok(s.gachaLog.every(x=>x.startsWith('N ')));assert.equal(s.expItems[20],before+10);assert.equal(s.gachaShards,shards+10);assert.match(g.el('modalBody').innerHTML,/N経験結晶80% \/ R15% \/ SR4.5% \/ SSR0.5%/);assert.doesNotMatch(g.el('modalBody').innerHTML,/SSR確定|SR以上まで/);
 // Stratified samples verify exact advertised rank weights through real pulls.
 const ranks={N:0,R:0,SR:0,SSR:0};for(let i=0;i<2000;i++){s.tickets=1;let n=0;g.rng(()=>n++===0?(i+.5)/2000:.1);g.act('gacha:1');ranks[s.gachaLog[0].split(' ')[0]]++;}assert.deepEqual(ranks,{N:1600,R:300,SR:90,SSR:10});
 g.act('enter:1');g.api.clear();
 for(const [roll,expected] of [[.009999,1],[.01,0],[.99,0]]){g.api.enemy(0,6,6);let n=0;g.rng(()=>n++===1?roll:.99);const count=s.lootSerial;g.api.hurtEnemy(g.api.enemies().at(-1),100000);assert.equal(s.lootSerial-count,expected,'normal enemy boundary '+roll);}
 // Bosses use the same 1% total, even with old dry counters or mutation.
 for(const id of ['guardian','hydra','towerVoid'])for(const mutated of [false,true]){s.bossDry[id]=999;g.rng(()=>.01);assert.equal(g.api.bossReward({bossId:id,mutated,x:300,y:300}).length,0);g.rng(()=>0);assert.equal(g.api.bossReward({bossId:id,mutated,x:300,y:300}).length,1);}
 g.act('town');g.rng(()=>.99);g.act('hunt:1');const count=s.lootSerial;for(const e of g.api.enemies())g.api.hurtEnemy(e,100000);g.api.update(.04);assert.ok(g.snap().hunt.cleared);assert.equal(s.lootSerial,count,'no guaranteed wave gear');
 g.act('town');g.act('save');const r=boot(JSON.parse(g.storage.get('ember-below-v1')));await r.ready();assert.equal(r.api.state().expItems[20],s.expItems[20]);
 console.log('PASS: gacha boundaries and 2000 stratified draws, crystals/shards/save, 1% enemy and boss boundaries, no old pity or hunt guarantees.');
})().catch(e=>{console.error(e);process.exit(1)});

