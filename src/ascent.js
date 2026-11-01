// Tower, build progression, inventory tools, and campaign balance.
let tower=null, lootFilter={rarity:'all',family:'all',trait:'all'}, restoreCandidate=null;
REGIONS.tower={name:'灯試しの塔',floors:30,level:4,boss:'towerVoid',color:'#ad92cb'};
const SKILLS=[
 ['bladeEdge','剣技','刃の手入れ','攻撃力+2'],['bladeGuard','剣技','受け流し','防御力+1'],['bladeFlow','剣技','流れる連撃','通常攻撃の間隔-4%'],['bladeCleave','剣技','追い刃','近接命中で周囲にも12%ダメージ'],['bladeVital','剣技','不屈','最大HP+8'],['bladeFinish','剣技','追い詰め','HP35%以下への武器ダメージ+6%'],
 ['magicPower','魔導','魔力の研鑽','攻撃魔法威力+6%'],['magicPool','魔導','魔力の器','最大MP+8'],['magicSaving','魔導','節約詠唱','消費MP-1'],['magicRecovery','魔導','魔力循環','毎秒MP回復+0.15'],['magicHealer','魔導','癒やしの心得','回復魔法の威力+8%'],['magicFocus','魔導','灯の回収','敵撃破でMP+1'],
 ['shadowStep','影技','軽い足取り','移動速度+3%'],['shadowEvasion','影技','身かわし','回避の再使用時間-6%'],['shadowPoison','影技','毒の知識','毒の毎秒ダメージ+2'],['shadowLuck','影技','拾い物上手','通常敵の券率+1ポイント'],['shadowPotion','影技','薬の心得','回復薬の回復量+10%'],['shadowBack','影技','忍びの一撃','不意打ちの威力+10%']
].map(([id,branch,name,desc],i)=>({id,branch,name,desc,max:2,previous:null,index:i%6}));
SKILLS.forEach((sk,i)=>{if(sk.index)sk.previous=SKILLS[i-1].id;});
const SETS={
 serpent:{name:'淵蛇',weapons:['serpentfang','setSerpentBlade'],armors:['setSerpentMail'],accessories:['tidePearl','setSerpentRing'],desc:'毒ダメージ+4・毒撃破時に周囲へ伝染'},
 frost:{name:'氷王',weapons:['frostlance','setFrostBlade'],armors:['setFrostMail'],accessories:['frostHeart','setFrostRing'],desc:'回避時に周囲125へ氷の衝撃波（攻撃力45%）'},
 ash:{name:'不死灰',weapons:['ashstaff','setAshBlade'],armors:['setAshMail'],accessories:['phoenixCharm','setAshRing'],desc:'毎秒MP回復+0.8・敵撃破でMP2回復'},
 guardian:{name:'灯守り',weapons:['sunblade','setGuardianBlade'],armors:['setGuardianMail'],accessories:['watcherSeal','setGuardianRing'],desc:'最大HP+40・防御+4・敵撃破でHP5回復'}
};
for(const [key,stem,family,atk,range,ct,trait] of [
 ['serpent','Serpent','dagger',20,66,.4,'poison'],['frost','Frost','spear',32,126,1.05,'frost'],['ash','Ash','staff',24,250,.95,'arcane'],['guardian','Guardian','sword',28,85,.75,'guard']
]){
 const name=SETS[key].name;
 WEAPONS.push({id:'set'+stem+'Blade',name:name+'の継承武器',family,atk,range,ct,trait,icon:{dagger:2,spear:3,staff:5,sword:0}[family],price:0,bossOnly:true,setOnly:true,magic:family==='staff'?1.4:1,desc:'塔の紋章8個で交換。'+name+'セットの一部。'});
 ARMOR.push({id:'set'+stem+'Mail',name:name+'の外套',def:key==='guardian'?8:5,hp:25,price:0,setOnly:true,desc:'防御+'+(key==='guardian'?8:5)+' / HP+25 / '+name+'セット。塔の紋章6個。'});
 ACCESSORIES.push({id:'set'+stem+'Ring',name:name+'の紋環',traits:[trait],bossOnly:true,setOnly:true});
}
const TOWER_BOSSES={towerMirror:{name:'鏡刃の番人',type:17,stage:10,drop:'mirrorEdge'},towerOracle:{name:'星文の司書',type:18,stage:20,drop:'oracleStaff'},towerVoid:{name:'虚灯の王',type:19,stage:30,drop:'voidSpear'}};
for(const [id,b] of Object.entries(TOWER_BOSSES))BOSSES[id]={name:b.name,type:b.type,region:'tower',drops:[b.drop]};
for(const [id,name,family,atk,range,ct,trait] of [['mirrorEdge','鏡刃・残月','longsword',48,104,.72,'evade'],['oracleStaff','星綴りの天杖','staff',38,310,.8,'arcane'],['voidSpear','虚灯の王槍','spear',60,155,1,'execution']])WEAPONS.push({id,name,family,atk,range,ct,trait,price:0,bossOnly:true,icon:family==='staff'?5:family==='spear'?3:1,magic:family==='staff'?1.4:1,desc:'塔の専用ボスから低確率で入手。'+TRAITS[trait].join('：')});
ENEMY_NAMES.push('鏡刃の番人','星文の司書','虚灯の王');
function skillRank(id){return state.skills[id]||0;}
function skillSpent(s=state){return Object.values(s.skills).reduce((n,v)=>n+v,0);}
function skillPoints(){return Math.max(0,state.lv-1-skillSpent());}
function setCount(id){const s=SETS[id],w=weapon().id;return Number(s.weapons.includes(w))+Number(s.armors.includes(state.armor))+state.accessorySlots.filter(a=>s.accessories.includes(a)).length;}
function setActive(id){return setCount(id)>=2;}
const ascentFresh=fresh;
fresh=function(){return {...ascentFresh(),skills:{},difficulty:'adventure',towerBest:0,towerUnlocked:1,towerFirst:[],towerMarks:0,towerConquered:false,gachaShards:0};};

