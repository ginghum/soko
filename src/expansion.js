// Content expansion. Compiled into the game closure by scripts/build-expansion.py.
let region='ruins', variant=false, expeditionPower=0, dodgePower=0, lastRewards=[], trader=null;
const REGIONS={
 ruins:{name:'古灯の迷宮',floors:3,level:1,boss:'guardian',color:'#557b71'},
 sewer:{name:'毒沼の地下水路',floors:5,level:3,boss:'hydra',color:'#638f50'},
 frost:{name:'凍結した鉱山',floors:4,level:9,boss:'frost',color:'#68afc4'},
 shrine:{name:'灼熱の廃神殿',floors:4,level:15,boss:'phoenix',color:'#c18053'}
};
const TRAITS={edge:['研刃','攻撃力+8%'],vigor:['生命','最大HP+25'],guard:['堅守','防御+3'],flow:['速撃','通常攻撃の間隔-10%'],leech:['吸命','武器命中時HP2回復'],evade:['返し刃','回避後3秒以内の次の通常攻撃+50%'],execution:['処刑','HP30%以下の敵への武器ダメージ+25%'],fury:['窮地','HP35%未満で武器ダメージ+25%'],poison:['毒牙','武器命中で4秒間、毎秒6の毒'],frost:['冷気','武器命中で2秒間敵を鈍足にする'],chain:['伝染','毒状態の敵を倒すと周囲100にも毒'],harvest:['収穫','通常素材を追加で1個獲得'],scholar:['探究','敵からの経験値+15%'],luck:['幸運','通常敵のガチャ券率+6ポイント'],arcane:['魔導','魔法威力+20%']};
const MORE_WEAPONS=[
 ['sewersabre','水路の曲刀','sword',22,79,.62,360,'flow'],['reedbow','葦鳴りの弓','bow',24,285,.95,430,'luck'],['sporewand','胞子の杖','staff',20,220,.85,480,'poison'],['chainaxe','鎖刃の戦斧','axe',42,106,1.2,620,'execution'],
 ['sunblade','黎明の守護剣','longsword',48,108,.85,0,'leech'],['serpentfang','淵蛇の双牙','dagger',28,66,.3,0,'poison'],['frostlance','絶氷の王槍','spear',59,150,1.02,0,'frost'],['ashstaff','不死灰の王杖','staff',42,300,.78,0,'arcane']
];
for(const [id,name,family,atk,range,ct,price,trait] of MORE_WEAPONS) WEAPONS.push({id,name,family,atk,range,ct,price,trait,bossOnly:!price,icon:{sword:0,bow:4,staff:5,axe:24,longsword:1,dagger:2,spear:3}[family],magic:family==='staff'?1.4:1,desc:TRAITS[trait].join('：')});
const ACCESSORIES=[
 {id:'copperring',name:'銅の指輪',hp:18,traits:['vigor'],tier:0},
 {id:'huntercharm',name:'狩人の護符',traits:['harvest'],tier:0},
 {id:'swiftanklet',name:'疾風の足環',move:.1,traits:['flow'],tier:0},
 {id:'moonpendant',name:'月読の首飾り',mp:20,traits:['scholar'],tier:0},
 {id:'venomring',name:'毒蛇の指輪',poisonImmune:true,traits:['poison'],tier:1},
 {id:'evadecharm',name:'見切りの護符',traits:['evade','guard'],tier:1},
 {id:'fortune',name:'巡りの金環',traits:['luck','edge'],tier:2},
 {id:'arcaneseal',name:'賢者の印',mp:35,traits:['arcane','flow'],tier:2},
 {id:'watcherSeal',name:'守護者の灯印',hp:45,traits:['guard','leech'],bossOnly:true},
 {id:'tidePearl',name:'淵蛇の真珠',poisonImmune:true,traits:['chain','poison'],bossOnly:true},
 {id:'frostHeart',name:'氷王の心臓',hp:30,traits:['frost','evade'],bossOnly:true},
 {id:'phoenixCharm',name:'不死鳥の灰護符',mp:30,traits:['fury','arcane'],bossOnly:true}
];
const BOSSES={
 guardian:{name:'古き灯の守護者',region:'ruins',type:3,drops:['sunblade','watcherSeal']},
 hydra:{name:'毒淵の三頭蛇',region:'sewer',type:14,drops:['serpentfang','tidePearl']},
 frost:{name:'凍鉱の氷王',region:'frost',type:15,drops:['frostlance','frostHeart']},
 phoenix:{name:'灰冠の不死鳥',region:'shrine',type:16,drops:['ashstaff','phoenixCharm']}
};
const ENEMY_NAMES=['スライム','コウモリ','骸骨兵','古き灯の守護者','毒蜘蛛','骸骨弓兵','火霊','鎧甲虫','汚泥スライム','排水路の大鼠','管棲みの毒蟲','歩く胞子茸','錆鎧の水路兵','水蛇','毒淵の三頭蛇','凍鉱の氷王','灰冠の不死鳥'];
const MORE_QUESTS=[
 ['sewerMaterials','濁った水の行方','地下水路で素材を30個集める',30,350,170],['rats','水路の齧り手','排水路の大鼠を8体倒す',8,220,100],['worms','管の奥の気配','管棲みの毒蟲を6体倒す',6,240,110],['spores','胞子の採集','歩く胞子茸を6体倒す',6,260,120],['serpents','水面の牙','水蛇を4体倒す',4,300,140],['sewerRescue','調合師の帰り道','地下水路4階で調合師を救出する',1,400,220],['hydra','水源を取り戻せ','地下水路5階の三頭蛇を倒す',1,600,300],['specialRooms','寄り道の心得','特殊部屋の宝物庫を3回開ける',3,300,150]
];
MORE_QUESTS.forEach(([id,name,text,target,gold,xp])=>QUESTS.push({id,name,text,target,gold,xp}));
const oldFresh=fresh;
fresh=function(){const s=oldFresh();return {...s,tickets:0,gachaCount:0,gachaDry:0,gachaTotal:0,gachaLog:[],accessories:[],accessorySlots:[null,null],book:{},bossKills:{},bossDry:{},bossCollection:[],regionBest:{},spellPaths:{},forgeUnlocked:false,codexClaimed:[],materials:{...s.materials,sludge:0,fang:0,spore:0,scale:0},counts:{...s.counts,sewerKills:0,...Object.fromEntries(MORE_QUESTS.map(q=>[q[0],0]))}};};
const oldReadSave=readSave;
readSave=function(){const s=oldReadSave();if(!s)return null;const b=fresh();for(const key of ['book','bossKills','bossDry','regionBest','spellPaths'])s[key]={...b[key],...s[key]};s.accessorySlots=Array.isArray(s.accessorySlots)?s.accessorySlots.slice(0,2):[null,null];while(s.accessorySlots.length<2)s.accessorySlots.push(null);s.accessorySlots=s.accessorySlots.map((id,i)=>s.accessories.includes(id)&&s.accessorySlots.indexOf(id)===i?id:null);return s;};
function equippedAccessories(){return state.accessorySlots.map(id=>ACCESSORIES.find(a=>a.id===id)).filter(Boolean);}
function traits(){return new Set([weapon().trait,...(weapon().loot?.traits||[]),...equippedAccessories().flatMap(a=>a.traits)]);}
const oldStats=stats;
stats=function(){const s=oldStats(),a=equippedAccessories(),t=traits();s.hp+=a.reduce((n,a)=>n+(a.hp||0),0)+(t.has('vigor')?25:0);s.mp+=a.reduce((n,a)=>n+(a.mp||0),0);s.atk=Math.round(s.atk*(t.has('edge')?1.08:1));s.def+=t.has('guard')?3:0;s.move=1+a.reduce((n,a)=>n+(a.move||0),0);return s;};
const oldTown=enterTown;
enterTown=function(initial=false){region='ruins';variant=false;expeditionPower=0;dodgePower=0;trader=null;oldTown(initial);};
const oldEnterDungeon=enterDungeon;
enterDungeon=function(n){if(!Number.isInteger(n)||n<1||n>3)return;region='ruins';variant=false;oldEnterDungeon(n);const b=enemies.find(e=>e.type===3);if(b)b.bossId='guardian';updateLocation();};
const oldEnemy=enemy;
enemy=function(type,x,y){if(type<8)return oldEnemy(type,x,y);oldEnemy(0,x,y);const e=enemies.at(-1),defs=[
 [80,17,43,68,2,24],[62,19,100,130,2.5,25],[100,22,35,225,2.8,29],[90,19,32,170,3,30],[170,28,42,88,2.7,38],[112,24,62,230,2.5,36],[1150,33,35,210,2.8,300],[1850,43,42,250,2.7,450],[2700,55,56,270,2.4,650]
 ][type-8];const [hp,atk,speed,range,ct,xp]=defs;e.type=type;Object.assign(e,{hp,maxHp:hp,atk,speed,range,ct,xp,gold:Math.round(xp*.65)});};
