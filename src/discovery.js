// Growth discoveries: crystals, a rare fleeing monster, and broader build choices.
let castingMagic=false;
const CRYSTAL_UNITS=[...Array.from({length:16},(_,i)=>i+5),100],SLIME_EXP=12;
const NEW_SPELLS=[
 {id:'bolt',name:'雷槍',mp:10,power:46,price:160,desc:'射程380の敵を雷で貫き、近くの敵2体にも65%の連鎖ダメージ。'},
 {id:'venomMist',name:'毒霧',mp:12,power:12,price:140,desc:'周囲180に毒霧を放ち、8秒間の毒を与える。'},
 {id:'wind',name:'風刃',mp:9,power:30,price:120,desc:'前方350の敵を風の刃で攻撃し、押し戻す。'},
 {id:'barrier',name:'灯の結界',mp:16,power:65,price:180,desc:'12秒間、65＋レベル×3のダメージを吸収する結界。'},
 {id:'renewal',name:'生命の滴',mp:14,power:60,price:150,desc:'10秒間、毎秒HP6回復。移動しながら傷を癒やせる。'},
 {id:'meteor',name:'隕火',mp:28,power:95,price:400,desc:'射程420の敵に隕火を落とし、周囲140を焼き払う。'}
];
const NEW_GEAR=[
 {id:'rapier',name:'銀風の細剣',family:'dagger',atk:18,range:75,ct:.38,price:170,trait:'flow',icon:2,desc:'間合いを保ちながら素早く突く。不意打ち3倍。'},
 {id:'warbow',name:'梟羽の長弓',family:'bow',atk:22,range:300,ct:.9,price:260,trait:'edge',icon:4,desc:'遠くから敵を狙える、威力と手数を兼ねた長弓。'},
 {id:'stormstaff',name:'嵐呼びの杖',family:'staff',atk:20,range:250,ct:1,price:290,trait:'arcane',magic:1.5,icon:5,desc:'魔法威力+50%。魔導の効果も備える。'},
 {id:'bloodaxe',name:'紅晶の戦斧',family:'axe',atk:36,range:100,ct:1.25,price:320,trait:'leech',icon:24,desc:'周囲も斬り払い、命中でHPを回復する。'},
 {id:'sunmace',name:'暁鐘の戦槌',family:'hammer',atk:40,range:85,ct:1.45,price:350,trait:'guard',icon:25,desc:'敵を怯ませて予兆を中断する、守りの戦槌。'},
 {id:'moonblade',name:'月霜の大剣',family:'longsword',atk:30,range:96,ct:.82,price:310,trait:'frost',icon:1,desc:'周囲をまとめて斬り、冷気で足を鈍らせる。'}
];
goldCost=function(n){return Math.round(n*(isAdventure()?10:1));};
for(const item of [...NEW_GEAR,...NEW_SPELLS]){const base=item.price;Object.defineProperty(item,'price',{enumerable:true,get:()=>goldCost(base)});}
WEAPONS.push(...NEW_GEAR);SPELLS.push(...NEW_SPELLS);
for(const a of [
 {id:'scoutcoat',name:'斥候の軽衣',def:4,hp:20,price:150,icon:7,move:.05,desc:'防御+4 / HP+20 / 移動速度+5%'},
 {id:'runerobe',name:'ルーン織りの法衣',def:4,hp:25,price:220,icon:9,mp:35,desc:'防御+4 / HP+25 / MP+35'},
 {id:'bulwark',name:'城塞の重鎧',def:10,hp:60,price:380,icon:8,move:-.06,desc:'防御+10 / HP+60 / 移動速度-6%'}
]){const base=a.price;Object.defineProperty(a,'price',{enumerable:true,get:()=>goldCost(base)});ARMOR.push(a);}
ACCESSORIES.push(
 {id:'silverBell',name:'銀鈴の耳飾り',tier:1,traits:['luck','flow']},
 {id:'rubyHeart',name:'紅玉の心飾り',tier:1,hp:35,traits:['vigor']},
 {id:'thunderSeal',name:'雷雲の印',tier:2,mp:25,traits:['arcane','edge']},
 {id:'springCharm',name:'若葉の護符',tier:0,hp:12,traits:['leech']}
);
ENEMY_NAMES.push('銀灯スライム');
function defaultHeroName(hero=state?.hero){return hero==='heroine'?'白銀の勇者':'旅人';}
function cleanHeroName(value){return Array.from(String(value||'').normalize('NFC').replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g,'').trim()).slice(0,16).join('');}
function heroDisplay(s=state){return cleanHeroName(s?.heroName)||defaultHeroName(s?.hero);}
const discoveryFresh=fresh;
fresh=function(){return {...discoveryFresh(),heroName:'',expItems:{},expDry:0,bountyClaimed:0};};
const discoveryNormalize=normalizeSave;
normalizeSave=function(raw){const s=discoveryNormalize(raw);s.heroName=cleanHeroName(raw.heroName);s.expItems={};for(const unit of CRYSTAL_UNITS){const n=raw.expItems?.[unit];if(Number.isFinite(n)&&n>0)s.expItems[unit]=Math.min(9999,Math.floor(n));}s.expDry=Number.isFinite(raw.expDry)?clamp(Math.floor(raw.expDry),0,7):0;s.bountyClaimed=Number.isFinite(raw.bountyClaimed)?clamp(Math.floor(raw.bountyClaimed),0,1e9):0;return s;};
const discoveryStats=stats;
stats=function(){const s=discoveryStats(),a=ARMOR.find(a=>a.id===state.armor);s.mp+=a?.mp||0;s.move*=1+(a?.move||0);return s;};
function crystalCount(){return Object.values(state.expItems).reduce((n,v)=>n+v,0);}
function awardCrystal(unit){state.expItems[unit]=(state.expItems[unit]||0)+1;}
function useCrystal(unit,all=false){if(!player||player.hp<=0||modal==='down')return;const n=state.expItems[unit]||0;if(!n||!CRYSTAL_UNITS.includes(Number(unit)))return;const count=all?n:1,before=state.lv;state.expItems[unit]-=count;if(!state.expItems[unit])delete state.expItems[unit];xp(Number(unit)*SLIME_EXP*count);if(state.lv>before)player.poison=0;save();hud();if(modal)renderModal();toast('経験結晶を'+count+'個使った。EXP +'+Number(unit)*SLIME_EXP*count+(state.lv>before?' / Lv.'+state.lv+'に成長！':''));}
function useAllCrystals(){if(!player||player.hp<=0||modal==='down')return;const total=Object.entries(state.expItems).reduce((n,[unit,count])=>n+Number(unit)*SLIME_EXP*count,0);if(!total)return;state.expItems={};const before=state.lv;xp(total);if(state.lv>before)player.poison=0;save();hud();renderModal();toast('経験結晶を使った。EXP +'+total+(state.lv>before?' / Lv.'+state.lv+'に成長！':''));}
function expBagHTML(){return '<p class="lead">魔物の灯が結晶になったもの。使うと経験を得られます。<br>灯の経験結晶：スライム5〜20体分（EXP60〜240）。<br>銀灯の大結晶：スライム100体分（EXP1200）。</p><div class="notice">所持 '+crystalCount()+'個 / 合計EXP '+Object.entries(state.expItems).reduce((n,[u,c])=>n+Number(u)*SLIME_EXP*c,0)+'</div>'+btn('まとめて使う','expAll',!crystalCount(),'primary')+CRYSTAL_UNITS.filter(u=>state.expItems[u]).map(u=>'<div class="list-row"><div><b>'+(u===100?'銀灯の大結晶':'灯の経験結晶')+' × '+state.expItems[u]+'</b><p>1個：スライム'+u+'体分 / EXP '+u*SLIME_EXP+'</p></div><div class="loot-actions">'+btn('1個使う','expUse:'+u)+btn('この結晶を全て使う','expStack:'+u)+'</div></div>').join('')+(crystalCount()?'':'<p>敵を倒して集めよう。銀色に光るスライムは大結晶を必ず落とします。</p>');}
const discoveryEnemy=enemy;
enemy=function(type,x,y){if(type!==20)return discoveryEnemy(type,x,y);enemies.push({id:++uid,type:20,x:x*TILE+24,y:y*TILE+24,hp:8,maxHp:8,atk:0,speed:110,range:0,ct:999,cool:999,wind:0,alert:0,dir:0,slow:0,hurt:0,phase:0,poison:0,poisonTick:1,stun:0,seed:Math.random()*10,xp:0,gold:60,metalSeen:false,metalLife:17});};
function spawnSilver(chance,hunting=false){if(Math.random()>=chance)return;const spots=hunting?[[11,9],[23,10],[12,18],[23,18]]:[[7,4],[20,5],[9,18],[28,21]];const pool=spots.filter(([x,y])=>walkable(x*TILE+24,y*TILE+24,12));if(!pool.length)return;const [x,y]=pool[Math.floor(Math.random()*pool.length)];enemy(20,x,y);toast('どこかで銀色の灯がきらめいた。');}
const discoveryDungeon=enterDungeon;
enterDungeon=function(n){const before=world;discoveryDungeon(n);if(world!==before)spawnSilver(.25);};
const discoveryRegion=enterRegion;
enterRegion=function(id,n=1,mutated=false,arena=false){const before=world;discoveryRegion(id,n,mutated,arena);if(world!==before&&!arena&&id!=='tower')spawnSilver(.25);};
const discoveryWave=spawnHuntWave;
spawnHuntWave=function(){discoveryWave();spawnSilver(.18,true);};
const discoveryHurt=hurtEnemy;
hurtEnemy=function(e,amount,back=false){if(e.hp<=0)return;if(e.type===20){if(castingMagic){fx(e.x,e.y,'ice',.35);return;}const damage=Math.random()<.1?3:1;e.hp-=damage;e.hurt=.18;e.metalSeen=true;if(e.hp<=0){state.gold+=e.gold;state.materials.ore+=2;state.book[20]=(state.book[20]||0)+1;if(hunt){state.huntKills++;state.counts.hunters++;}awardCrystal(100);save();toast('銀灯スライムを倒した！ 銀灯の大結晶（EXP1200）を入手。');}return;}
 const alive=e.hp>0;discoveryHurt(e,amount,back);if(alive&&e.hp<=0){if(e.bossId)awardCrystal(20);else{state.expDry++;if(Math.random()<.35||state.expDry>=8){state.expDry=0;const unit=5+Math.floor(Math.random()*16);awardCrystal(unit);toast('灯の経験結晶を入手！ スライム'+unit+'体分のEXP。');}}save();}
};
const discoveryUpdate=update;
update=function(dt){for(const e of enemies){if(e.type!==20||e.hp<=0)continue;e.poison=0;e.slow=0;e.wind=0;e.stun=dt+.01;e.hurt=Math.max(0,e.hurt-dt);if(dist(e,player)<290&&los(e,player))e.metalSeen=true;if(e.metalSeen){e.metalLife-=dt;if(e.metalLife<=0){e.hp=0;e.escaped=true;toast('銀色の灯は、すばやく闇へ消えた。');continue;}let a=Math.atan2(e.y-player.y,e.x-player.x);const before={x:e.x,y:e.y};move(e,Math.cos(a)*e.speed*dt,Math.sin(a)*e.speed*dt,10);if(dist(before,e)<.1){a+=Math.sin(clock*2+e.seed)>0?1.4:-1.4;move(e,Math.cos(a)*e.speed*dt,Math.sin(a)*e.speed*dt,10);}e.dir=a;}}
 if(player.shieldTime>0){player.shieldTime=Math.max(0,player.shieldTime-dt);if(!player.shieldTime)player.shield=0;}discoveryUpdate(dt);if(hunt){const regular=enemies.filter(e=>e.hp>0&&e.type!==20).length,rare=enemies.some(e=>e.hp>0&&e.type===20);$('huntText').textContent='第'+hunt.wave+'群 · 残り '+regular+'体'+(rare?' · 銀灯の気配':'');}
};
hitPlayer=function(amount){if(player.inv>0||player.dodge>0||player.hp<=0)return;const veteran=state.difficulty==='veteran';let dmg=Math.max(1,Math.min(Math.round(stats().hp*(veteran?.32:.22)),Math.max(Math.ceil(amount*.24),Math.round(amount*(veteran?1:.82))-stats().def)));if(player.shield>0){const absorbed=Math.min(player.shield,dmg);player.shield-=absorbed;dmg-=absorbed;}player.hp=Math.max(0,player.hp-dmg);player.inv=.85;if(dmg)tone(90,.12,'sawtooth',.025);if(player.hp<=0){state.deaths++;const lost=Math.floor(state.gold*(veteran?.15:.08));state.gold-=lost;save();openModal('down',{lost});}};
const discoveryCast=cast;
cast=function(id){const s=NEW_SPELLS.find(s=>s.id===id);castingMagic=true;try{if(!s)return discoveryCast(id);if(!floor||!state.spells.includes(id)||player.mp<spellCost(id))return;const targets=enemies.filter(e=>e.hp>0&&dist(e,player)<(id==='meteor'?420:380)&&los(player,e)).sort((a,b)=>dist(a,player)-dist(b,player));if(['bolt','wind','meteor'].includes(id)&&!targets.length){toast('射程内に敵がいません。');return;}player.mp-=spellCost(id);closeModal();const power=s.power*(weapon().magic||1)*(traits().has('arcane')?1.2:1)*spellMultiplier(id)*(1+(state.lv-1)*.04);
 if(id==='barrier'){player.shield=65+state.lv*3;player.shieldTime=12;fx(player.x,player.y,'ice',1.4);toast('灯の結界をまとった。12秒間、攻撃を吸収。');}
 else if(id==='renewal'){player.regen=Math.max(player.regen||0,10);fx(player.x,player.y,'heal',1.3);toast('生命の滴：10秒間、傷が癒えていく。');}
 else if(id==='bolt'){const first=targets[0],victims=[first,...targets.slice(1).filter(e=>dist(e,first)<150).slice(0,2)];victims.forEach((e,i)=>{hurtEnemy(e,power*(i?.65:1));fx(e.x,e.y,'ice',.8);});}
 else if(id==='venomMist'){enemies.filter(e=>e.hp>0&&dist(e,player)<180&&los(e,player)).forEach(e=>{hurtEnemy(e,power);if(e.type!==20){if(!e.poison)e.poisonTick=1;e.poison=8;}});fx(player.x,player.y,'ice',2);}
 else if(id==='meteor'){const first=targets[0];enemies.filter(e=>e.hp>0&&dist(e,first)<140&&los(e,first)).forEach(e=>hurtEnemy(e,power));fx(first.x,first.y,'fire',3);}
 else if(id==='wind'){const first=targets[0],dx=first.x-player.x,dy=first.y-player.y,l=Math.hypot(dx,dy)||1;targets.filter(e=>{const x=e.x-player.x,y=e.y-player.y;return dist(e,player)<350&&(x*dx+y*dy)>0&&Math.abs(x*dy-y*dx)/l<75;}).forEach(e=>{hurtEnemy(e,power);if(e.type!==20)for(let i=0;i<8;i++)move(e,dx/l*6,dy/l*6,11);fx(e.x,e.y,'slash',1.2);});}
 save();hud();tone(540,.2,'triangle');}finally{castingMagic=false;}};