// Backup imports never use user-controlled names or HTML, and do not replace progress until confirmed.
function normalizeSave(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.version!==1)throw Error('対応する冒険データではありません。');
 const s=fresh(),integer=(v,fallback=0,max=1e12)=>Number.isFinite(v)&&v>=0?Math.min(max,Math.floor(v)):fallback;
 for(const k of ['lv','xp','gold','potions','ethers','tickets','lootSerial','huntBest','huntKills','best','deaths','gachaCount','gachaDry','gachaTotal','towerBest','towerUnlocked','towerMarks','gachaShards'])s[k]=integer(raw[k],s[k],k==='lv'?10000:1e12);
 if(raw.gachaShards===undefined)s.gachaShards=s.gachaTotal;
 s.lv=Math.max(1,s.lv);s.xp=Math.min(s.xp,39+(s.lv-1)*30);s.best=Math.min(3,s.best);s.towerBest=Math.min(30,s.towerBest);s.towerUnlocked=clamp(s.towerUnlocked,1,Math.min(30,Math.floor(s.towerBest/5)*5+1));s.gachaCount=Math.min(9,s.gachaCount);s.gachaDry=Math.min(49,s.gachaDry);
 const known=(list,ids)=>Array.isArray(list)?[...new Set(list.filter(id=>ids.includes(id)))]:[];
 const ids={owned:WEAPONS.map(w=>w.id),armors:ARMOR.map(a=>a.id),accessories:ACCESSORIES.map(a=>a.id),spells:SPELLS.map(s=>s.id),accepted:QUESTS.map(q=>q.id),claimed:QUESTS.map(q=>q.id),bossCollection:Object.values(BOSSES).flatMap(b=>b.drops)};
 for(const k in ids)s[k]=known(raw[k],ids[k]);if(!s.owned.includes('sword'))s.owned.unshift('sword');if(!s.armors.includes('travel'))s.armors.unshift('travel');if(!s.spells.includes('fire'))s.spells.unshift('fire');
 for(const k of ['materials','counts'])for(const id in s[k])s[k][id]=integer(raw[k]?.[id]);
 for(const k of ['bossKills','bossDry'])for(const id in BOSSES)s[k][id]=integer(raw[k]?.[id],0,k==='bossDry'?29:1e12);
 // Pre-expansion story clears count as a defeated guardian, unlocking direct replay.
 if(raw.cleared||s.counts.guardian)s.bossKills.guardian=Math.max(1,s.bossKills.guardian);
 for(const id in REGIONS)s.regionBest[id]=integer(raw.regionBest?.[id],0,REGIONS[id].floors);
 for(let i=0;i<ENEMY_NAMES.length;i++){const n=integer(raw.book?.[i]);if(n)s.book[i]=n;}
 s.cleared=!!raw.cleared;s.forgeUnlocked=!!raw.forgeUnlocked;s.towerConquered=!!raw.towerConquered&&s.towerBest===30;s.difficulty=raw.difficulty==='veteran'?'veteran':'adventure';
 s.towerFirst=known(raw.towerFirst,Array.from({length:30},(_,i)=>i+1));s.codexClaimed=known(raw.codexClaimed,[5,10,17,20]);s.huntRule=Object.hasOwn(HUNT_RULES,raw.huntRule)?raw.huntRule:'standard';
 s.loot=[];const uids=new Set();if(Array.isArray(raw.loot))for(const d of raw.loot.slice(0,60)){
  if(!d||typeof d.uid!=='string'||!/^loot-\d+$/.test(d.uid)||uids.has(d.uid))continue;const w=WEAPONS.find(w=>w.id===d.base&&!w.bossOnly&&w.id!=='guardian');if(!w)continue;uids.add(d.uid);const rarity=integer(d.rarity,0,3),level=Math.max(1,integer(d.level,1,10000));
  s.loot.push({uid:d.uid,base:w.id,name:RARITIES[rarity].name+'の'+w.name,rarity,level,bonus:integer(d.bonus,0,100000),hp:integer(d.hp,0,100000),def:integer(d.def,0,100000),value:integer(d.value,0,1000000),traits:known(d.traits,Object.keys(TRAITS)).slice(0,2),locked:d.locked===true});s.lootSerial=Math.max(s.lootSerial,integer(Number(d.uid.slice(5))));
 }
 s.weapon=[...s.owned,...s.loot.map(d=>d.uid)].includes(raw.weapon)?raw.weapon:'sword';s.armor=s.armors.includes(raw.armor)?raw.armor:'travel';
 s.accessorySlots=[null,null];if(Array.isArray(raw.accessorySlots))for(let i=0;i<2;i++){const id=raw.accessorySlots[i];if(s.accessories.includes(id)&&!s.accessorySlots.includes(id))s.accessorySlots[i]=id;}
 const pathIds={fire:['base','burst','pierce'],ice:['base','wide','freeze'],heal:['base','renew','full'],nova:['base','wide','swift']};for(const id in pathIds)if(pathIds[id].includes(raw.spellPaths?.[id]))s.spellPaths[id]=raw.spellPaths[id];
 let points=s.lv-1;for(const sk of SKILLS){if(sk.previous&&!s.skills[sk.previous])continue;const n=Math.min(points,integer(raw.skills?.[sk.id],0,sk.max));if(n){s.skills[sk.id]=n;points-=n;}}
 for(const id of [...s.owned,...s.loot.map(d=>d.uid)]){const n=integer(raw.upgrade?.[id],0,5);if(n)s.upgrade[id]=n;}
 // Results are reconstructed from safe text so a file cannot inject markup into the game.
 s.gachaLog=Array.isArray(raw.gachaLog)?raw.gachaLog.filter(v=>typeof v==='string').slice(-10).map(v=>escapeHTML(v.slice(0,180))):[];
 return s;
}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
readSave=function(){try{const raw=localStorage.getItem(SAVE);return raw?normalizeSave(JSON.parse(raw)):null;}catch{try{const raw=localStorage.getItem(SAVE);if(raw)localStorage.setItem(SAVE+'-recovery',raw);}catch{}return null;}};
function safeStorageGet(key){try{return localStorage.getItem(key);}catch{return null;}}
function backupText(){return JSON.stringify({format:'ember-below-backup',formatVersion:1,exportedAt:new Date().toISOString(),state},null,2);}
function parseBackup(text){if(typeof text!=='string'||text.length>2000000)throw Error('データが空か、サイズが大きすぎます。');const data=JSON.parse(text);if(data.format!=='ember-below-backup'||data.formatVersion!==1)throw Error('「灯の底」のバックアップではありません。');return normalizeSave(data.state);}
function commitRestore(){if(!restoreCandidate)return false;const next=JSON.stringify(restoreCandidate),before=localStorage.getItem(SAVE);try{if(before)localStorage.setItem(SAVE+'-before-import',before);localStorage.setItem(SAVE,next);}catch{toast('保存できなかったため、読み込みを取り消しました。');return false;}state=restoreCandidate;restoreCandidate=null;modal=null;$('modalBackdrop').hidden=true;enterTown(true);toast('バックアップを読み込みました。読み込み前の記録も復元画面に残しています。');hud();return true;}