function regionUnlocked(id){return id==='ruins'||id==='sewer'||(id==='frost'?state.bossKills.hydra>0:state.bossKills.frost>0);}
function enterRegion(id,n=1,mutated=false,arena=false){const r=REGIONS[id];if(!r||!regionUnlocked(id)||!Number.isInteger(n)||n<1||n>r.floors)return;
 oldEnterDungeon(1);region=id;variant=mutated;floor=n;hunt=null;enemies=[];objects=objects.filter(o=>!['rescue','stairs','chest','barrel'].includes(o.type));
 state.regionBest[id]=Math.max(state.regionBest[id]||0,n);
 if(arena){world=makeWorld();room(7,4,21,19);objects=[];obj('exit',17,21);player.x=17*TILE+24;player.y=18*TILE+24;}
 else{
 // Each depth opens a different shortcut through the six connected chambers.
 if(n%2===0)corridor(6,19,29,6);else corridor(6,6,29,19);
 const points=[[8,8],[16,5],[20,7],[28,6],[31,8],[5,17],[8,21],[16,17],[21,20],[28,17],[30,20],[18,10],[18,13],[20,3],[7,19],[28,21],[4,20],[29,4]];
 points.slice(0,12+n).forEach(([x,y],i)=>{const t=8+(i+n)%6;enemy(t,x,y);const e=enemies.at(-1),scale=1+(r.level-3)*.1+(n-1)*.17;e.hp=e.maxHp=Math.round(e.hp*scale);e.atk=Math.round(e.atk*(1+(r.level-3)*.05+(n-1)*.08));e.xp=Math.round(e.xp*(1+(r.level-3)*.09+(n-1)*.1));e.gold=Math.round(e.gold*(1+(n-1)*.12));});
 if(n<r.floors)obj('stairs',30,21);obj('treasury',7,21);obj('trader',18,5);obj('altar',18,18);obj('chest',20,3);obj('chest',28,16);
 if(id==='sewer'&&n===4)obj('sewerRescue',29,6,{done:!!state.counts.sewerRescue});
 }
 if(n===r.floors){enemy(BOSSES[r.boss].type,29,19);const e=enemies.at(-1);e.bossId=r.boss;e.mutated=mutated;if(arena){e.x=17*TILE+24;e.y=7*TILE+24;e.alert=999;}if(mutated){e.hp=e.maxHp=Math.round(e.hp*1.8);e.atk=Math.round(e.atk*1.4);e.speed*=1.15;e.xp*=2;}}
 player.inv=2;player.poison=0;trader=null;updateLocation();closeModal();announce(r.name+' 地下'+n+'階'+(mutated?'・変異種':''));save();
}
function enterBoss(id,mutated){const b=BOSSES[id];if(!b||!(state.bossKills[id]>0))return;if(id==='guardian'){
 enterDungeon(3);world=makeWorld();room(7,4,21,19);objects=[];obj('exit',17,21);enemies=[];enemy(3,17,7);const e=enemies[0];e.bossId=id;e.mutated=mutated;e.alert=999;if(mutated){e.hp=e.maxHp=Math.round(e.hp*1.8);e.atk=Math.round(e.atk*1.4);e.speed*=1.15;}player.x=17*TILE+24;player.y=18*TILE+24;player.inv=2;variant=mutated;updateLocation();
 }else enterRegion(b.region,REGIONS[b.region].floors,mutated,true);closeModal();}
const oldLocation=updateLocation;
updateLocation=function(){oldLocation();if(floor&&!hunt&&region!=='ruins'){$('zoneTag').textContent=region.toUpperCase();$('locationName').textContent=REGIONS[region].name;$('mapCaption').textContent='地下 '+floor+' / '+REGIONS[region].floors+'階'+(variant?' 変異種':'');}};
function itemName(id){return WEAPONS.find(w=>w.id===id)?.name||ACCESSORIES.find(a=>a.id===id)?.name||id;}
function awardUnique(id){const isWeapon=WEAPONS.some(w=>w.id===id),list=isWeapon?state.owned:state.accessories;if(list.includes(id)){state.materials.ore+=5;state.tickets+=2;return itemName(id)+'（重複 → 灯鉱石5・ガチャ券2）';}list.push(id);state.bossCollection.push(id);return itemName(id)+'【固有装備】';}
function bossReward(e){const id=e.bossId,b=BOSSES[id];if(!b)return [];state.bossKills[id]=(state.bossKills[id]||0)+1;state.bossDry[id]=(state.bossDry[id]||0)+1;state.tickets+=3;const chance=e.mutated?.16:.10;let reward=[];
 const pity=state.bossDry[id]>=30;if(Math.random()<chance||pity){const missing=b.drops.filter(id=>!state.bossCollection.includes(id)),pool=pity&&missing.length?missing:b.drops;reward.push(awardUnique(pool[Math.floor(Math.random()*pool.length)]));state.bossDry[id]=0;}
 if(id==='hydra')state.counts.hydra++;obj('completion',Math.round((e.x-24)/TILE),Math.round((e.y-24)/TILE));return reward;}
