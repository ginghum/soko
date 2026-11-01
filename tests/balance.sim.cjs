// Deterministic smoke simulations using real movement, AI, attacks, dodges and potion costs.
const boot=require('./game.test.cjs'),assert=require('node:assert/strict');
const cases=[
 {name:'序盤の単体',lv:1,weapon:'sword',armor:'travel',types:[0],skills:{}},
 {name:'序盤の3体',lv:1,weapon:'sword',armor:'travel',types:[0,1,0],skills:{}},
 {name:'守護者・通常装備',lv:5,weapon:'spear',armor:'leather',types:[3],boss:'guardian',skills:{bladeEdge:2,bladeGuard:1},upgrade:1},
 {name:'三頭蛇・通常装備',lv:9,weapon:'sewersabre',armor:'steel',types:[14],boss:'hydra',skills:{bladeEdge:2,bladeGuard:1},upgrade:2},
 {name:'不死鳥・通常装備',lv:15,weapon:'crossbow',armor:'steel',types:[16],boss:'phoenix',skills:{bladeEdge:2,bladeGuard:1},upgrade:2},
 {name:'塔30階・通常装備',lv:23,weapon:'chainaxe',armor:'steel',types:[19],boss:'towerVoid',skills:{bladeEdge:2,bladeGuard:2,bladeFlow:1},upgrade:3}
];
(async()=>{const report=[];for(const cfg of cases.flatMap(c=>[{...c,avoid:true},{...c,avoid:false}])){let wins=0,time=0,potions=0,heals=0,minHP=Infinity;for(let trial=1;trial<=3;trial++){
 const g=boot({version:1,lv:cfg.lv,owned:['sword',cfg.weapon],weapon:cfg.weapon,armors:['travel',cfg.armor],armor:cfg.armor,upgrade:{[cfg.weapon]:cfg.upgrade||0},skills:cfg.skills,potions:3,ethers:0,spells:cfg.lv>=5?['fire','heal']:['fire']});await g.ready();let rng=trial*101;g.rng(()=>{rng=(rng*1664525+1013904223)>>>0;return rng/4294967296;});g.click('menuBtn');g.act('enter:1');g.api.clear();const w=g.api.world();for(let y=1;y<26;y++)for(let x=1;x<34;x++)w.map[y][x]=1;const p=g.api.player();p.x=17*48+24;p.y=16*48+24;p.inv=0;
 cfg.types.forEach((type,i)=>{g.api.enemy(type,18+i,15-i);const e=g.api.enemies().at(-1);e.alert=999;if(cfg.boss)e.bossId=cfg.boss;});let used=0,healUsed=0,elapsed=0;
 for(let i=0;i<4000;i++){const es=g.api.enemies().filter(e=>e.hp>0);if(!es.length||p.hp<=0)break;const e=es.sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0],d=Math.hypot(e.x-p.x,e.y-p.y),range=g.api.catalogue().weapons.find(w=>w.id===cfg.weapon).range,keys=g.api.keys();keys.clear();const danger=cfg.avoid&&es.find(e=>e.wind>0&&e.wind<.9);let dx=0,dy=0;if(danger){const a=Math.atan2(danger.y-p.y,danger.x-p.x);dx=-Math.sin(a);dy=Math.cos(a);}else if(d>range*.85){dx=(e.x-p.x)/(d||1);dy=(e.y-p.y)/(d||1);}if(Math.abs(dx)>.3)keys.add(dx>0?'d':'a');if(Math.abs(dy)>.3)keys.add(dy>0?'s':'w');if(danger&&p.dodgeCD<=0)g.api.dodge();if(p.hp<g.snap().stats.hp*.4&&g.api.state().potions>0){g.api.potion('hp');used++;}if(p.hp<g.snap().stats.hp*.4&&p.mp>=15&&g.api.state().spells.includes('heal')){g.api.cast('heal');healUsed++;}g.api.update(.04);elapsed+=.04;}
 assert.ok(p.hp>0&&g.api.enemies().every(e=>e.hp<=0),cfg.name+' avoid='+cfg.avoid+' trial '+trial+' hp='+p.hp+' pots='+g.api.state().potions+' seconds='+elapsed+' remaining='+g.api.enemies().map(e=>Math.round(e.hp)).join(','));wins++;time+=elapsed;potions+=used;heals+=healUsed;minHP=Math.min(minHP,Math.round(p.hp/g.snap().stats.hp*100));}
 report.push({case:cfg.name,play:cfg.avoid?'予兆回避':'回避なし・薬3',wins:wins+'/3',seconds:Math.round(time/3),potions:Math.round(potions/3*10)/10,healSpells:Math.round(heals/3*10)/10,minimumRemainingHP:minHP+'%'});}
 console.table(report);
})().catch(e=>{console.error(e);process.exit(1)});