const ascentStats=stats;
stats=function(){const s=ascentStats();s.hp+=8*skillRank('bladeVital')+(setActive('guardian')?40:0);s.mp+=8*skillRank('magicPool');s.atk+=2*skillRank('bladeEdge');s.def+=skillRank('bladeGuard')+(setActive('guardian')?4:0);s.move*=1+.03*skillRank('shadowStep');return s;};
function spellMultiplier(id){return 1+(id==='heal'?.08*skillRank('magicHealer'):.06*skillRank('magicPower'));}
const ascentSpellCost=spellCost;
spellCost=id=>Math.max(1,ascentSpellCost(id)-skillRank('magicSaving'));
function poisonDamage(){return 6+2*skillRank('shadowPoison')+(setActive('serpent')?4:0);}
const ascentTraits=traits;
traits=function(){const t=ascentTraits();if(setActive('serpent')){t.add('poison');t.add('chain');}return t;};
const ascentAttack=attack;
attack=function(){const before=player.cool;ascentAttack();if(player.cool>before)player.cool*=1-.04*skillRank('bladeFlow');};
const ascentHitWeapon=hitWeapon;
hitWeapon=function(e,damage,back=false){if(e.hp<=0)return;if(e.hp/e.maxHp<=.35)damage*=1+.06*skillRank('bladeFinish');ascentHitWeapon(e,damage,back);const family=weapon().family||weapon().id;if(skillRank('bladeCleave')&&!['bow','staff','crossbow'].includes(family))enemies.filter(n=>n!==e&&n.hp>0&&dist(n,e)<85).forEach(n=>hurtEnemy(n,damage*.12*skillRank('bladeCleave')));};
const ascentDodge=dodge;
dodge=function(){const before=player.dodge;ascentDodge();if(player.dodge<=before)return;player.dodgeCD*=1-.06*skillRank('shadowEvasion');if(setActive('frost')){enemies.filter(e=>e.hp>0&&dist(e,player)<125&&los(player,e)).forEach(e=>{hurtEnemy(e,stats().atk*.45);e.slow=2;});fx(player.x,player.y,'ice',1.5);}};
potion=function(type){const hp=type==='hp',field=hp?'potions':'ethers',stat=hp?'hp':'mp',max=stats()[stat];if(!state[field]||(player[stat]>=max&&!(hp&&player.poison>0)))return;state[field]--;const heal=hp?Math.round(Math.max(65,max*.35)*(1+.1*skillRank('shadowPotion'))):Math.max(35,Math.round(max*.25));player[stat]=Math.min(max,player[stat]+heal);if(hp)player.poison=0;fx(player.x,player.y,'heal',1);toast((hp?'HP':'MP')+'を'+heal+'回復'+(hp?'・毒を解除':''));save();if(modal==='commands')renderModal();};
hitPlayer=function(amount){if(player.inv>0||player.dodge>0||player.hp<=0)return;const veteran=state.difficulty==='veteran',dmg=Math.max(1,Math.min(Math.round(stats().hp*(veteran?.32:.22)),Math.round(amount*(veteran?1:.82))-stats().def));player.hp=Math.max(0,player.hp-dmg);player.inv=.85;tone(90,.12,'sawtooth',.025);if(player.hp<=0){state.deaths++;const lost=Math.floor(state.gold*(veteran?.15:.08));state.gold-=lost;save();openModal('down',{lost});}};
function canWindup(e){return enemies.filter(n=>n!==e&&n.hp>0&&n.wind>0).length<2;}
function beginWindup(e,angle){e.wind=e.windMax=e.bossId||e.towerElite?1.3:([5,6,7,9,10,11,13].includes(e.type)?1.1:.95);e.aim={x:player.x,y:player.y};e.dir=angle;e.phase++;e.aims=null;if((e.type===14&&e.secondForm&&e.phase%2)||(e.type===18&&e.secondForm)){e.aims=[{...e.aim},{x:e.aim.x-90,y:e.aim.y},{x:e.aim.x+90,y:e.aim.y}];}tone(180,.08,'sine',.015);}
function bossSecondForm(e){if(e.hp<=0||e.wind>0||e.secondForm||(!e.bossId&&!e.towerElite)||e.hp>e.maxHp*.5)return;e.secondForm=true;e.speed*=1.08;e.ct*=.94;toast((BOSSES[e.bossId]?.name||'塔の番人')+'：第二形態。予兆を見て回避しよう。');}
const ascentHurt=hurtEnemy;
hurtEnemy=function(e,amount,back=false){if(e.hp<=0)return;
 if(e.bossId==='phoenix'&&!e.reborn&&amount>=e.hp){e.hp=Math.max(1,Math.round(e.maxHp*.3));e.reborn=true;e.secondForm=true;e.wind=0;e.cool=2;attacks=attacks.filter(a=>a.player);toast('不死鳥が灰から復活。残りHP30%で最後の戦い！');return;}
 const alive=e.hp>0;ascentHurt(e,amount,back);if(e.hp>0){bossSecondForm(e);return;}if(alive){player.mp=Math.min(stats().mp,player.mp+skillRank('magicFocus')+(setActive('ash')?2:0));if(setActive('guardian'))player.hp=Math.min(stats().hp,player.hp+5);save();}
};
const ascentEnemy=enemy;
enemy=function(type,x,y){if(type<17){ascentEnemy(type,x,y);if(type===16){const e=enemies.at(-1);e.hp=e.maxHp=Math.round(e.maxHp*.78);e.atk=Math.round(e.atk*.92);}return;}if(type>19)return;ascentEnemy(14,x,y);const e=enemies.at(-1),hp=[850,1450,2300][type-17];Object.assign(e,{type,hp,maxHp:hp,atk:28+(type-17)*8,speed:42,range:type===17?120:230,ct:2.8,xp:130+(type-17)*60,gold:80+(type-17)*40});};
const ascentBossReward=bossReward;
bossReward=function(e){if(!TOWER_BOSSES[e.bossId])return ascentBossReward(e);const id=e.bossId,b=TOWER_BOSSES[id];state.bossKills[id]=(state.bossKills[id]||0)+1;state.bossDry[id]=(state.bossDry[id]||0)+1;state.tickets+=3;if(Math.random()<(e.mutated?.08:.05)||state.bossDry[id]>=30){state.bossDry[id]=0;return [awardUnique(b.drop)];}return [];};
const ascentResolve=resolveEnemyAttack;
resolveEnemyAttack=function(e){if(e.aims){e.cool=e.ct;for(const aim of e.aims){if(dist(aim,player)<55&&player.inv<=0&&player.dodge<=0)hitPlayer(e.atk);fx(aim.x,aim.y,e.type===18?'ice':'fire',1.2);}return;}if(e.type<17)return ascentResolve(e);e.cool=e.ct;
 if(e.type===17&&!(e.secondForm&&e.phase%2===0)){if(dist(e.aim,player)<65)hitPlayer(e.atk);fx(e.aim.x,e.aim.y,'slash',1.4);return;}
 if(e.type===18){bolts(e,e.secondForm?5:3,145);return;}
 if(e.phase%2===0){for(let i=0;i<(e.secondForm?12:8);i++){const a=i*TAU/(e.secondForm?12:8);attacks.push({x:e.x,y:e.y,vx:Math.cos(a)*135,vy:Math.sin(a)*135,life:4,damage:e.atk,color:'#c5ace2'});}}else{if(dist(e.aim,player)<75)hitPlayer(e.atk);fx(e.aim.x,e.aim.y,'fire',1.7);}
};
const ascentRadius=attackRadius;
attackRadius=function(e){return e.type===17?65:e.type>=18?75:ascentRadius(e);};
function drawWindup(e){const radius=attackRadius(e);ctx.save();ctx.strokeStyle='#f3aa82';ctx.fillStyle='#d3604b25';ctx.lineWidth=2;
 const circular=(p,r)=>{ctx.beginPath();ctx.arc(p.x,p.y,r,0,TAU);ctx.fill();ctx.stroke();ctx.beginPath();ctx.arc(p.x,p.y,r*(1-e.wind/e.windMax),0,TAU);ctx.stroke();};
 if(e.aims)e.aims.forEach(p=>circular(p,55));
 else if([5,7,9,10,13,18].includes(e.type)){const a=Math.atan2(e.aim.y-e.y,e.aim.x-e.x),spread=[10,13,18].includes(e.type)?3:1;for(let i=0;i<spread;i++){const b=a+(i-(spread-1)/2)*.32;ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.x+Math.cos(b)*(e.type===7||e.type===9?190:300),e.y+Math.sin(b)*(e.type===7||e.type===9?190:300));ctx.stroke();}if(e.type===7||e.type===9){ctx.lineWidth=35;ctx.strokeStyle='#db765044';ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.aim.x,e.aim.y);ctx.stroke();}}
 else if((e.type===3&&e.phase%3===0)||([14,15,16,19].includes(e.type)&&e.phase%2===0)||(e.type===17&&e.secondForm&&e.phase%2===0)){for(let i=0;i<8;i++){const a=i*TAU/8;ctx.beginPath();ctx.moveTo(e.x+Math.cos(a)*24,e.y+Math.sin(a)*24);ctx.lineTo(e.x+Math.cos(a)*145,e.y+Math.sin(a)*145);ctx.stroke();}}
 else circular(e.aim,radius);ctx.restore();}