hurtEnemy=function(e,amount,backstab=false){if(e.hp<=0)return;const damage=Math.max(1,Math.round(amount*(e.type===12?.8:1)));e.hp-=damage;e.hurt=.18;e.alert=5;if(e.hp>0)return;
 e.wind=0;const t=traits();state.gold+=e.gold;xp(Math.round(e.xp*(t.has('scholar')?1.15:1)));const mat=['gel','wing','bone','core','silk','bone','ember','shell','sludge','fang','fang','spore','shell','scale','scale','core','ember','core','core','core'][e.type];state.materials[mat]=(state.materials[mat]||0)+(t.has('harvest')?2:1);state.book[e.type]=(state.book[e.type]||0)+1;
 const counter={0:'slimes',1:'bats',2:'bones',4:'spiders',5:'archers',6:'wisps',7:'beetles',9:'rats',10:'worms',11:'spores',13:'serpents'}[e.type];if(counter)state.counts[counter]++;if(region==='sewer'&&!hunt){state.counts.sewerKills++;state.counts.sewerMaterials+=t.has('harvest')?2:1;}
 let notices=[];if(hunt){state.huntKills++;state.counts.hunters++;if(e.type===3||Math.random()<.12)rollLoot(e.type===3);if(e.type===3){state.tickets++;notices.push('ガチャ券1枚');}}
 if(!e.bossId&&e.type!==3&&Math.random()<(.12+(t.has('luck')?.06:0)+.01*skillRank('shadowLuck'))){state.tickets++;notices.push('ガチャ券1枚');}
 if(e.type===3&&!hunt){state.counts.guardian=1;state.cleared=true;if(!state.owned.includes('guardian'))state.owned.push('guardian');notices.push('古灯の剣');if(!e.bossId)e.bossId='guardian';}
 if(e.bossId){notices.push('ボス討伐：ガチャ券3枚',...bossReward(e));if(e.bossId==='guardian')obj('ending',Math.floor(e.x/TILE),Math.floor(e.y/TILE));}
 if(t.has('chain')&&e.poison>0)enemies.filter(n=>n.hp>0&&dist(n,e)<100).forEach(n=>{if(!n.poison)n.poisonTick=1;n.poison=4;});
 if(notices.length)toast(notices.join(' ／ '));for(let i=0;i<9;i++)particles.push({x:e.x,y:e.y,vx:(Math.random()-.5)*90,vy:(Math.random()-.5)*90,life:.7,color:e.bossId?'#e8bc6b':'#80b2a0'});save();};
function randomDrop(level,rarity){const pool=WEAPONS.filter(w=>!w.bossOnly&&w.id!=='guardian'),base=pool[Math.floor(Math.random()*pool.length)],r=RARITIES[rarity],ts=Object.keys(TRAITS),one=ts[Math.floor(Math.random()*ts.length)],two=ts.filter(t=>t!==one);return {uid:'loot-'+(++state.lootSerial),base:base.id,name:r.name+'の'+base.name,rarity,level,bonus:Math.round((2+level*1.8+Math.random()*(3+level))*r.mult),hp:rarity>0?Math.round(level*2*r.mult):0,def:rarity>1?Math.ceil(level*.3):0,value:15+level*5+rarity*25,traits:rarity===3?[one,two[Math.floor(Math.random()*two.length)]]:[one]};}
function receiveDrop(drop){if(state.loot.length>=60){state.gold+=drop.value;return drop.name+'（上限により'+drop.value+'Gで売却）';}state.loot.push(drop);return drop.name;}
rollLoot=function(elite=false){const roll=Math.random(),r=elite?(roll<.15?3:roll<.6?2:1):(roll<.02?3:roll<.16?2:roll<.48?1:0),level=Math.max(1,Math.round(hunt?huntLevel():REGIONS[region].level+floor));const drop=randomDrop(level,r);receiveDrop(drop);if(hunt)hunt.lastLoot=drop.name;toast('武器入手：'+drop.name);return drop;};
function hitWeapon(e,damage,back=false){if(e.hp<=0)return;const t=traits();if(t.has('execution')&&e.hp/e.maxHp<=.3)damage*=1.25;hurtEnemy(e,damage,back);if(t.has('leech'))player.hp=Math.min(stats().hp,player.hp+2);if(t.has('poison')||['venom','serpentfang'].includes(weapon().id)){if(!e.poison)e.poisonTick=1;e.poison=4;}if(t.has('frost'))e.slow=2;}
attack=function(){const w=weapon(),family=w.family||w.id,t=traits(),targets=enemies.filter(e=>e.hp>0&&dist(player,e)<w.range&&los(player,e)).sort((a,b)=>dist(player,a)-dist(player,b));if(!targets.length)return;const e=targets[0];player.dir=face(e.x-player.x,e.y-player.y);player.attack=.3;player.cool=w.ct*(t.has('flow')?.9:1);const back=e.alert<=0&&Math.cos(Math.atan2(player.y-e.y,player.x-e.x)-e.dir)<.25;let damage=stats().atk*(back?(['dagger','venom'].includes(family)?3:2)*(1+.1*skillRank('shadowBack')):1)*(1+expeditionPower);if(t.has('fury')&&player.hp/stats().hp<.35)damage*=1.25;if(t.has('evade')&&dodgePower>0){damage*=1.5;dodgePower=0;}
 if(['bow','staff','crossbow'].includes(family))attacks.push({x:player.x,y:player.y,target:e,life:Math.max(.45,w.range/450+.1),player:true,damage,back,color:family==='staff'?'#a1e6f3':'#dcc595'});
 else{hitWeapon(e,damage,back);if(family==='hammer'&&e.hp>0){e.stun=.65;e.wind=0;e.cool=Math.max(e.cool,.9);}if(['longsword','axe'].includes(family))targets.slice(1).filter(n=>dist(n,e)<90).forEach(n=>hitWeapon(n,damage*.7));fx(e.x,e.y-10,'slash',.65);}if(w.id==='guardian')player.hp=Math.min(stats().hp,player.hp+1);stealth=false;};