const discoveryDraw=drawEnemy;
drawEnemy=function(e){if(e.type!==20)return discoveryDraw(e);shadow(e.x,e.y,18);const x=Math.round(e.x)-25,y=Math.round(e.y)-34,b=Math.floor(clock*6)%2;ctx.save();ctx.translate(x,y);ctx.scale(2,2);const r=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};r(3,10,20,7,'#5c7083');r(5,6+b,16,9,'#b5cbd7');r(8,3+b,9,8,'#e7f4f4');r(6,7,4,4,'#fffef1');r(8,11,2,3,'#273c57');r(16,11,2,3,'#273c57');r(11,15,4,1,'#627b95');r(23,2+b,1,5,'#ecfaff');r(21,4+b,5,1,'#ecfaff');ctx.restore();ctx.fillStyle='#152633';ctx.fillRect(e.x-20,e.y-39,40,3);ctx.fillStyle='#d8eef3';ctx.fillRect(e.x-20,e.y-39,40*Math.max(0,e.hp)/8,3);};
newGameHTML=function(){const existing=slotSave(newGameDraft.mode),name=cleanHeroName(newGameDraft.heroName)||defaultHeroName(newGameDraft.hero);return '<p class="lead">旅立つ勇者を選び、名前を付けてください。</p><div class="tabs">'+Object.keys(MODE_NAMES).map(id=>btn(MODE_NAMES[id],'newMode:'+id,false,newGameDraft.mode===id?'active':'')).join('')+'</div><div class="cards">'+Object.entries(HERO_NAMES).map(([id,label])=>'<button class="card hero-card '+(newGameDraft.hero===id?'chosen':'')+'" data-action="newHero:'+id+'" aria-pressed="'+(newGameDraft.hero===id)+'"><span class="hero-preview '+id+'"></span><b>'+label+'</b></button>').join('')+'</div><label class="name-label">勇者の名前<input id="newHeroName" maxlength="32" value="'+escapeHTML(name)+'" autocomplete="off"></label>'+(existing?'<p class="notice">Lv.'+existing.lv+'の記録を置き換えます。開始前の記録には、あとから戻せます。</p>':'')+btn('この勇者で旅立つ','confirmNewGame',!loaded,'primary')+' '+btn('タイトルへ戻る','cancelNewGame');};
const discoveryBegin=beginNewGame;
beginNewGame=function(){const input=$('newHeroName'),name=cleanHeroName(input?.value||newGameDraft.heroName)||defaultHeroName(newGameDraft.hero);const ok=discoveryBegin();if(ok){state.heroName=name;save();refreshCampaignTitle();hud();toast(heroDisplay()+'の旅が始まった。');}return ok;};
const discoveryTitle=refreshCampaignTitle;
refreshCampaignTitle=function(){discoveryTitle();const current=slotSave(SAVE===SAVE_SLOTS.adventure?'adventure':'debug');if(current)$('titleSaveInfo').textContent=heroDisplay(current)+' · Lv.'+current.lv+' · '+formatPlayTime(current.playSeconds);};
const discoveryHud=hud;
hud=function(){discoveryHud();$('heroName').textContent=heroDisplay();const counter=$('expCount');if(counter)counter.textContent='経験結晶 '+crystalCount();};
const discoveryJourney=journeyHTML;
journeyHTML=function(){const html=discoveryJourney().replace(/<div class="notice">[\s\S]*?<\/div>/,'<div class="notice">経験結晶を使って成長し、新しい装備や魔法を試そう。銀色のスライムは大結晶を落とす。集めた素材の売却や調合、街の抽選所も旅の助けになる。</div>');const available=Math.max(0,Math.floor(totalKills()/25)-state.bountyClaimed);return '<h3>'+escapeHTML(heroDisplay())+'の手帳</h3>'+html+(isAdventure()?'<h3>ギルドの討伐手当</h3><p>25体ごとに500G・ガチャ券1枚・10体分の経験結晶1個。</p>'+btn(available?'手当を受け取る（'+available+'回分）':'次の手当まで '+(25-totalKills()%25)+'体','claimBounty',!available):'');};
const discoveryRender=renderModal;
renderModal=function(){discoveryRender();if(modal==='expBag'){$('modalTitle').textContent='経験結晶';$('modalEyebrow').textContent='CRYSTALS OF MEMORY';$('modalBody').innerHTML=expBagHTML();}if(modal==='rename'){$('modalTitle').textContent='勇者の名前';$('modalEyebrow').textContent='YOUR NAME';$('modalBody').innerHTML='<label class="name-label">新しい名前<input id="renameInput" maxlength="32" autocomplete="off" value="'+escapeHTML(heroDisplay())+'"></label>'+btn('この名前にする','confirmRename',false,'primary');}
 if(modal==='newGame'){const input=$('newHeroName');if(input)input.oninput=()=>{newGameDraft.heroName=cleanHeroName(input.value);};}
 if(modal==='journal')$('modalBody').innerHTML='<div class="list-row"><b>'+escapeHTML(heroDisplay())+'</b>'+btn('名前を変える','open:rename',!!floor)+'</div>'+$('modalBody').innerHTML;
 if(['commands','equipment'].includes(modal))$('modalBody').innerHTML='<div class="tabs">'+btn('経験結晶 '+crystalCount()+'個','open:expBag')+'</div>'+$('modalBody').innerHTML;
 if(modal==='commands'&&player.shield>0)$('modalBody').innerHTML+='<p class="notice">灯の結界：残り吸収 '+Math.ceil(player.shield)+' / '+Math.ceil(player.shieldTime)+'秒</p>';
 if(modal==='codex')$('modalBody').innerHTML+='<div class="notice">銀灯スライムは魔法と毒をはじき、武器攻撃もほぼ1ダメージ。発見されると逃げ始める。倒せば銀灯の大結晶を必ず入手できる。狩場の殲滅には含まれないので、追うか次へ進むか選べます。</div>';
};
const discoveryAction=action;
action=function(raw){const [a,id]=raw.split(':');if(a==='expUse')return useCrystal(Number(id));if(a==='expStack')return useCrystal(Number(id),true);if(a==='expAll')return useAllCrystals();if(a==='open'&&id==='rename'&&floor)return;
 if(a==='confirmRename'){if(floor||modal!=='rename')return;const name=cleanHeroName($('renameInput').value);if(!name){toast('名前を入力してください。');return;}state.heroName=name;save();refreshCampaignTitle();hud();closeModal();toast('これからは'+name+'と名乗ることにした。');return;}
 if(a==='claimBounty'){if(floor||!isAdventure())return;const count=Math.max(0,Math.floor(totalKills()/25)-state.bountyClaimed);if(count){state.bountyClaimed+=count;state.gold+=count*500;state.tickets+=count;state.expItems[10]=(state.expItems[10]||0)+count;save();renderModal();hud();}return;}
 return discoveryAction(raw);
};