const ascentTown=enterTown;
enterTown=function(initial=false){tower=null;ascentTown(initial);player.hazardTime=0;};
function floorRecovery(){if(player.hp<=0)return;player.hp=Math.min(stats().hp,player.hp+Math.round(stats().hp*.25));player.mp=Math.min(stats().mp,player.mp+10);player.poison=0;toast('階層を進んだ：HP25%・MP10回復、毒を解除。');}
const ascentDungeon=enterDungeon;
enterDungeon=function(n){if(!Number.isInteger(n)||n<1||n>3)return;tower=null;const previous=floor;ascentDungeon(n);if(n===1){for(const e of enemies)if([5,6,7].includes(e.type))Object.assign(e,{type:0,hp:43*enemyFactor(),maxHp:43*enemyFactor(),atk:13*enemyFactor(),speed:43,range:54,ct:2.1,xp:12,gold:9});}if(n>1&&previous>0)floorRecovery();};
const ascentRegion=enterRegion;
enterRegion=function(id,n=1,mutated=false,arena=false){if(id==='tower')return;if(!REGIONS[id]||!regionUnlocked(id)||n<1||n>REGIONS[id].floors)return;tower=null;const previous=floor;ascentRegion(id,n,mutated,arena);if(n===REGIONS[id].floors&&!arena)enemies=enemies.filter(e=>e.bossId||e.x<26*TILE);if(n>1&&previous>0&&!arena)floorRecovery();player.hazardTime=0;};
const ascentHunt=enterHunt;
enterHunt=function(tier){if(![1,4,8,12].includes(tier))return;tower=null;region='ruins';ascentHunt(tier);player.poison=0;};
function enterTower(n=1,arenaId=null,mutated=false){if(!Number.isInteger(n)||n<1||n>30)return;if(!arenaId&&n!==1&&n%5!==1&&!(tower?.cleared&&n===tower.floor+1))return;if(!arenaId&&n>state.towerUnlocked&&!(tower?.cleared&&n===tower.floor+1))return;
 hunt=null;region='tower';variant=mutated;floor=n;tower={floor:n,cleared:false,arena:!!arenaId};world=makeWorld();room(7,4,21,19);enemies=[];objects=[];attacks=[];effects=[];floats=[];particles=[];stealth=false;obj('exit',17,21);[[8,5],[25,5],[8,21],[25,21]].forEach(([x,y])=>obj('torch',x,y));player.x=17*TILE+24;player.y=19*TILE+24;player.inv=2;player.dodge=0;player.poison=0;player.cool=.5;
 const spawn=(type,x,y)=>{floor=1;enemy(type,x,y);floor=n;return enemies.at(-1);};
 if(n%5===0||arenaId){const id=arenaId||(n<=10?'towerMirror':n<=20?'towerOracle':'towerVoid'),b=TOWER_BOSSES[id],e=spawn(b.type,17,8);e.towerElite=n%10!==0&&!arenaId;if(!e.towerElite)e.bossId=id;e.alert=999;e.hp=e.maxHp=Math.round(e.maxHp*(e.towerElite?.65:1));e.mutated=mutated;if(mutated){e.hp=e.maxHp=Math.round(e.hp*1.5);e.atk=Math.round(e.atk*1.2);}}
 else{const pool=n<6?[0,1,2,4]:n<16?[0,2,4,5,8,9]:[4,5,8,9,10,11,12,13],count=3+Math.min(3,Math.floor(n/8));for(let i=0;i<count;i++){const e=spawn(pool[(n+i)%pool.length],11+(i%3)*6,7+Math.floor(i/3)*4);e.hp=e.maxHp=Math.round(e.maxHp*(1+(n-1)*.045));e.atk=Math.round(e.atk*(.8+(n-1)*.018));e.xp=Math.round(e.xp*(1+n*.035));e.alert=999;}}
 closeModal();updateLocation();announce('灯試しの塔 '+n+'階');hud();save();}