const oldDodge=dodge;
dodge=function(){const before=player.dodge;oldDodge();if(player.dodge>before)dodgePower=3;};
const oldUpdate=update;
update=function(dt){dodgePower=Math.max(0,dodgePower-dt);const immune=equippedAccessories().some(a=>a.poisonImmune);if(immune)player.poison=0;else if(floor&&!hunt&&region==='sewer'&&onHazard()&&player.hazardTime>=1.2&&player.poison<=0){player.poison=3;player.poisonTick=1;}oldUpdate(dt);if(player.hp<=0)return;if(player.regen>0){player.regen=Math.max(0,player.regen-dt);player.hp=Math.min(stats().hp,player.hp+6*dt);}if(floor&&region==='shrine'&&!hunt&&Math.floor(clock/12)!==Math.floor((clock-dt)/12)){const living=enemies.filter(e=>e.hp>0&&dist(e,player)<340);if(living.length){const e=living[0];if(e.wind<=0){e.aim={x:player.x,y:player.y};e.wind=e.windMax=1.2;}}}};
function onHazard(){return (Math.floor(player.x/TILE)*3+Math.floor(player.y/TILE)*7)%13===0;}
function hazardMove(){return floor&&!hunt&&region==='frost'&&onHazard()?.55:1;}
const oldResolve=resolveEnemyAttack;
function bolts(e,count,speed=180){for(let i=0;i<count;i++){const a=Math.atan2(e.aim.y-e.y,e.aim.x-e.x)+(i-(count-1)/2)*.32;attacks.push({x:e.x,y:e.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:3,damage:e.atk,color:region==='frost'?'#b0e7f5':'#b3cd6e'});}}
resolveEnemyAttack=function(e){if(e.type<8){oldResolve(e);if(equippedAccessories().some(a=>a.poisonImmune))player.poison=0;return;}e.cool=e.ct;const hit=(r,poison=false)=>{if(dist(e.aim,player)<r&&player.inv<=0&&player.dodge<=0){hitPlayer(e.atk);if(poison&&!equippedAccessories().some(a=>a.poisonImmune)){player.poison=5;player.poisonTick=1;}}fx(e.aim.x,e.aim.y,region==='frost'?'ice':'fire',r/44);};
 if(e.type===9){const angle=Math.atan2(e.aim.y-e.y,e.aim.x-e.x);for(let n=0;n<140;n+=7){move(e,Math.cos(angle)*7,Math.sin(angle)*7,11);if(dist(e,player)<30)hitPlayer(e.atk);}return;}
 if(e.type===10||e.type===13){bolts(e,e.type===10?3:5);return;}if(e.type>=14){if(e.phase%2===0){const count=e.mutated?16:10;for(let i=0;i<count;i++){const a=i*TAU/count+clock*.2;attacks.push({x:e.x,y:e.y,vx:Math.cos(a)*165,vy:Math.sin(a)*165,life:3.5,damage:e.atk,color:REGIONS[region].color});}fx(e.x,e.y,region==='frost'?'ice':'fire',2);}else hit(e.mutated?100:80,e.type===14);return;}hit(e.type===11?75:55,e.type===8||e.type===11);};
function attackRadius(e){return e.type>=14?(e.mutated?100:80):e.type===11?75:e.type>=8?55:e.type===3?105:e.type===2?60:e.type===6?75:48;}
cast=function(id){const s=SPELLS.find(s=>s.id===id);if(!s||!state.spells.includes(id)||!floor)return;const path=state.spellPaths[id]||'base',cost=spellCost(id);if(player.mp<cost){toast('MPが足りません。');return;}if(id==='heal'&&player.hp>=stats().hp){toast('HPは満タンです。');return;}const nearby=enemies.filter(e=>e.hp>0&&dist(player,e)<340&&los(player,e)).sort((a,b)=>dist(player,a)-dist(player,b));if(id==='fire'&&!nearby.length){toast('射程内に敵がいません。');return;}
 player.mp-=cost;closeModal();let power=s.power*(weapon().magic||1)*(1+(state.lv-1)*.04)*(traits().has('arcane')?1.2:1)*spellMultiplier(id);if(path==='burst')power*=1.25;if(path==='swift')power*=.8;
 if(id==='heal'){player.hp=Math.min(stats().hp,player.hp+Math.round(power*(path==='renew'?.65:path==='full'?1.4:1)));if(path==='renew')player.regen=7;fx(player.x,player.y,'heal',1.3);}
 else{const target=id==='fire'?nearby[0]:player;let radius=id==='fire'?(path==='burst'?130:90):id==='ice'?(path==='wide'?210:145):(path==='wide'?300:220);let victims=enemies.filter(e=>e.hp>0&&dist(target,e)<radius&&los(target,e));if(id==='fire'&&path==='pierce'){const dx=target.x-player.x,dy=target.y-player.y,l=Math.hypot(dx,dy)||1;victims=nearby.filter(e=>{const x=e.x-player.x,y=e.y-player.y;return (x*dx+y*dy)/l>0&&Math.abs(x*dy-y*dx)/l<36;});}victims.forEach(e=>{hurtEnemy(e,power);if(id==='ice'){e.slow=path==='wide'?3:4;if(path==='freeze'){e.stun=e.bossId?.6:2;e.wind=0;}}});fx(target.x,target.y,id==='ice'?'ice':'fire',radius/65);}player.cool=.3;save();tone(440,.25,'triangle');};
const oldInteract=interact;
interact=function(){if(!running||modal)return;const o=targetObject();if(!o)return;
 if(o.type==='stairs'&&region!=='ruins'){if(floor<REGIONS[region].floors)openModal('regionStairs');return;}
 if(o.type==='sewerRescue'){o.done=true;state.counts.sewerRescue=1;state.tickets+=3;save();toast('調合師を救出。街の調合屋が開店！ ガチャ券3枚を入手。');return;}
 if(o.type==='treasury'){o.opened=true;state.counts.specialRooms++;state.tickets+=2;state.materials.ore+=2;const drop=rollLoot(false);save();toast('宝物庫：'+drop.name+' / ガチャ券2枚 / 灯鉱石2個');return;}
 if(o.type==='trader'){trader=o;openModal('trader');return;}if(o.type==='altar'){trader=o;openModal('altar');return;}if(o.type==='completion'){openModal('regionComplete');return;}oldInteract();};
Object.assign(objectNames,{treasury:'宝物庫',trader:'旅の行商人',altar:'呪われた祭壇',sewerRescue:'倒れた調合師',completion:'清められた灯'});
function traitText(ts){return (ts||[]).filter(id=>TRAITS[id]).map(id=>TRAITS[id].join('：')).join(' / ');}
function spellCost(id){const s=SPELLS.find(s=>s.id===id),path=state.spellPaths[id];return Math.max(1,s.mp+(path==='burst'?3:0)-(path==='swift'?8:0));}
function commandsHTML(){return '<p class="lead">選択中は時間停止。魔法は選ぶと発動します。</p><div class="cards">'+state.spells.map(id=>{const s=SPELLS.find(s=>s.id===id),mp=spellCost(id);return '<div class="card"><span class="tag">MAGIC · MP '+mp+'</span><h3>'+s.name+'</h3><p>'+s.desc+'<br>派生：'+({base:'基本',burst:'爆裂',pierce:'貫通',wide:'広域',freeze:'凍結',renew:'再生',full:'快癒',swift:'省力'}[state.spellPaths[id]||'base'])+'</p>'+btn('発動する','cast:'+id,!floor||player.mp<mp)+'</div>';}).join('')+'<div class="card"><h3>回復薬 × '+state.potions+'</h3><p>HP65回復・毒を解除。</p>'+btn('使う','potion:hp',!state.potions||(player.hp>=stats().hp&&!(player.poison>0)))+'</div><div class="card"><h3>魔力薬 × '+state.ethers+'</h3><p>MP35回復。</p>'+btn('使う','potion:mp',!state.ethers||player.mp>=stats().mp)+'</div></div>';}
function accessoryRows(){return '<p class="muted">指輪・護符を2枠まで装備。同じ品は重ねられません。同名の固有効果は重複しません。</p><div class="notice">枠1：'+(state.accessorySlots[0]?itemName(state.accessorySlots[0]):'未装備')+' '+btn('外す','accRemove:0',!state.accessorySlots[0])+'<br>枠2：'+(state.accessorySlots[1]?itemName(state.accessorySlots[1]):'未装備')+' '+btn('外す','accRemove:1',!state.accessorySlots[1])+'</div>'+ACCESSORIES.filter(a=>state.accessories.includes(a.id)).map(a=>`<div class="list-row"><div><b>◈ ${a.name}</b><p>${traitText(a.traits)}${a.hp?' / HP+'+a.hp:''}${a.mp?' / MP+'+a.mp:''}${a.poisonImmune?' / 毒無効':''}${a.move?' / 移動速度+10%':''}</p></div><div class="loot-actions">${btn('枠1','acc0:'+a.id,state.accessorySlots.includes(a.id))}${btn('枠2','acc1:'+a.id,state.accessorySlots.includes(a.id))}</div></div>`).join('');}
function drawGacha(count){if(floor||![1,10].includes(count)||state.tickets<count)return;lastRewards=[];
 for(let i=0;i<count;i++){state.tickets--;state.gachaTotal++;state.gachaCount++;state.gachaDry++;const roll=Math.random();let rank=roll<.05||state.gachaDry>=50?2:roll<.30||state.gachaCount>=10?1:0;if(rank>=1)state.gachaCount=0;if(rank===2)state.gachaDry=0;
 let text;if(rank===0&&Math.random()<.45){state.potions+=2;state.ethers++;text='R 回復薬2個・魔力薬1個';}
 else if(Math.random()<.45){const pool=ACCESSORIES.filter(a=>!a.bossOnly&&a.tier===(rank===2?2:rank===1?1:0)),a=pool[Math.floor(Math.random()*pool.length)];if(state.accessories.includes(a.id)){state.materials.ore+=3;text=['R','SR','SSR'][rank]+' '+a.name+'（重複 → 灯鉱石3）';}else{state.accessories.push(a.id);text=['R','SR','SSR'][rank]+' '+a.name;}}
 else{text=['R','SR','SSR'][rank]+' '+receiveDrop(randomDrop(Math.max(1,state.lv),rank===2?3:rank===1?2:0));}
 lastRewards.push(text);
 }state.gachaLog=lastRewards.slice();save();renderModal();hud();tone(770,.2);}