function clearTowerFloor(){if(!tower||tower.cleared)return;tower.cleared=true;attacks=[];state.towerBest=Math.max(state.towerBest,tower.floor);const first=!state.towerFirst.includes(tower.floor);state.towerMarks+=tower.floor%5===0?3:1;
 if(first){state.towerFirst.push(tower.floor);state.gold+=30+tower.floor*3;state.tickets+=tower.floor%5===0?3:1;xp(10+tower.floor*4);}if(tower.floor%5===0)state.towerUnlocked=Math.max(state.towerUnlocked,Math.min(30,tower.floor+1));if(tower.floor===30)state.towerConquered=true;
 player.hp=Math.min(stats().hp,player.hp+stats().hp*.3);player.mp=Math.min(stats().mp,player.mp+20);player.poison=0;save();toast('塔'+tower.floor+'階を突破：紋章'+(tower.floor%5===0?3:1)+'個'+(first?'・初回報酬を獲得':'')+'。画面下から続行できます。');hud();}
const ascentEnterBoss=enterBoss;
enterBoss=function(id,mutated){if(TOWER_BOSSES[id]){if(state.bossKills[id]>0)enterTower(TOWER_BOSSES[id].stage,id,mutated);return;}ascentEnterBoss(id,mutated);};
const ascentUpdate=update;
update=function(dt){const oldLevel=state.lv;if(region==='sewer'&&!hunt&&!tower&&onHazard()){player.hazardTime=(player.hazardTime||0)+dt;}else player.hazardTime=0;
 ascentUpdate(dt);if(player.hp<=0)return;if(state.lv>oldLevel)player.poison=0;if(floor)player.mp=Math.min(stats().mp,player.mp+dt*(.15*skillRank('magicRecovery')+(setActive('ash')?.8:0)));
 for(const e of enemies)bossSecondForm(e);if(tower&&!tower.cleared&&!enemies.some(e=>e.hp>0))clearTowerFloor();if(tower){$('huntText').textContent='塔 '+tower.floor+' / 30階 · 残り '+enemies.filter(e=>e.hp>0).length+'体';$('huntContinue').hidden=!tower.cleared;$('huntContinue').textContent=tower.floor===30?'塔を踏破！ 戦果を見る':'次の階へ →';}
};
const ascentLocation=updateLocation;
updateLocation=function(){ascentLocation();if(tower){$('huntPanel').hidden=false;$('zoneTag').textContent='TRIAL OF LIGHT';$('locationName').textContent='灯試しの塔';$('mapCaption').textContent=tower.floor+' / 30階';}else $('huntContinue').textContent='次の群れへ →';};
const ascentDrawEnemy=drawEnemy;
drawEnemy=function(e){if(e.type<17)return ascentDrawEnemy(e);shadow(e.x,e.y,34);ctx.save();ctx.translate(Math.round(e.x)-48,Math.round(e.y)-90);ctx.scale(3,3);const r=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);},dark='#38374d',mid=e.secondForm?'#ba86bd':'#7e8bac',light='#d5c8dd';
 r(11,4,11,8,light);r(8,11,17,12,mid);r(11,21,5,8,dark);r(19,21,5,8,dark);r(12,7,3,2,'#503d66');r(19,7,3,2,'#503d66');
 if(e.type===17){r(4,11,6,13,dark);r(4,13,3,8,light);r(26,5,2,21,light);r(23,18,8,2,light);}else if(e.type===18){r(3,14,7,8,light);r(24,12,6,8,light);r(10,1,15,3,mid);r(26,3,2,24,light);r(24,1,6,6,mid);}else{r(8,2,18,3,light);r(9,0,3,5,mid);r(16,0,3,5,mid);r(23,0,3,5,mid);r(4,10,5,15,dark);r(26,10,5,15,dark);r(13,14,8,5,light);}ctx.restore();};
function setShopHTML(){return '<p>塔の紋章 <b>'+state.towerMarks+'個</b>。2部位でセット効果が発動。以前のボス装備も同じ系列の部位として数えます。</p>'+Object.entries(SETS).map(([id,set])=>'<div class="card"><h3>'+set.name+'セット · '+setCount(id)+'部位</h3><p>'+set.desc+'</p>'+[['weapon',set.weapons.at(-1),8],['armor',set.armors[0],6],['accessory',set.accessories.at(-1),5]].map(([type,item,cost])=>{const list=type==='weapon'?state.owned:type==='armor'?state.armors:state.accessories;return '<div class="list-row"><div><b>'+itemName(item)+'</b><p>紋章'+cost+'個</p></div>'+btn(list.includes(item)?'交換済み':'交換','setBuy:'+item,list.includes(item)||state.towerMarks<cost)+'</div>';}).join('')+'</div>').join('');}
function skillHTML(){return '<div class="notice">未使用ポイント '+skillPoints()+' / 獲得 '+Math.max(0,state.lv-1)+'。レベルが上がるごとに1ポイント。各項目は2段階まで。街では無料で振り直せます。</div>'+btn('すべて振り直す','respec',!skillSpent())+['剣技','魔導','影技'].map(branch=>'<h3>'+branch+'</h3>'+SKILLS.filter(s=>s.branch===branch).map(sk=>'<div class="list-row"><div><b>'+sk.name+' '+skillRank(sk.id)+' / '+sk.max+'</b><p>1段階ごと：'+sk.desc+(sk.previous?' / 前提：'+SKILLS.find(s=>s.id===sk.previous).name:'')+'</p></div>'+btn('習得 +1','skill:'+sk.id,skillPoints()<1||skillRank(sk.id)>=sk.max||!!(sk.previous&&!skillRank(sk.previous)))+'</div>').join('')).join('');}
function towerHTML(){return '<p class="lead">30階の連戦。5階ごとに番人、10・20・30階には専用ボス。各階突破でHP30%・MP20回復。初回報酬は一度だけ、紋章は再挑戦でも獲得できます。</p><div class="notice">最高 '+state.towerBest+'階 / 塔の紋章 '+state.towerMarks+'個。推奨Lv.4（1階）〜Lv.23（30階）。街で装備・スキルを整え、区間ごとに挑めます。</div><div class="tabs">'+[1,6,11,16,21,26].map(n=>btn(n+'階から挑む','tower:'+n,state.towerUnlocked<n)).join('')+'</div>'+btn('紋章をセット装備と交換','open:setShop')+'<p>専用ボスは固有武器を通常5%・変異種8%でドロップ。出ない場合は30回目に確定。塔の外の通常装備でも攻略できます。</p>';}
function lootToolsHTML(){const entries=state.loot.filter(d=>(lootFilter.rarity==='all'||String(d.rarity)===lootFilter.rarity)&&(lootFilter.family==='all'||(WEAPONS.find(w=>w.id===d.base).family||d.base)===lootFilter.family)&&(lootFilter.trait==='all'||d.traits?.includes(lootFilter.trait)));
 const select=(id,label,options,value)=>'<label>'+label+' <select id="'+id+'">'+options.map(([v,t])=>'<option value="'+v+'" '+(v===value?'selected':'')+'>'+t+'</option>').join('')+'</select></label>';
 return '<div class="inventory-filters">'+select('filterRarity','レア度',[['all','すべて'],...RARITIES.map((r,i)=>[String(i),r.name])],lootFilter.rarity)+select('filterFamily','武器種',[['all','すべて'],...['sword','dagger','spear','longsword','bow','staff','axe','hammer','crossbow','venom'].map((id,i)=>[id,['剣','短剣','槍','長剣','弓','杖','斧','槌','弩','毒剣'][i]])],lootFilter.family)+select('filterTrait','効果',[['all','すべて'],...Object.entries(TRAITS).map(([id,v])=>[id,v[0]])],lootFilter.trait)+'</div><p class="muted">'+entries.length+' / '+state.loot.length+'個。保護した装備と装備中の武器は売却・分解できません。分解するとレア度+1個の灯鉱石になります。</p>'+entries.slice().reverse().map(d=>{const b=WEAPONS.find(w=>w.id===d.base);return '<div class="list-row"><div><b class="rarity-'+d.rarity+'">'+(d.locked?'🔒 ':'')+d.name+'</b><p>追加攻撃+'+d.bonus+' / HP+'+d.hp+' / 防御+'+d.def+'<br>'+traitText(d.traits)+'<br>間合い'+b.range+' / '+b.ct+'秒</p></div><div class="loot-actions">'+btn(state.weapon===d.uid?'装備中':'装備','equip:'+d.uid,state.weapon===d.uid)+btn(d.locked?'保護を外す':'保護','lock:'+d.uid)+btn('分解 鉱石'+(d.rarity+1),'dismantle:'+d.uid,d.locked||state.weapon===d.uid)+btn('売却 '+d.value+'G','sellLoot:'+d.uid,d.locked||state.weapon===d.uid)+'</div></div>';}).join('');}