function bossRows(){return Object.entries(BOSSES).map(([id,b])=>{const n=state.bossKills[id]||0;return `<div class="card"><span class="tag">${REGIONS[b.region].name} / 討伐 ${n}回</span><h3>${b.name}</h3><p>${b.drops.map(d=>(state.bossCollection.includes(d)?'◆ ':'◇ ')+itemName(d)).join('<br>')}<br>通常：各5% / 変異種：各8%<br>固有装備なし ${state.bossDry[id]||0} / 30回。30回目は未入手を優先して1個確定。<br>毎回ガチャ券3枚。重複品は鉱石5・券2。</p>${btn('再戦','boss:'+id,!n)} ${btn('変異種に挑む','mutant:'+id,!n)}</div>`;}).join('');}
function expansionHTML(kind){
 if(kind==='expeditions')return '<p class="lead">街の排水異常から始まる、新しい灯の探索。下り階段は各階の南東にあります。</p><div class="cards">'+Object.entries(REGIONS).filter(([id])=>id!=='tower').map(([id,r])=>`<div class="card"><span class="tag">推奨 Lv.${r.level}〜 / 全${r.floors}階</span><h3>${r.name}</h3><p>${id==='sewer'?'緑の筋の床は毒沼。4階の調合師を救出し、5階の三頭蛇から水源を取り戻そう。':id==='frost'?'青い筋の床は移動が遅くなる氷床。地下水路のボス撃破で解禁。':id==='shrine'?'周期的に敵が炎の予兆を放つ神殿。氷王撃破で解禁。':'最初の灯の物語。'}<br>到達：${state.regionBest[id]|| (id==='ruins'?state.best:0)}階</p>${btn(regionUnlocked(id)?'探索を始める':'前の地域のボス撃破で解禁',id==='ruins'?'enter:1':'region:'+id,!regionUnlocked(id),'primary')}</div>`).join('')+'</div>';
 if(kind==='bosses')return '<p class="lead">最初は各地域の最深部へ。一度倒すと、ここからボスに直接再戦できます。固有装備はガチャ・通常の戦利品からは出ません。</p><div class="cards">'+bossRows()+'</div>';
 if(kind==='gacha')return `<div class="notice"><b>所持ガチャ券 ${state.tickets}枚</b> / 累計 ${state.gachaTotal}回<br>通常敵12%（幸運装備で18%）、狩場の強敵1枚、ボス3枚、宝物庫2枚。<br>券以外は不要。所持金は消費しません。</div><div class="tabs">${btn('1回引く（券1枚）','gacha:1',state.tickets<1,'primary')}${btn('10回引く（券10枚）','gacha:10',state.tickets<10)}</div><p>通常確率 R70% / SR25% / SSR5%。SR以上なし10回目でSR以上、SSRなし50回目でSSR確定。<br>SR以上まで最大${10-state.gachaCount}回 / SSRまで最大${50-state.gachaDry}回。単発でも引き継ぎます。</p><div class="reward-list" aria-live="polite">${state.gachaLog.map(s=>'<p>'+s+'</p>').join('')}</div><details><summary>排出内容・重複時の扱い</summary><p>R：良品武器、銅の指輪・狩人の護符・疾風の足環・月読の首飾り、または薬セット。<br>SR：希少武器、毒蛇の指輪・見切りの護符。SSR：伝説武器、巡りの金環・賢者の印。戦利品武器の固有効果はランダム。<br>アクセサリー重複は灯鉱石3個。武器は個別性能で所持し、60個を超える分は売却。ボス専用品は対象外です。</p></details>`;
 if(kind==='codex')return '<p class="lead">討伐で記録される魔物図鑑。ボス装備は専用の再戦画面で入手先と確率を確認できます。</p>'+btn('ボスと固有装備','open:bosses')+ENEMY_NAMES.map((name,i)=>`<div class="list-row"><div><b>${state.book[i]?'◆':'◇'} ${name}</b><p>${state.book[i]?'討伐 '+state.book[i]+'体 / '+(['雫','翼','骨','核','糸','骨','残り火','鋼殻','汚泥','牙','牙','胞子','鋼殻','鱗','鱗','核','残り火','核','核','核','灯鉱石'][i])+'を入手。'+(i===20?'銀灯の大結晶を確定入手。':i>=14||i===3?'ボス券3枚・固有装備抽選。':'通常敵のガチャ券率12%。'):'未討伐。探索して記録を埋めよう。'}</p></div></div>`).join('')+'<div class="notice">発見 '+Object.keys(state.book).length+' / '+ENEMY_NAMES.length+'種 / 固有装備 '+state.bossCollection.length+' / '+Object.values(BOSSES).flatMap(b=>b.drops).length+'種</div><h3>収集報酬</h3>'+[5,10,17,20].map(n=>'<div class="list-row"><div><b>'+n+'種討伐の報酬</b><p>ガチャ券'+(n===5?3:n===10?10:20)+'枚・灯鉱石5個</p></div>'+btn(state.codexClaimed.includes(n)?'受取済み':'受け取る','codexClaim:'+n,state.codexClaimed.includes(n)||Object.keys(state.book).length<n)+'</div>').join('');
 if(kind==='commands')return commandsHTML();
 if(kind==='alchemy')return state.counts.sewerRescue?`<p class="lead">「水路で助けてくれたお礼だ。素材を薬にしよう。」</p><p>所持：汚泥${state.materials.sludge} / 胞子${state.materials.spore} / 牙${state.materials.fang}</p><div class="cards"><div class="card"><h3>回復薬3個</h3><p>汚泥3・胞子1で調合。</p>${btn('調合','craft:hp',state.materials.sludge<3||state.materials.spore<1)}</div><div class="card"><h3>魔力薬2個</h3><p>胞子2・牙2で調合。</p>${btn('調合','craft:mp',state.materials.spore<2||state.materials.fang<2)}</div></div>`:'<p class="lead">調合屋はまだ閉まっています。毒沼の地下水路4階で調合師を救出してください。</p>';
 if(kind==='regionStairs')return '<p class="lead">次の区画へ。HP・MPは現在の値を引き継ぎます。</p>'+btn('地下'+(floor+1)+'階へ','descend',false,'primary')+' '+btn('街へ帰還','town');
 if(kind==='regionComplete')return '<p class="lead">失われた灯が道を照らし始めた。<br>街の「ボス再戦」から何度でも挑めます。さらに奥の地域も確認しましょう。</p>'+btn('街に戻る','town',false,'primary');
 if(kind==='trader')return '<p class="lead">「寄り道には、寄り道の品を。」各階で武器を1回購入できます。</p>'+btn('回復薬 '+goldCost(15)+'G','trader:hp',state.gold<goldCost(15))+' '+btn('ランダム武器 '+goldCost(180)+'G','trader:weapon',state.gold<goldCost(180)||trader?.bought);
 if(kind==='altar')return `<p class="lead">血を捧げれば、この探索中の武器攻撃+30%。休息を選ぶとHP50%回復する代わりに、生きている敵の攻撃力+20%。街へ帰ると解除。</p>${btn('HP20%を捧げる','altar:power',player.hp<=Math.ceil(stats().hp*.2)||trader?.done)} ${btn('呪われた休息','altar:rest',trader?.done)}`;
 return null;
}
const oldRender=renderModal;
renderModal=function(){oldRender();const names={commands:'魔法と道具',expeditions:'地域探索',bosses:'ボス再戦・固有装備',gacha:'灯籤の抽選所',codex:'魔物と装備の図鑑',alchemy:'帰ってきた調合師',regionStairs:'次の区画へ',regionComplete:'取り戻した灯',trader:'旅の行商人',altar:'呪われた祭壇'};const html=expansionHTML(modal);if(html!==null){$('modalEyebrow').textContent='THE EMBER BELOW · EXPANSION';$('modalTitle').textContent=names[modal];$('modalBody').innerHTML=html;}
 if(modal==='equipment'){$('modalBody').innerHTML='<div class="tabs">'+btn('アクセサリー '+state.accessories.length,'tab:accessories')+'</div>'+$('modalBody').innerHTML;if(currentTab==='accessories')$('modalBody').innerHTML+=accessoryRows();$('modalBody').innerHTML+='<div class="notice">発動中：'+(traitText([...traits()])||'なし')+'</div>';}
 if(modal==='gate')$('modalBody').innerHTML+= '<hr>'+btn('新しい地域を探索','open:expeditions')+' '+btn('ボス再戦','open:bosses');
 if(modal==='journal')$('modalBody').innerHTML+='<hr><div class="tabs">'+btn('魔物図鑑','open:codex')+btn('地域と進行','open:expeditions',!!floor)+btn('固有装備の入手先','open:bosses',!!floor)+'</div><p>追加地域：水路5階・氷鉱山4階・廃神殿4階。券は敵から入手し、街の抽選所で使用。アクセサリーは装備メニューへ。</p>';
 if(modal==='teacher'){$('modalBody').innerHTML+='<hr><h3>魔法の派生（街で無料切替）</h3>'+SPELLS.filter(s=>state.spells.includes(s.id)&&['fire','ice','heal','nova'].includes(s.id)).map(s=>{const paths={fire:[['burst','爆裂：威力+25%・半径130・MP+3'],['pierce','貫通：直線340の敵を貫く']],ice:[['wide','広域：半径210・鈍足3秒'],['freeze','凍結：2秒停止（ボス0.6秒）']],heal:[['renew','再生：即時65%回復＋7秒で42回復'],['full','快癒：回復量+40%']],nova:[['wide','大環：半径300'],['swift','省力：威力-20%・消費MP-8']]}[s.id];return '<div class="card"><h3>'+s.name+'</h3><p>現在：'+(paths.find(p=>p[0]===state.spellPaths[s.id])?.[1]||'基本')+'</p>'+btn('基本','path:'+s.id+'-base',!floor&&!(state.spellPaths[s.id]&&state.spellPaths[s.id]!=='base')||!!floor)+paths.map(([id,label])=>btn(label,'path:'+s.id+'-'+id,!!floor||state.spellPaths[s.id]===id)).join('')+'</div>';}).join('');}
 if(modal==='forge'){$('modalBody').innerHTML+='<hr><h3>工房の発展</h3>'+(!state.forgeUnlocked?'<p>灯鉱石20・'+goldCost(150)+'Gを納品すると、ランダム武器の効果を付け替えられます。</p>'+btn('工房へ納品','forgeUnlock',state.materials.ore<20||state.gold<goldCost(150)):'<p>付け替えはランダム武器専用。鉱石3・'+goldCost(120)+'Gで、現在の効果を別の効果に変更します。ボス固有効果は保持されます。</p>'+btn('装備中の武器の効果を付け替え','reforge',!weapon().loot||state.gold<goldCost(120)||state.materials.ore<3));}
 if(modal==='commands'&&player.poison>0)$('modalBody').innerHTML+='<p>毒状態。回復薬で毒も解除できます。</p>';
 if(modal==='help')$('modalBody').innerHTML+='<hr><p>ボス固有装備：通常各5% / 変異種各8%。未入手優先の30周救済。ガチャ券は通常敵12%、ボス3枚。抽選所は街で利用。新地域・ボス再戦・図鑑は街の施設から。</p>';
};
const oldAction=action;
action=function(raw){const [a,id]=raw.split(':');const townOnly=['region','boss','mutant','gacha','path','craft','forgeUnlock','reforge'];if(floor&&townOnly.includes(a))return;
 if(a==='buyweapon'&&WEAPONS.find(w=>w.id===id)?.bossOnly)return;
 if(a==='codexClaim'){const n=Number(id);if([5,10,17,20].includes(n)&&Object.keys(state.book).length>=n&&!state.codexClaimed.includes(n)){state.codexClaimed.push(n);state.tickets+=n===5?3:n===10?10:20;state.materials.ore+=5;save();renderModal();hud();}return;}
 if(a==='huntRule'){if(!floor&&['standard','swarm','ranged','attrition'].includes(id)){state.huntRule=id;save();renderModal();}return;}
 if(a==='open'){if(['expeditions','bosses','gacha','alchemy'].includes(id)&&floor)return;return openModal(id);}
 if(a==='region')return enterRegion(id);if(a==='descend'){if(region!=='ruins'&&floor<REGIONS[region].floors)return enterRegion(region,floor+1);return;}
 if(a==='boss'||a==='mutant')return enterBoss(id,a==='mutant');if(a==='gacha')return drawGacha(Number(id));
 if(a==='acc0'||a==='acc1'){if(state.accessories.includes(id)&&!state.accessorySlots.includes(id))state.accessorySlots[a==='acc0'?0:1]=id;player.hp=Math.min(player.hp,stats().hp);player.mp=Math.min(player.mp,stats().mp);}
 else if(a==='accRemove'){if(id==='0'||id==='1')state.accessorySlots[Number(id)]=null;player.hp=Math.min(player.hp,stats().hp);player.mp=Math.min(player.mp,stats().mp);}
 else if(a==='path'){const [spell,path]=id.split('-'),valid={fire:['base','burst','pierce'],ice:['base','wide','freeze'],heal:['base','renew','full'],nova:['base','wide','swift']};if(state.spells.includes(spell)&&valid[spell]?.includes(path))state.spellPaths[spell]=path;}
 else if(a==='craft'){if(!state.counts.sewerRescue)return;if(id==='hp'&&state.materials.sludge>=3&&state.materials.spore>=1){state.materials.sludge-=3;state.materials.spore--;state.potions+=3;}if(id==='mp'&&state.materials.spore>=2&&state.materials.fang>=2){state.materials.spore-=2;state.materials.fang-=2;state.ethers+=2;}}
 else if(a==='forgeUnlock'){if(!state.forgeUnlocked&&state.gold>=goldCost(150)&&state.materials.ore>=20){state.gold-=goldCost(150);state.materials.ore-=20;state.forgeUnlocked=true;}}
 else if(a==='reforge'){if(state.forgeUnlocked&&weapon().loot&&state.gold>=goldCost(120)&&state.materials.ore>=3){const d=weapon().loot,pool=Object.keys(TRAITS).filter(t=>!(d.traits||[]).includes(t));state.gold-=goldCost(120);state.materials.ore-=3;const first=pool[Math.floor(Math.random()*pool.length)];d.traits=[first,...(d.rarity===3?(d.traits||[]).slice(1,2):[])];toast('固有効果を付け替えました：'+traitText(d.traits));}}
 else if(a==='trader'&&modal==='trader'&&trader){if(id==='hp'&&state.gold>=goldCost(15)){state.gold-=goldCost(15);state.potions++;}if(id==='weapon'&&!trader.bought&&state.gold>=goldCost(180)){state.gold-=goldCost(180);trader.bought=true;rollLoot(false);}}
 else if(a==='altar'&&modal==='altar'&&trader&&!trader.done){const cost=Math.ceil(stats().hp*.2);if(id==='power'&&player.hp>cost){player.hp-=cost;expeditionPower=.3;trader.done=true;}if(id==='rest'){player.hp=Math.min(stats().hp,player.hp+stats().hp*.5);enemies.filter(e=>e.hp>0).forEach(e=>e.atk=Math.round(e.atk*1.2));trader.done=true;}if(trader.done){save();closeModal();return;}}
 else{return oldAction(raw);}
 save();renderModal();hud();};