const ascentLootRows=lootRows;
lootRows=function(){return lootToolsHTML();};
function ascentHTML(kind){if(kind==='tower')return towerHTML();if(kind==='setShop')return setShopHTML();if(kind==='skills')return skillHTML();if(kind==='towerClear'&&!tower)return '<p>塔の戦果は、階層突破後に確認できます。</p>';if(kind==='towerClear')return '<div class="notice">塔'+tower.floor+'階を突破。紋章を獲得・HP30%とMP20回復済み。</div>'+btn(tower.floor===30?'全30階踏破！':'次の階へ','towerNext',tower.floor===30,'primary')+' '+btn('街に帰る','town');
 if(kind==='backup')return '<p>この端末の冒険をJSONに書き出せます。別の端末では「読み込み」から復元してください。読み込み前の記録もこのブラウザに1件保持します。</p><h3>書き出し</h3><textarea id="backupExport" rows="5" readonly aria-label="バックアップデータ">'+escapeHTML(backupText())+'</textarea><div class="tabs">'+btn('JSONをダウンロード','exportFile')+btn('コピー','copyBackup')+'</div><h3>読み込み</h3><label>JSONファイル <input type="file" id="backupFile" accept=".json,application/json"></label><textarea id="backupImport" rows="5" placeholder="バックアップを貼り付け" aria-label="読み込むバックアップ"></textarea>'+btn('内容を確認する','previewImport')+'<p id="backupError" role="status"></p>'+btn('読み込み前の記録を復元','restorePrevious',!safeStorageGet(SAVE+'-before-import'));
 if(kind==='restorePreview')return '<p class="lead">この内容で現在の冒険を置き換えます。</p><div class="notice">Lv.'+restoreCandidate.lv+' / '+restoreCandidate.gold+'G / 武器'+(restoreCandidate.owned.length+restoreCandidate.loot.length)+'個 / 塔'+restoreCandidate.towerBest+'階</div>'+btn('この内容を読み込む','confirmImport',false,'primary')+' '+btn('取り消す','cancelImport');return null;}
const ascentRender=renderModal;
renderModal=function(){ascentRender();const custom=ascentHTML(modal);if(custom!==null){$('modalTitle').textContent={tower:'灯試しの塔',setShop:'塔のセット装備交換',skills:'スキルツリー',towerClear:'塔の戦果',backup:'冒険のバックアップ',restorePreview:'読み込む内容の確認'}[modal];$('modalEyebrow').textContent='TRIAL OF LIGHT';$('modalBody').innerHTML=custom;}
 if(modal==='equipment')$('modalBody').innerHTML+='<h3>セット効果</h3>'+Object.entries(SETS).map(([id,s])=>'<p class="'+(setActive(id)?'set-active':'muted')+'">'+s.name+' '+setCount(id)+'部位 / 2部位で発動：'+s.desc+'</p>').join('');
 if(modal==='journal')$('modalBody').innerHTML+='<hr><div class="tabs">'+btn('スキル '+skillPoints()+'pt','open:skills',!!floor)+btn('塔への挑戦','open:tower',!!floor)+btn('バックアップ','open:backup',!!floor)+'</div><h3>遊びやすさ</h3><p>冒険：被ダメージを軽減・一撃は最大HP22%まで・敗北時の所持金減少8%。手応え：軽減なし・一撃は最大HP32%まで・敗北時15%。ドロップと報酬は同じです。街で切替可能。</p>'+btn('冒険（標準）','difficulty:adventure',!!floor||state.difficulty==='adventure')+' '+btn('手応え','difficulty:veteran',!!floor||state.difficulty==='veteran');
 if(modal==='stairs'||modal==='regionStairs')$('modalBody').innerHTML+='<p class="notice">次階へ進むとHP25%・MP10回復し、毒を解除します。</p>';
 if(modal==='gacha')$('modalBody').innerHTML+='<h3>収集交換</h3><p>抽選1回につき欠片1個。所持 '+state.gachaShards+'個。通常アクセサリーは欠片15個、店売り武器は12個で交換。ボス専用品は交換対象外です。</p>'+ACCESSORIES.filter(a=>!a.bossOnly).map(a=>'<div class="list-row"><b>'+a.name+'</b>'+btn(state.accessories.includes(a.id)?'所持済み':'欠片15個で交換','shardAcc:'+a.id,state.accessories.includes(a.id)||state.gachaShards<15)+'</div>').join('')+WEAPONS.filter(w=>w.price>0).map(w=>'<div class="list-row"><b>'+w.name+'</b>'+btn(state.owned.includes(w.id)?'所持済み':'欠片12個で交換','shardWeapon:'+w.id,state.owned.includes(w.id)||state.gachaShards<12)+'</div>').join('');
 if(modal==='guild')$('modalBody').innerHTML='<div class="notice">'+(state.counts.sewerRescue?'調合師：「水路の素材から薬を作れるようになった。次は鉱山の灯を探してみてくれ。」':state.cleared?'ギルド長：「古灯を継いでくれたんだね。今度は地下水路の調査も頼みたい。」':'ギルド長：「初めは剣と薬だけで十分。危なくなったら帰還して、依頼を報告しよう。」')+'</div>'+$('modalBody').innerHTML;
 if(modal==='commands')$('modalBody').innerHTML=$('modalBody').innerHTML.replace('HP65回復・毒を解除。','HP'+Math.round(Math.max(65,stats().hp*.35)*(1+.1*skillRank('shadowPotion')))+'回復・毒を解除。');
 bindAscentInputs();};