const oldHud=hud;
hud=function(){oldHud();const b=enemies.find(e=>e.bossId&&e.hp>0&&dist(e,player)<500);if(b){$('bossHud').hidden=false;$('bossBar').style.width=b.hp/b.maxHp*100+'%';$('bossHud').querySelector('span').textContent=(b.mutated?'変異・':'')+BOSSES[b.bossId].name;}const label=$('gachaBalance');if(label)label.textContent='装備ガチャ 券'+state.tickets;};
const oldMaterialRows=materialRows;
materialRows=function(sell=false){return oldMaterialRows(sell)+[['sludge','水路の汚泥'],['fang','水棲獣の牙'],['spore','湿地の胞子'],['scale','淵蛇の鱗']].map(([id,name])=>'<div class="list-row"><div><b>'+name+' × '+state.materials[id]+'</b><p>調合素材。調合師を地下水路4階から救出すると利用できます。</p></div></div>').join('');};
// New monsters are native pixel art, avoiding enlarged/recolored existing sprites.
const oldDrawEnemy=drawEnemy;
drawEnemy=function(e){if(e.type<8){oldDrawEnemy(e);return;}const boss=e.type>=14,sz=boss?4:2,phase=Math.floor(clock*6+e.seed)%2,palette=region==='frost'?['#234d64','#4f9eb7','#b2e5e9']:region==='shrine'?['#56352f','#b36b4b','#f2c178']:['#2e4438','#73945b','#b2c980'];shadow(e.x,e.y,boss?37:20);ctx.save();ctx.translate(Math.round(e.x)-16*sz,Math.round(e.y)-24*sz);ctx.scale(sz,sz);if(e.hurt)ctx.globalAlpha=.55;
 const rect=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);},[dark,mid,light]=palette;
 if(e.type===8){rect(5,12,22,10,dark);rect(8,8+phase,17,12,mid);rect(12,7+phase,9,5,light);rect(9,21,5,3,mid);rect(23,21,5,3,mid);}
 else if(e.type===9){rect(6,11,20,10,dark);rect(10,10,16,9,mid);rect(20,7,5,6,mid);rect(9,19,4,5,light);rect(22,19,4,5,light);rect(3,16,7,2,light);rect(0,12+phase,5,2,mid);}
 else if(e.type===10){for(let i=0;i<5;i++){rect(3+i*5,13+(i+phase)%2*3,7,7,dark);rect(4+i*5,13+(i+phase)%2*3,4,4,mid);}rect(24,10,6,10,light);}
 else if(e.type===11){rect(12,14,8,10,light);rect(9,21,14,3,dark);rect(4,8,24,8,dark);rect(7,5,18,8,mid);rect(11,3,10,5,light);rect(9,9,3,3,'#e5d6a0');rect(22,10,3,3,'#e5d6a0');}
 else if(e.type===12){rect(9,8,15,14,dark);rect(10,5,13,7,'#b5aa7d');rect(8,11,18,8,'#71857c');rect(10,11,14,3,'#b5c6a3');rect(7,12,5,10,mid);rect(22,11,3,13,'#bcb388');rect(10,21,5,4,dark);rect(19,21,5,4,dark);}
 else if(e.type===13){rect(5,20,21,4,dark);rect(8,16,16,5,mid);rect(17,10,7,9,mid);rect(15,6,12,7,light);rect(23,7,5,3,dark);rect(10,21,12,2,light);}
 else if(e.type===14){rect(5,17,24,7,dark);for(let i=0;i<3;i++){rect(7+i*8,6+(i%2)*3,4,15,mid);rect(4+i*8,3+(i%2)*3,10,6,light);rect(10+i*8,5+(i%2)*3,2,2,'#e3a875');}rect(8,20,20,3,light);}
 else if(e.type===15){rect(7,8,19,15,dark);rect(10,5,13,14,mid);rect(13,2,8,20,light);rect(5,12,6,9,mid);rect(24,7,3,17,light);for(let i=0;i<3;i++)rect(9+i*6,1,3,6,light);}
 else{rect(11,9,11,14,mid);for(let i=0;i<4;i++){rect(2+i*3,6+i*3,7,5,light);rect(23-i*3,6+i*3,7,5,light);}rect(14,4,7,7,light);rect(19,6,6,3,'#e2ab59');rect(12,21,4,5,light);rect(19,21,4,5,light);}
 if(e.type!==14){rect(e.type===9?22:13,11,2,2,'#f2e6ad');rect(e.type===9?25:20,11,2,2,'#f2e6ad');}ctx.restore();if(!boss&&e.hp<e.maxHp){ctx.fillStyle='#081319';ctx.fillRect(e.x-21,e.y-56,42,4);ctx.fillStyle='#b6bc74';ctx.fillRect(e.x-21,e.y-56,42*e.hp/e.maxHp,4);}};
const oldDrawObject=drawObject;
drawObject=function(o){const alias={treasury:'chest',trader:'merchant',altar:'rest',sewerRescue:'rescue',completion:'ending'}[o.type];if(alias)oldDrawObject({...o,type:alias});else oldDrawObject(o);};
const oldTile=tile;
tile=function(i,x,y){oldTile(i,x,y);if(floor&&!hunt&&region!=='ruins'){ctx.fillStyle={sewer:'#74a3391c',frost:'#70b9e92c',shrine:'#df642b28'}[region];ctx.fillRect(x,y,TILE,TILE);if((Math.floor(x/TILE)*3+Math.floor(y/TILE)*7)%13===0&&world.map[y/TILE]?.[x/TILE]){ctx.fillStyle=REGIONS[region].color;ctx.globalAlpha=.4;ctx.fillRect(x+9,y+31,24,3);ctx.fillRect(x+14,y+35,12,2);ctx.globalAlpha=1;}}};
const HUNT_RULES={standard:'通常',swarm:'大群：敵数2倍',ranged:'弾幕：遠距離敵中心',attrition:'消耗戦：群れの間の自動回復なし'};
const oldHuntGate=huntGateHTML;
huntGateHTML=function(){return '<h3>周回ルール</h3><p>追加ルールでは敵EXP+35%・殲滅報酬金+50%。回復薬はどのルールでも使用できます。</p><div class="tabs">'+Object.entries(HUNT_RULES).map(([id,name])=>btn(name,'huntRule:'+id,(state.huntRule||'standard')===id)).join('')+'</div>'+oldHuntGate();};
const oldSpawnWave=spawnHuntWave;
spawnHuntWave=function(){oldSpawnWave();hunt.rule=state.huntRule||'standard';if(hunt.rule==='swarm'){const originals=enemies.filter(e=>e.type!==3).slice();for(const e of originals){enemy(e.type,(e.x-24)/TILE,(e.y-24)/TILE);Object.assign(enemies.at(-1),{hp:e.maxHp,maxHp:e.maxHp,atk:e.atk,xp:e.xp,gold:e.gold,alert:999});}}
 if(hunt.rule==='ranged')enemies.forEach(e=>{if(e.type!==3){e.type=5;e.range=230;e.ct=2.6;}});if(hunt.rule!=='standard')enemies.forEach(e=>e.xp=Math.round(e.xp*1.35));announce('残響の狩場・'+HUNT_RULES[hunt.rule]+' 第'+hunt.wave+'群');};
const oldClearWave=clearHuntWave;
clearHuntWave=function(){const hp=player.hp,mp=player.mp;oldClearWave();if(hunt.rule==='attrition'){player.hp=hp;player.mp=mp;}if(hunt.rule&&hunt.rule!=='standard'){const bonus=Math.floor(hunt.bonus*.5);state.gold+=bonus;hunt.bonus+=bonus;}save();toast('第'+hunt.wave+'群を殲滅：'+hunt.reward+' / '+hunt.bonus+'G。次の群れへ進めます。');};
const oldHuntClearHTML=huntClearHTML;
huntClearHTML=function(){const html=oldHuntClearHTML();return hunt?.rule==='attrition'?html.replace('HP20%・MP12回復済み','消耗戦：自動回復なし'):html;};