function bindAscentInputs(){for(const [id,key]of [['filterRarity','rarity'],['filterFamily','family'],['filterTrait','trait']]){const el=$(id);if(el)el.onchange=()=>{lootFilter[key]=el.value;renderModal();};}const file=$('backupFile');if(file)file.onchange=async()=>{const f=file.files?.[0];if(!f)return;if(f.size>2000000){$('backupError').textContent='ファイルが大きすぎます。';return;}try{$('backupImport').value=await f.text();$('backupError').textContent='読み込む内容を確認してください。';}catch{$('backupError').textContent='ファイルを読めませんでした。';}};}
const ascentDrawGacha=drawGacha;
drawGacha=function(count){const before=state.gachaTotal;ascentDrawGacha(count);state.gachaShards+=state.gachaTotal-before;save();if(modal==='gacha')renderModal();};
const ascentAction=action;
action=function(raw){const [a,id]=raw.split(':');const townActions=['tower','skill','respec','difficulty','setBuy','shardAcc','shardWeapon','previewImport','confirmImport','restorePrevious','exportFile','copyBackup'];if(floor&&townActions.includes(a))return;
 if(a==='open'&&['tower','setShop','skills','backup'].includes(id)){if(!floor)return openModal(id);return;}
 if(a==='tower')return enterTower(Number(id));if(a==='towerNext'){if(tower?.cleared&&tower.floor<30)return enterTower(tower.floor+1);return;}
 if(a==='skill'){const sk=SKILLS.find(s=>s.id===id);if(sk&&(!sk.previous||skillRank(sk.previous)>0)&&skillPoints()>0&&skillRank(id)<sk.max)state.skills[id]=skillRank(id)+1;}
 else if(a==='respec')state.skills={};else if(a==='difficulty'&&['adventure','veteran'].includes(id))state.difficulty=id;
 else if(a==='setBuy'){let item,type,cost;for(const set of Object.values(SETS)){if(set.weapons.at(-1)===id){item=id;type='owned';cost=8;}if(set.armors[0]===id){item=id;type='armors';cost=6;}if(set.accessories.at(-1)===id){item=id;type='accessories';cost=5;}}if(item&&!state[type].includes(item)&&state.towerMarks>=cost){state.towerMarks-=cost;state[type].push(item);}}
 else if(a==='shardAcc'){const item=ACCESSORIES.find(a=>a.id===id&&!a.bossOnly);if(item&&!state.accessories.includes(id)&&state.gachaShards>=15){state.gachaShards-=15;state.accessories.push(id);}}
 else if(a==='shardWeapon'){const item=WEAPONS.find(w=>w.id===id&&w.price>0);if(item&&!state.owned.includes(id)&&state.gachaShards>=12){state.gachaShards-=12;state.owned.push(id);}}
 else if(a==='lock'){const d=state.loot.find(d=>d.uid===id);if(d)d.locked=!d.locked;}
 else if(a==='dismantle'){const d=state.loot.find(d=>d.uid===id);if(d&&!d.locked&&state.weapon!==id){state.materials.ore+=d.rarity+1;state.loot=state.loot.filter(d=>d.uid!==id);delete state.upgrade[id];}}
 else if(a==='sellLoot'&&state.loot.find(d=>d.uid===id)?.locked)return;
 else if(a==='buyarmor'&&ARMOR.find(a=>a.id===id)?.setOnly)return;
 else if(a==='exportFile'){const blob=new Blob([backupText()],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='ember-below-backup.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return;}
 else if(a==='copyBackup'){const el=$('backupExport');if(navigator.clipboard?.writeText)navigator.clipboard.writeText(backupText()).then(()=>toast('バックアップをコピーしました。')).catch(()=>{el.select();toast('表示中のデータを選択してコピーできます。');});else{el.select();toast('表示中のデータを選択してコピーできます。');}return;}
 else if(a==='previewImport'){try{restoreCandidate=parseBackup($('backupImport').value);openModal('restorePreview');}catch(e){$('backupError').textContent='読み込めません：'+(e instanceof SyntaxError?'JSONが途中で切れているか、形式が正しくありません。':e.message);}return;}
 else if(a==='confirmImport')return commitRestore();else if(a==='cancelImport'){restoreCandidate=null;return openModal('backup');}
 else if(a==='restorePrevious'){try{const raw=JSON.parse(safeStorageGet(SAVE+'-before-import'));restoreCandidate=normalizeSave(raw);openModal('restorePreview');}catch{$('backupError').textContent='以前の記録を復元できませんでした。';}return;}
 else return ascentAction(raw);
 player.hp=Math.min(player.hp,stats().hp);player.mp=Math.min(player.mp,stats().mp);save();renderModal();hud();};
const ascentHud=hud;
hud=function(){ascentHud();{const e=enemies.find(e=>(e.bossId||e.towerElite)&&e.hp>0);if(e){$('bossHud').hidden=false;$('bossHud').querySelector('span').textContent=(e.secondForm?'第二形態・':'')+(BOSSES[e.bossId]?.name||'塔の番人');$('bossBar').style.width=e.hp/e.maxHp*100+'%';}}const skill=$('skillBalance');if(skill)skill.textContent='スキル '+skillPoints()+'pt';};
const ascentItemName=itemName;
itemName=id=>ARMOR.find(a=>a.id===id)?.name||ascentItemName(id);
const ascentDrawTown=drawTown;
drawTown=function(){ascentDrawTown();if(state.counts.sewerRescue){sprite('silver-cast',8,4,4,14*TILE+24,13*TILE+31,76,76);ctx.fillStyle='#7ba279';ctx.fillRect(14*TILE+12,13*TILE-32,24,8);}if(state.forgeUnlocked){ctx.fillStyle='#cfac68';ctx.fillRect(8*TILE+10,9*TILE-4,30,5);}};
