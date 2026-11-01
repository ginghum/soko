'use strict';
(() => {
const $=id=>document.getElementById(id), canvas=$('game'), ctx=canvas.getContext('2d'), mini=$('minimap').getContext('2d');
const TILE=48, W=35, H=27, TAU=Math.PI*2; let SAVE='ember-below-v1';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const art={}, keys=new Set(); let loaded=false, running=false, modal=null, lastFocus=null, currentTab='weapons', last=0, clock=0, camera={x:0,y:0}, vw=900,vh=600,dpr=1, joystick={x:0,y:0};
let world, player, enemies=[], objects=[], attacks=[], particles=[], floats=[], effects=[], sound=false, audio, toastTimer, floor=0, hunt=null, stealth=false, ended=false, lastAutoSave=0, uid=0;
const WEAPONS=[
 {id:'sword',name:'旅人の剣',icon:0,atk:12,range:72,ct:.7,price:0,desc:'扱いやすい近接武器。間合いと手数の釣り合いがよい。'},
 {id:'dagger',name:'影縫いの短剣',icon:2,atk:8,range:53,ct:.34,price:100,desc:'素早い連撃。不意打ちのダメージが3倍になる。'},
 {id:'spear',name:'灯守りの槍',icon:3,atk:17,range:116,ct:1.05,price:150,desc:'長いリーチで、敵の攻撃圏外から突く。'},
 {id:'longsword',name:'鋼の長剣',icon:1,atk:23,range:83,ct:1,price:220,desc:'重い一撃。近くの複数の敵をまとめて斬る。'},
 {id:'bow',name:'狩人の弓',icon:4,atk:12,range:245,ct:1.05,price:180,desc:'遠距離から自動射撃。壁の向こうには届かない。'},
 {id:'staff',name:'氷晶の杖',icon:5,atk:9,range:190,ct:.9,price:210,magic:1.4,desc:'遠隔攻撃。装備中は魔法の威力が40%上昇。'},
 {id:'axe',name:'裂風の戦斧',icon:24,atk:29,range:92,ct:1.25,price:280,desc:'広い間合い。標的の周囲90にいる敵にも70%のダメージ。'},
 {id:'hammer',name:'震地の戦槌',icon:25,atk:37,range:65,ct:1.65,price:340,desc:'重い一撃で敵を0.65秒怯ませ、攻撃の予兆を中断する。'},
 {id:'crossbow',name:'貫鉄の弩',icon:26,atk:30,range:320,ct:1.55,price:310,desc:'弓より遠くへ届く、威力重視の射撃武器。'},
 {id:'venom',name:'毒牙の小剣',icon:27,atk:10,range:56,ct:.42,price:230,desc:'命中した敵に4秒間、毎秒6の毒ダメージ。不意打ちは3倍。'},
 {id:'guardian',name:'古灯の剣',icon:1,atk:31,range:96,ct:.75,price:0,desc:'守護者から受け継いだ剣。攻撃時にHPを1回復。'}
];
const ARMOR=[{id:'travel',name:'旅人の服',def:0,hp:0,price:0,desc:'旅慣れた布の服。身軽に動ける。'}, {id:'leather',name:'革の鎧',def:3,hp:15,price:100,desc:'防御+3 / 最大HP+15'}, {id:'steel',name:'鋼の鎧',def:7,hp:35,price:250,desc:'防御+7 / 最大HP+35'}, {id:'robe',name:'星詠みのローブ',def:2,hp:10,price:180,desc:'防御+2 / 最大HP+10 / 最大MP+25'}];
const SPELLS=[{id:'fire',name:'火球',mp:8,power:34,price:0,desc:'最寄りの敵を中心に炎が炸裂。半径90の範囲攻撃。'}, {id:'ice',name:'氷華',mp:12,power:26,price:130,desc:'周囲145の敵を攻撃し、4秒間移動速度を下げる。'}, {id:'heal',name:'灯の癒やし',mp:15,power:52,price:160,desc:'自分のHPを52回復する。'}, {id:'nova',name:'灯火の環',mp:24,power:64,price:300,desc:'自分を中心に、半径220の敵を焼く強力な魔法。'}];
const QUESTS=[{"id":"bats","name":"天井の羽音","text":"コウモリを8体倒す","target":8,"gold":130,"xp":60},{"id":"spiders","name":"毒糸の回廊","text":"毒蜘蛛を6体倒す","target":6,"gold":180,"xp":80},{"id":"archers","name":"闇からの矢","text":"骸骨弓兵を6体倒す","target":6,"gold":200,"xp":90},{"id":"wisps","name":"さまよう残り火","text":"火霊を6体倒す","target":6,"gold":220,"xp":100},{"id":"beetles","name":"鋼殻を砕け","text":"鎧甲虫を5体倒す","target":5,"gold":240,"xp":110},{"id":"hunters","name":"狩りの心得","text":"狩場の敵を30体倒す","target":30,"gold":250,"xp":130},{"id":"slimes","name":"道をふさぐ雫","text":"スライムを5体倒す","target":5,"gold":100,"xp":30},{"id":"bones","name":"眠れぬ巡回兵","text":"骸骨を4体倒す","target":4,"gold":140,"xp":55},{"id":"rescue","name":"帰らない薬師","text":"地下2階の薬師を見つけ、助ける","target":1,"gold":180,"xp":70},{"id":"guardian","name":"古い灯の向こう","text":"地下3階の守護者を倒す","target":1,"gold":300,"xp":130}];
let state;
function fresh(){return {version:1,lv:1,xp:0,gold:80,potions:3,ethers:1,materials:{gel:0,wing:0,bone:0,ore:0,core:0,silk:0,ember:0,shell:0},owned:['sword'],armors:['travel'],weapon:'sword',armor:'travel',upgrade:{},spells:['fire'],accepted:['slimes'],counts:{slimes:0,bones:0,rescue:0,guardian:0,bats:0,spiders:0,archers:0,wisps:0,beetles:0,hunters:0},claimed:[],loot:[],lootSerial:0,huntBest:0,huntKills:0,best:0,deaths:0,cleared:false};}
function readSave(){try {const s=JSON.parse(localStorage.getItem(SAVE));if(s?.version!==1)return null;const base=fresh();return {...base,...s,materials:{...base.materials,...s.materials},counts:{...base.counts,...s.counts}}}catch{return null}}
function save(){try{localStorage.setItem(SAVE,JSON.stringify(state));}catch{toast('セーブ容量が不足しています。ブラウザの保存設定をご確認ください。')}}
function weapon(){const drop=state.loot.find(w=>w.uid===state.weapon);if(drop){const base=WEAPONS.find(w=>w.id===drop.base);return {...base,name:drop.name,atk:base.atk+drop.bonus,loot:drop}}return WEAPONS.find(w=>w.id===state.weapon)||WEAPONS[0]}
function stats(){const a=ARMOR.find(a=>a.id===state.armor)||ARMOR[0];return {hp:100+(state.lv-1)*12+a.hp+(weapon().loot?.hp||0),mp:45+(state.lv-1)*5+(a.id==='robe'?25:0),atk:weapon().atk+(state.lv-1)*2+(state.upgrade[state.weapon]||0)*4,def:a.def+(weapon().loot?.def||0)+Math.floor((state.lv-1)/2)}}
function needXP(){return 40+(state.lv-1)*30}
function xp(n){state.xp+=n;while(state.xp>=needXP()){state.xp-=needXP();state.lv++;player.hp=stats().hp;player.mp=stats().mp;toast(`レベルアップ！ Lv.${state.lv} · HPとMPが全回復`);fx(player.x,player.y,'heal',1.4);tone(660,.15);}}
function toast(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3300)}
function tone(freq=300,duration=.08,type='sine',vol=.035){if(!sound)return;try{audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(freq,audio.currentTime);g.gain.setValueAtTime(vol,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration);}catch{}}
function resize(){const r=canvas.parentElement.getBoundingClientRect();vw=r.width;vh=r.height;dpr=Math.min(devicePixelRatio||1,2);canvas.width=vw*dpr;canvas.height=vh*dpr;ctx.imageSmoothingEnabled=false}
new ResizeObserver(resize).observe(canvas.parentElement);
function makeWorld(){return {map:Array.from({length:H},()=>Array(W).fill(0)),seen:Array.from({length:H},()=>Array(W).fill(false)),visible:Array.from({length:H},()=>Array(W).fill(false))}}
function room(x,y,w,h){for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)if(j>0&&j<H-1&&i>0&&i<W-1)world.map[j][i]=1}
function corridor(x1,y1,x2,y2){for(let x=Math.min(x1,x2);x<=Math.max(x1,x2);x++)room(x,y1,1,2);for(let y=Math.min(y1,y2);y<=Math.max(y1,y2);y++)room(x2,y,2,1)}
function obj(type,tx,ty,extra={}){objects.push({id:++uid,type,x:tx*TILE+24,y:ty*TILE+24,...extra})}
function enemy(type,tx,ty){const p=[{hp:43,atk:13,speed:43,range:54,ct:2.1,xp:12,gold:9},{hp:30,atk:10,speed:83,range:60,ct:1.8,xp:12,gold:10},{hp:78,atk:20,speed:49,range:88,ct:2.4,xp:22,gold:15},{hp:650,atk:29,speed:33,range:130,ct:2.4,xp:130,gold:160},{hp:45,atk:9,speed:75,range:57,ct:2.1,xp:17,gold:12},{hp:56,atk:16,speed:43,range:230,ct:2.6,xp:21,gold:15},{hp:48,atk:18,speed:44,range:185,ct:2.8,xp:23,gold:17},{hp:118,atk:25,speed:37,range:180,ct:3.1,xp:30,gold:21}][type],scale=1+(floor-1)*.18;enemies.push({id:++uid,type,x:tx*TILE+24,y:ty*TILE+24,...p,hp:Math.round(p.hp*scale),maxHp:Math.round(p.hp*scale),atk:Math.round(p.atk*scale),cool:1.2+Math.random(),wind:0,alert:0,dir:Math.PI/2,slow:0,hurt:0,phase:0,poison:0,poisonTick:1,stun:0,seed:Math.random()*10});}
function enterTown(initial=false){floor=0;hunt=null;stealth=false;ended=false;world=makeWorld();room(2,2,31,23);enemies=[];objects=[];attacks=[];effects=[];particles=[];floats=[];player={x:17*TILE+24,y:17*TILE+24,hp:stats().hp,mp:stats().mp,dir:0,attack:0,cool:0,poison:0,poisonTick:1,dodge:0,dodgeCD:0,inv:0,moving:false};
 obj('blacksmith',8,10);obj('merchant',25,10);obj('guild',11,19);obj('teacher',24,19);obj('gate',17,5);obj('rest',17,13);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++)world.seen[y][x]=world.visible[y][x]=true;
 state.best=Math.max(0,state.best);updateLocation();if(!initial)save();}
function enterDungeon(n){hunt=null;floor=n;state.best=Math.max(state.best,n);world=makeWorld();enemies=[];objects=[];attacks=[];effects=[];particles=[];floats=[];stealth=false;
 const rooms=[[2,3,8,7],[14,2,8,8],[26,3,7,7],[3,15,8,9],[15,14,8,10],[27,15,6,9]];rooms.forEach(r=>room(...r));corridor(6,6,18,5);corridor(18,5,29,6);corridor(6,6,6,19);corridor(6,19,18,18);corridor(18,18,29,19);corridor(29,6,29,19);corridor(18,5,18,18);
 player.x=5*TILE+24;player.y=6*TILE+24;player.inv=1;player.dodge=0;player.cool=.5;
 obj('exit',4,5);obj('stairs',30,21);obj('chest',8,4,{opened:false});obj('chest',20,3,{opened:false});obj('chest',7,21,{opened:false});obj('chest',28,16,{opened:false});
 [[4,4],[16,3],[28,4],[4,16],[16,15],[28,22]].forEach(([x,y])=>obj('torch',x,y));
 [[9,8],[15,8],[28,8],[9,17],[20,21]].forEach(([x,y])=>obj('barrel',x,y,{opened:false}));
 const spawn=[[8,8,0],[16,5,0],[20,7,1],[28,6,0],[31,8,2],[5,17,0],[8,21,1],[16,17,2],[21,20,0],[28,17,2],[30,20,1],[18,10,1],[18,13,2]];
 spawn[1][2]=4;spawn[3][2]=5;spawn[6][2]=6;spawn[10][2]=7;spawn.forEach(([x,y,t])=>enemy(t,x,y));if(n===2)obj('rescue',9,20,{done:!!state.counts.rescue});if(n===3){enemies=enemies.filter(e=>e.x<26*TILE);enemy(3,29,19);objects=objects.filter(o=>o.type!=='stairs');}
 updateLocation();closeModal();announce(`地下 ${n} 階 — ${['苔むす回廊','忘れられた詰所','古灯の祭壇'][n-1]}`);toast('近づくと自動攻撃。赤い予兆から離れて回避しよう。');}

const RARITIES=[{name:'良品',color:0,mult:1},{name:'魔力',color:1,mult:1.5},{name:'希少',color:2,mult:2.1},{name:'伝説',color:3,mult:3}];
function huntLevel(){return hunt.tier+(hunt.wave-1)*.65}
function enterHunt(tier){if(![1,4,8,12].includes(tier))return;hunt={tier,wave:1,cleared:false,lastLoot:'',bonus:0};floor=1;world=makeWorld();room(7,4,21,19);objects=[];obj('exit',17,21);[[8,5],[25,5],[8,21],[25,21]].forEach(([x,y])=>obj('torch',x,y));spawnHuntWave();}
function spawnHuntWave(){hunt.cleared=false;hunt.lastLoot='';enemies=[];attacks=[];effects=[];floats=[];particles=[];player.x=17*TILE+24;player.y=13*TILE+24;player.inv=2;player.dodge=0;player.cool=.5;stealth=false;
 const level=huntLevel(),count=6+Math.min(10,hunt.wave-1),scale=1+(level-1)*.18;
 for(let i=0;i<count;i++){const angle=TAU*i/count+Math.random()*.22,radius=210+Math.random()*80;const pool=[0,0,1,2,4,5,6,7];enemy(pool[(i+hunt.wave-1)%pool.length],(player.x+Math.cos(angle)*radius-24)/TILE,(player.y+Math.sin(angle)*radius-24)/TILE);const e=enemies.at(-1);e.hp=Math.round(e.maxHp*scale);e.maxHp=e.hp;e.atk=Math.round(e.atk*(1+(level-1)*.1));e.xp=Math.round(e.xp*(1.8+level*.16));e.gold=Math.round(e.gold*(1.3+level*.08));e.alert=999;}
 if(hunt.wave%5===0){enemy(3,17,7);const e=enemies.at(-1);e.hp=Math.round(320*scale*enemyFactor());e.maxHp=e.hp;e.atk=Math.round(25*(1+(level-1)*.1)*enemyFactor());e.xp=Math.round(150*(1+level*.15));e.alert=999;}
 closeModal();updateLocation();hud();announce('残響の狩場 — 第'+hunt.wave+'群');toast('敵を殲滅すると武器を確定入手。右下から魔法・道具を使えます。');}
function rollLoot(elite=false){const roll=Math.random(),r=elite?(roll<.15?3:roll<.6?2:1):(roll<.02?3:roll<.16?2:roll<.48?1:0),rarity=RARITIES[r],pool=WEAPONS.filter(w=>w.id!=='guardian'),base=pool[Math.floor(Math.random()*pool.length)],level=Math.max(1,Math.round(huntLevel())),bonus=Math.round((2+level*1.8+Math.random()*(3+level))*rarity.mult);
 const drop={uid:'loot-'+(++state.lootSerial),base:base.id,name:rarity.name+'の'+base.name,rarity:r,level,bonus,hp:r>0?Math.round(level*2*rarity.mult):0,def:r>1?Math.ceil(level*.3):0,value:15+level*5+r*25};
 if(state.loot.length>=60){state.gold+=drop.value;toast('戦利品が60個あるため、新しい武器を'+drop.value+'Gで自動売却。');}else{state.loot.push(drop);hunt.lastLoot=drop.name;toast('武器入手：'+drop.name+' / 追加攻撃 +'+drop.bonus);}return drop;}
function clearHuntWave(){hunt.cleared=true;attacks=[];const drop=rollLoot(hunt.wave%5===0);hunt.bonus=Math.round(20+huntLevel()*12);state.gold+=hunt.bonus;state.materials.ore++;state.potions++;if(hunt.wave%3===0)state.ethers++;state.huntBest=Math.max(state.huntBest,hunt.wave);player.hp=Math.min(stats().hp,player.hp+Math.round(stats().hp*.2));player.mp=Math.min(stats().mp,player.mp+12);hunt.reward=state.loot.some(w=>w.uid===drop.uid)?drop.name:drop.name+'（所持上限のため'+drop.value+'Gで自動売却）';save();toast('第'+hunt.wave+'群を殲滅：'+hunt.reward+' / '+hunt.bonus+'G。画面下の「次の群れへ」から続行できます。');}
function huntGateHTML(){return '<p class="lead">階層を降りず、広間で敵の群れを狩る周回ダンジョン。<br>経験値が多く、殲滅ごとにランダム性能の武器を確定入手。5群ごとに強敵が出現します。</p><div class="notice">殲滅報酬：武器1個・灯鉱石1個・回復薬1個・お金<br>HP20%・MP12回復。戦利品は自動保存され、元の迷宮でも使えます。<br>最高記録 '+state.huntBest+'群 / 累計討伐 '+state.huntKills+'体</div><div class="cards">'+[1,4,8,12].map((t,i)=>`<div class="card"><span class="tag">推奨 Lv.${t}〜</span><h3>${['初級','中級','上級','極級'][i]}</h3><p>難度 ${t}。群れが進むほど敵と戦利品が強化。</p>${btn('狩りを始める','hunt:'+t,false,'primary')}</div>`).join('')+'</div><p class="muted">武器は装備 → 戦利品から比較・装備・売却。60個を超えた新規入手分は自動売却します。倒れた場合は通常の所持金15%減少。いつでも帰還できます。</p>';}
function huntClearHTML(){if(!hunt)return '';return `<div class="notice">第${hunt.wave}群を殲滅！<br>武器：${hunt.reward}<br>${hunt.bonus}G / 灯鉱石1個 / 回復薬1個${hunt.wave%3===0?' / 魔力薬1個':''}<br>HP20%・MP12回復済み</div><p class="lead">さらに強い群れに挑むか、街に戻って準備できます。<br>右下の魔法・道具、装備メニューも利用できます。</p><div class="tabs">${btn('第'+(hunt.wave+1)+'群へ','huntNext',false,'primary')}${btn('戦利品を見る','viewLoot')}${btn('街へ帰還','town')}</div>`;}
function lootRows(){if(!state.loot.length)return '<p class="lead">狩場で敵の群れを殲滅すると、ランダム性能の武器が手に入ります。</p>';return '<p class="muted">武器ごとに追加攻撃・最大HP・防御が異なります。装備中の武器は売却できません。追加攻撃は基礎攻撃に加算されます。</p>'+[...state.loot].reverse().map(drop=>{const base=WEAPONS.find(w=>w.id===drop.base),up=state.upgrade[drop.uid]||0,atk=base.atk+drop.bonus+(state.lv-1)*2+up*4,delta=atk-stats().atk;return `<div class="list-row"><div class="item-label">${itemIcon(base.icon)}<div><b class="rarity-${drop.rarity}">${drop.name}${up?' +'+up:''}</b><p>武器Lv.${drop.level} / 攻撃 ${atk} (${delta>=0?'+':''}${delta})<br>追加攻撃 +${drop.bonus} / HP +${drop.hp} / 防御 +${drop.def}<br>間合い ${base.range} / 間隔 ${base.ct}秒<br>${traitText(drop.traits)}</p></div></div><div class="loot-actions">${btn(state.weapon===drop.uid?'装備中':'装備','equip:'+drop.uid,state.weapon===drop.uid)}${btn('売却 '+drop.value+'G','sellLoot:'+drop.uid,state.weapon===drop.uid)}</div></div>`}).join('');}

function updateLocation(){$('huntPanel').hidden=!hunt;$('townNav').hidden=!!floor;if(hunt){$('zoneTag').textContent='ECHO HUNT';$('locationName').textContent='残響の狩場';$('mapCaption').textContent='難度 '+hunt.tier+' / 第'+hunt.wave+'群';$('returnBtn').disabled=false;return;}$('zoneTag').textContent=floor?'DEPTH 0'+floor:'SANCTUARY';$('locationName').textContent=floor?['苔むす回廊','忘れられた詰所','古灯の祭壇'][floor-1]:'灯守りの街';$('mapCaption').textContent=floor?'地下 '+floor+' 階':'灯守りの街';$('returnBtn').disabled=!floor;}
function announce(t){$('areaLabel').textContent=t;}
function walkable(x,y,r=12){return [[-r,-r],[r,-r],[-r,r],[r,r]].every(([a,b])=>world.map[Math.floor((y+b)/TILE)]?.[Math.floor((x+a)/TILE)]===1)}
function move(entity,dx,dy,r=12){if(walkable(entity.x+dx,entity.y,r))entity.x+=dx;if(walkable(entity.x,entity.y+dy,r))entity.y+=dy;}
function los(a,b){const d=dist(a,b),n=Math.ceil(d/16);for(let i=1;i<n;i++){if(world.map[Math.floor((a.y+(b.y-a.y)*i/n)/TILE)]?.[Math.floor((a.x+(b.x-a.x)*i/n)/TILE)]!==1)return false;}return true}
function face(dx,dy){return Math.abs(dx)>Math.abs(dy)?(dx>0?2:1):(dy>0?0:3)}
function fx(x,y,type,scale=1){effects.push({x,y,type,life:.55,max:.55,scale})}
function float(x,y,text,color='#efd49b'){floats.push({x,y,text,color,life:1.1})}
function hurtEnemy(e,amount,backstab=false){if(e.hp<=0)return;const damage=Math.max(1,Math.round(amount));e.hp-=damage;e.hurt=.18;e.alert=5;float(e.x,e.y-25,(backstab?'不意打ち ':'')+damage,backstab?'#f7d77d':'#f4e8ce');tone(e.type===3?140:320,.05,'triangle');if(e.hp<=0){e.wind=0;state.gold+=e.gold;xp(e.xp);const mat=['gel','wing','bone','core','silk','bone','ember','shell'][e.type];state.materials[mat]++;if(e.type===0)state.counts.slimes++;if(e.type===2)state.counts.bones++;const key={1:'bats',4:'spiders',5:'archers',6:'wisps',7:'beetles'}[e.type];if(key)state.counts[key]++;if(hunt){state.huntKills++;state.counts.hunters++;if(e.type===3||Math.random()<.12)rollLoot(e.type===3);}
 if(e.type===3&&!hunt){state.counts.guardian=1;state.cleared=true;if(!state.owned.includes('guardian'))state.owned.push('guardian');toast('守護者を撃破！ 古灯の剣を入手。灯の台座を調べて帰還できます。');obj('ending',29,19);tone(880,.6);}
 for(let i=0;i<9;i++)particles.push({x:e.x,y:e.y,vx:(Math.random()-.5)*90,vy:(Math.random()-.5)*90,life:.7,color:e.type===3?'#e8bc6b':'#80b2a0'});save();}}
function hitPlayer(amount){if(player.inv>0||player.dodge>0||player.hp<=0)return;const dmg=Math.max(1,Math.round(amount)-stats().def);player.hp-=dmg;player.inv=.7;float(player.x,player.y-25,'−'+dmg,'#f59b88');tone(90,.15,'sawtooth',.025);if(player.hp<=0){state.deaths++;const lost=Math.floor(state.gold*.15);state.gold-=lost;save();openModal('down',{lost});}}
function dodge(){if(!running||modal||!floor||player.dodgeCD>0)return;let dx=joystick.x+(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),dy=joystick.y+(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);if(!dx&&!dy){[dx,dy]=[[0,1],[-1,0],[1,0],[0,-1]][player.dir]};const l=Math.hypot(dx,dy);player.dodgeVec={x:dx/l,y:dy/l};player.dodge=.25;player.dodgeCD=1.25;player.inv=.3;tone(260,.08,'triangle');}
function attack(){const w=weapon(),targets=enemies.filter(e=>e.hp>0&&dist(player,e)<w.range&&los(player,e)).sort((a,b)=>dist(player,a)-dist(player,b));if(!targets.length)return;const e=targets[0];player.dir=face(e.x-player.x,e.y-player.y);player.attack=.3;player.cool=w.ct;const back=e.alert<=0&&Math.cos(Math.atan2(player.y-e.y,player.x-e.x)-e.dir)<.25;const dmg=stats().atk*(back?(['dagger','venom'].includes(w.id)?3:2):1);if(['bow','staff','crossbow'].includes(w.id)){attacks.push({x:player.x,y:player.y,target:e,life:Math.max(.45,w.range/450+.1),player:true,damage:dmg,color:w.id==='staff'?'#a1e6f3':'#dcc595'});}else{hurtEnemy(e,dmg,back);if(w.id==='venom'){if(e.poison<=0)e.poisonTick=1;e.poison=4;}if(w.id==='hammer'&&e.hp>0){e.stun=.65;e.wind=0;e.cool=Math.max(e.cool,.9);}if(['longsword','axe'].includes(w.id))targets.slice(1).filter(t=>dist(t,e)<(w.id==='axe'?90:85)).forEach(t=>hurtEnemy(t,dmg*.7));fx(e.x,e.y-10,'slash',.65);}if(w.id==='guardian')player.hp=Math.min(stats().hp,player.hp+1);stealth=false;}
function cast(id){const s=SPELLS.find(s=>s.id===id);if(!s||!state.spells.includes(id)||!floor)return;if(player.mp<s.mp){toast('MPが足りません。');return;}if(id==='heal'&&player.hp>=stats().hp){toast('HPは満タンです。');return;}if(id==='fire'&&!enemies.some(e=>e.hp>0&&dist(player,e)<340&&los(player,e))){toast('射程内に敵がいません。');return;}
 player.mp-=s.mp;closeModal();const power=s.power*(weapon().magic||1)*(1+(state.lv-1)*.04);if(id==='heal'){player.hp=Math.min(stats().hp,player.hp+Math.round(power));fx(player.x,player.y,'heal',1.3);float(player.x,player.y-25,'+'+Math.round(power),'#a3efb9');}else{const target=id==='fire'?enemies.filter(e=>e.hp>0&&dist(player,e)<340&&los(player,e)).sort((a,b)=>dist(player,a)-dist(player,b))[0]:player;const radius=id==='fire'?90:id==='ice'?145:220;enemies.filter(e=>e.hp>0&&dist(target,e)<radius&&los(target,e)).forEach(e=>{hurtEnemy(e,power);if(id==='ice')e.slow=4;});fx(target.x,target.y,id==='ice'?'ice':'fire',id==='nova'?3:1.7);}player.cool=.3;tone(id==='heal'?740:440,.25,'triangle');}
function potion(type){const isHP=type==='hp',field=isHP?'potions':'ethers';if(!state[field]){toast('持っていません。');return;}const max=isHP?stats().hp:stats().mp;if(player[isHP?'hp':'mp']>=max){toast((isHP?'HP':'MP')+'は満タンです。');return;}state[field]--;const k=isHP?'hp':'mp';player[k]=Math.min(max,player[k]+(isHP?65:35));fx(player.x,player.y,'heal',1);toast(isHP?'回復薬を使った。HPを65回復。':'魔力薬を使った。MPを35回復。');if(modal==='commands')renderModal();save();}
function targetObject(){return objects.filter(o=>!(['torch'].includes(o.type))&&!(o.opened||o.done)).map(o=>({o,d:dist(player,o)})).filter(t=>t.d<90).sort((a,b)=>a.d-b.d)[0]?.o}
function interact(){if(!running||modal)return;const o=targetObject();if(!o)return;switch(o.type){case'blacksmith':openModal('forge');break;case'merchant':openModal('shop');break;case'guild':openModal('guild');break;case'teacher':openModal('teacher');break;case'gate':openModal('gate');break;case'rest':player.hp=stats().hp;player.mp=stats().mp;toast('灯のそばで休んだ。HP・MP全回復。');fx(player.x,player.y,'heal');break;case'exit':openModal('return');break;case'stairs':openModal('stairs');break;case'chest':o.opened=true;state.gold+=22+floor*9;state.materials.ore++;if(Math.random()<.6)state.potions++;toast(`宝箱：${22+floor*9}G、灯鉱石を入手。`);tone(660,.2);save();break;case'barrel':o.opened=true;state.gold+=5;toast('樽の中から5Gを見つけた。');save();break;case'rescue':o.done=true;state.counts.rescue=1;toast('薬師を救出！「ありがとう、街で待っているよ」');state.ethers++;save();break;case'ending':openModal('ending');break;}}
const objectNames={blacksmith:'鍛冶屋',merchant:'道具・装備屋',guild:'冒険者ギルド',teacher:'魔法教師',gate:'迷宮の入口',rest:'休息の灯',exit:'街への階段',stairs:'下り階段',chest:'宝箱',barrel:'樽',rescue:'倒れた薬師',ending:'古灯の台座'};
function update(dt){clock+=dt;if(player.poison>0){player.poison-=dt;player.poisonTick-=dt;if(player.poisonTick<=0){player.poisonTick=1;hitPlayer(4);}}if(player.hp<=0)return;player.inv=Math.max(0,player.inv-dt);player.cool-=dt;player.attack=Math.max(0,player.attack-dt);player.dodgeCD=Math.max(0,player.dodgeCD-dt);player.dodge=Math.max(0,player.dodge-dt);
 let dx=joystick.x+(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),dy=joystick.y+(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);const l=Math.hypot(dx,dy);if(l>1){dx/=l;dy/=l}player.moving=l>.1;if(player.dodge>0){move(player,player.dodgeVec.x*450*dt,player.dodgeVec.y*450*dt);}else if(player.moving){move(player,dx*(stealth?85:155)*stats().move*hazardMove()*dt,dy*(stealth?85:155)*stats().move*hazardMove()*dt);if(!player.attack)player.dir=face(dx,dy);}
 if(floor){player.mp=Math.min(stats().mp,player.mp+dt*.42);if(player.cool<=0&&player.dodge<=0)attack();
 for(const e of enemies){if(e.hp<=0)continue;if(e.poison>0){e.poison-=dt;e.poisonTick-=dt;if(e.poisonTick<=0){e.poisonTick=1;hurtEnemy(e,poisonDamage());if(e.hp<=0)continue;}}if(e.stun>0){e.stun-=dt;continue;}e.cool-=dt;e.hurt=Math.max(0,e.hurt-dt);e.slow=Math.max(0,e.slow-dt);const d=dist(e,player),angle=Math.atan2(player.y-e.y,player.x-e.x);if(d<(stealth?90:235)&&los(e,player)&&(!stealth||Math.cos(angle-e.dir)>.3))e.alert=4;e.alert=Math.max(0,e.alert-dt);
 if(e.wind>0){e.wind-=dt;if(e.wind<=0){resolveEnemyAttack(e);}continue;}if(e.alert>0){if(d<e.range&&e.cool<=0&&los(e,player)){if(canWindup(e))beginWindup(e,angle);}else if(d>e.range*.7){e.dir=angle;move(e,Math.cos(angle)*e.speed*(e.slow? .35:1)*dt,Math.sin(angle)*e.speed*(e.slow?.35:1)*dt,e.type===3?17:11);}}
 else {e.dir=Math.sin(clock*.4+e.seed)*2;move(e,Math.cos(e.dir)*e.speed*.15*dt,Math.sin(e.dir)*e.speed*.15*dt);}}
 for(const a of attacks){if(a.player){if(a.target.hp<=0){a.life=0;continue;}const dx=a.target.x-a.x,dy=a.target.y-a.y,l=Math.hypot(dx,dy);a.x+=dx/(l||1)*450*dt;a.y+=dy/(l||1)*450*dt;if(l<22){hitWeapon(a.target,a.damage,a.back);fx(a.target.x,a.target.y,'slash',.45);a.life=0;}}else{a.x+=a.vx*dt;a.y+=a.vy*dt;if(!walkable(a.x,a.y,2))a.life=0;if(dist(a,player)<18){hitPlayer(a.damage);a.life=0;}}a.life-=dt;}attacks=attacks.filter(a=>a.life>0);}
 effects.forEach(f=>f.life-=dt);effects=effects.filter(f=>f.life>0);floats.forEach(f=>{f.life-=dt;f.y-=dt*26});floats=floats.filter(f=>f.life>0);particles.forEach(p=>{p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt});particles=particles.filter(p=>p.life>0);
 if(floor){const px=Math.floor(player.x/TILE),py=Math.floor(player.y/TILE);for(let y=0;y<H;y++)for(let x=0;x<W;x++){world.visible[y][x]=Math.hypot(x-px,y-py)<7&&los(player,{x:x*TILE+24,y:y*TILE+24});if(world.visible[y][x])world.seen[y][x]=true;}for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){if(!world.map[y][x]&&[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>world.map[y+dy][x+dx]&&world.visible[y+dy][x+dx])){world.visible[y][x]=true;world.seen[y][x]=true;}}}
 const near=targetObject();$('interactHint').textContent=near?`[ E / 調べる ] ${objectNames[near.type]}`:'';$('touchInteract').style.opacity=near?'1':'.4';$('touchDodge').style.opacity=player.dodgeCD>0?'.4':'1';
 if(hunt&&!hunt.cleared&&!enemies.some(e=>e.hp>0&&e.type!==20)&&player.hp>0&&!modal)clearHuntWave();
 if(hunt){$('huntText').textContent=`難度 ${hunt.tier} · 第${hunt.wave}群 · 残り ${enemies.filter(e=>e.hp>0).length}体`;$('huntContinue').hidden=!hunt.cleared;}
 if(!floor&&clock-lastAutoSave>20){save();lastAutoSave=clock;}hud();}
function resolveEnemyAttack(e){e.cool=e.ct;if(e.type===5){const a=Math.atan2(e.aim.y-e.y,e.aim.x-e.x);attacks.push({x:e.x,y:e.y,vx:Math.cos(a)*235,vy:Math.sin(a)*235,life:2.2,damage:e.atk,color:'#d8dccb'});return;}if(e.type===6){if(dist(e.aim,player)<75)hitPlayer(e.atk);fx(e.aim.x,e.aim.y,'fire',1.7);return;}if(e.type===7){const a=Math.atan2(e.aim.y-e.y,e.aim.x-e.x),length=Math.min(190,dist(e,e.aim)+20);for(let n=0;n<length;n+=7){move(e,Math.cos(a)*7,Math.sin(a)*7,13);if(dist(e,player)<31)hitPlayer(e.atk);}fx(e.x,e.y,'slash',1);return;}if(e.type===4){if(dist(e.aim,player)<48&&player.inv<=0&&player.dodge<=0){hitPlayer(e.atk);player.poison=4;player.poisonTick=1;}fx(e.aim.x,e.aim.y,'slash',.65);return;}if(e.type===3&&e.phase%3===0){for(let i=0;i<8;i++){const a=i*TAU/8;attacks.push({x:e.x,y:e.y,vx:Math.cos(a)*155,vy:Math.sin(a)*155,life:3,damage:e.atk,color:'#e8b465'});}fx(e.x,e.y,'fire',2.4);}else{const radius=e.type===3?105:e.type===2?60:48;if(dist(e.aim,player)<radius)hitPlayer(e.atk);fx(e.aim.x,e.aim.y,e.type===3?'fire':'slash',e.type===3?1.9:.7);}}
function hud(){const s=stats();$('hpText').textContent=Math.max(0,Math.ceil(player.hp))+' / '+s.hp;$('mpText').textContent=Math.floor(player.mp)+' / '+s.mp;$('hpBar').style.width=clamp(player.hp/s.hp*100,0,100)+'%';$('mpBar').style.width=clamp(player.mp/s.mp*100,0,100)+'%';$('xpBar').style.width=state.xp/needXP()*100+'%';$('level').textContent='Lv.'+state.lv;$('gold').textContent=state.gold;$('weaponIcon').className='item-icon';$('weaponIcon').textContent='';const wi=weapon().icon;$('weaponIcon').style.backgroundImage=wi>=24?"url('assets/weapons-extra.webp')":"url('assets/items.webp')";$('weaponIcon').style.backgroundSize=wi>=24?'400% 100%':'600% 400%';$('weaponIcon').style.backgroundPosition=wi>=24?`${(wi-24)*100/3}% 0%`:`${wi%6*20}% ${Math.floor(wi/6)*100/3}%`;$('weaponName').textContent=weapon().name+((state.upgrade[state.weapon]||0)?' +'+state.upgrade[state.weapon]:'');$('stealthBtn').classList.toggle('active',stealth);
 const q=QUESTS.find(q=>state.accepted.includes(q.id)&&!state.claimed.includes(q.id));$('questPin').innerHTML=hunt?`<small>ECHO HUNT</small>殲滅で武器・素材を獲得。<br>最高記録 ${state.huntBest}群 / 累計 ${state.huntKills}体`:q?`<small>ACTIVE QUEST</small>${q.text} <span style="color:var(--gold)">${Math.min(q.target,state.counts[q.id])}/${q.target}</span>`:'<small>YOUR JOURNEY</small>'+(state.cleared?'古灯を受け継いだ。街で依頼を報告しよう。':floor?'奥へ進み、灯の謎を解こう。':'ギルドで依頼を受け、迷宮へ向かおう。');const boss=enemies.find(e=>e.type===3&&e.hp>0&&dist(e,player)<500);$('bossHud').hidden=!boss;if(boss)$('bossBar').style.width=boss.hp/boss.maxHp*100+'%';}
const enemyRects=[[86,107,281,241],[394,45,574,241],[725,86,916,251],[997,136,1184,240],[34,337,333,479],[375,288,573,480],[645,299,943,495],[1004,330,1207,480],[16,566,282,811],[375,490,597,820],[658,593,1000,800],[1015,588,1200,811],[12,866,352,1211],[349,803,659,1210],[676,839,974,1206],[993,911,1243,1208]];
const combatRects=[[57,11,263,304],[312,50,609,304],[652,107,912,300],[977,55,1231,304],[45,317,268,602],[295,369,629,601],[657,411,924,606],[991,365,1223,606],[29,626,231,905],[283,668,627,902],[650,702,915,897],[978,660,1224,905],[50,910,263,1208],[321,951,644,1214],[658,987,901,1219],[999,962,1225,1209]];
function sprite(sheet,index,cols,rows,x,y,w,h,alpha=1){const img=art[sheet];if(sheet==='enemies'||sheet==='combat'){if(!img?.naturalWidth)return;const [a,b,c,d]=(sheet==='enemies'?enemyRects:combatRects)[index],ratio=img.naturalWidth/1254,factor=w/(1254/4),dw=(c-a)*factor,dh=(d-b)*factor;ctx.save();ctx.globalAlpha=alpha;ctx.drawImage(img,a*ratio,b*ratio,(c-a)*ratio,(d-b)*ratio,x-dw/2,y-dh,dw,dh);ctx.restore();return;}if(!img?.complete||!img.naturalWidth)return;const sw=img.naturalWidth/cols,sh=img.naturalHeight/rows;ctx.save();ctx.globalAlpha=alpha;ctx.drawImage(img,(index%cols)*sw,Math.floor(index/cols)*sh,sw,sh,x-w/2,y-h,w,h);ctx.restore();}
function draw(){ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#0a151a';ctx.fillRect(0,0,vw,vh);if(!world||!loaded)return;const scale=vw<650?1.05:1.3;camera.x=player.x-vw/(2*scale);camera.y=player.y-vh/(2*scale);ctx.save();ctx.scale(scale,scale);ctx.translate(-Math.round(camera.x),-Math.round(camera.y));
 const minX=Math.max(0,Math.floor(camera.x/TILE)-1),minY=Math.max(0,Math.floor(camera.y/TILE)-2),maxX=Math.min(W,Math.ceil((camera.x+vw/scale)/TILE)+1),maxY=Math.min(H,Math.ceil((camera.y+vh/scale)/TILE)+2);
 for(let y=minY;y<maxY;y++)for(let x=minX;x<maxX;x++){if(floor&&!world.seen[y][x])continue;const px=x*TILE,py=y*TILE;ctx.globalAlpha=(floor&&!world.visible[y][x]) ? .3 : 1;
 if(world.map[y][x]){const i=floor?((x*7+y*11)%13===0?2:(x+y)%9===0?1:0):((x>=15&&x<=19)||(y>=12&&y<=14)?27:24);tile(i,px,py);if(floor){ctx.fillStyle='rgba(5,18,24,.12)';ctx.fillRect(px,py,TILE,TILE);} }
 else if(world.map[y+1]?.[x]||world.map[y]?.[x+1]||world.map[y]?.[x-1]||world.map[y-1]?.[x]){tile(floor?4:25,px,py);ctx.fillStyle='#0c171c77';ctx.fillRect(px,py,TILE,TILE);}ctx.globalAlpha=1;}
 if(!floor)drawTown();
 for(const e of enemies){if(e.hp>0&&e.wind>0&&visible(e))drawWindup(e);}
 const entities=[...objects.filter(visible).map(o=>({y:o.y,draw:()=>drawObject(o)})),...enemies.filter(e=>e.hp>0&&visible(e)).map(e=>({y:e.y,draw:()=>drawEnemy(e)})),{y:player.y,draw:drawPlayer}];entities.sort((a,b)=>a.y-b.y).forEach(e=>e.draw());
 for(const a of attacks){ctx.fillStyle=a.color;ctx.shadowColor=a.color;ctx.shadowBlur=10;ctx.beginPath();ctx.arc(a.x,a.y,a.player?3:6,0,TAU);ctx.fill();ctx.shadowBlur=0;}
 for(const f of effects){const row={slash:0,fire:1,ice:2,heal:3}[f.type],frame=Math.min(3,Math.floor((1-f.life/f.max)*4));sprite('effects',row*4+frame,4,4,f.x,f.y+22,90*f.scale,90*f.scale,Math.min(1,f.life*4));}
 for(const p of particles){ctx.globalAlpha=p.life/.7;ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,3,3);}ctx.globalAlpha=1;
 ctx.globalAlpha=1;ctx.restore();
 const vignette=ctx.createRadialGradient(vw/2,vh/2,vh*.2,vw/2,vh/2,Math.max(vw,vh)*.65);vignette.addColorStop(0,'#07101700');vignette.addColorStop(1,floor?'#04101bb0':'#04101b70');ctx.fillStyle=vignette;ctx.fillRect(0,0,vw,vh);drawMap();}
const terrainCols=[[26,204],[235,399],[440,604],[636,820],[853,1022],[1053,1231]],terrainRows=[[25,187],[214,392],[417,581],[608,787],[814,979],[999,1188]];
function tile(i,x,y){const [a,b]=terrainCols[i%6],[c,d]=terrainRows[Math.floor(i/6)];const pad=7;ctx.fillStyle=floor?'#26373a':'#3a543a';ctx.fillRect(x,y,TILE,TILE);const ratio=art.terrain.naturalWidth/1254;ctx.drawImage(art.terrain,(a+pad)*ratio,(c+pad)*ratio,(b-a-pad*2)*ratio,(d-c-pad*2-5)*ratio,x,y,TILE+1,TILE+1)}
function visible(e){return !floor||world.visible[Math.floor(e.y/TILE)]?.[Math.floor(e.x/TILE)]}
function shadow(x,y,w=17){ctx.fillStyle='#020c1280';ctx.beginPath();ctx.ellipse(x,y-3,w,w*.38,0,0,TAU);ctx.fill()}
function drawPlayer(){shadow(player.x,player.y);let row=player.dir,frame=player.moving?Math.floor(clock*9)%4:0,sheet='hero';if(player.attack>0){sheet='combat';frame=player.attack>.15?0:1;}else if(player.dodge>0){sheet='combat';frame=2;}else if(player.inv>.4){sheet='combat';frame=3;}let alpha=stealth?.56:1;if(player.inv>0&&Math.floor(clock*15)%2)alpha*=.6;sprite(sheet,row*4+frame,4,4,player.x,player.y+8,72,72,alpha);}
function drawEnemy(e){shadow(e.x,e.y,e.type===3?37:19);let frame=e.hurt?3:e.wind>0?1:e.cool>e.ct-.25?2:0;const sz=e.type===3?122:e.type===2?77:e.type>=4?80:65;sprite(e.type>=4?'newenemies':'enemies',(e.type>=4?e.type-4:e.type)*4+frame,4,4,e.x,e.y+8,sz,sz);if(e.hp<e.maxHp&&e.type!==3){ctx.fillStyle='#081319';ctx.fillRect(e.x-21,e.y-sz+10,42,4);ctx.fillStyle='#b88060';ctx.fillRect(e.x-21,e.y-sz+10,42*e.hp/e.maxHp,4);}}
function drawObject(o){shadow(o.x,o.y,o.type==='gate'?30:16);const npcs={blacksmith:0,teacher:1,merchant:2,guild:3,rescue:2};if(o.type in npcs){sprite('npcs',npcs[o.type]*4,4,4,o.x,o.y+7,75,75,o.done?.55:1);if(!o.done){ctx.fillStyle='#e7c985';ctx.font='15px Georgia';ctx.textAlign='center';ctx.fillStyle='#e7c985';ctx.fillRect(o.x-3,o.y-64,6,6);}return;}
 const pi={chest:o.opened?1:0,barrel:o.opened?7:6,torch:4,gate:10,exit:13,stairs:12,rest:18,ending:18}[o.type];sprite('props',pi??0,5,4,o.x,o.y+5,o.type==='gate'?108:70,o.type==='gate'?108:70);if(['rest','torch','ending'].includes(o.type)){const g=ctx.createRadialGradient(o.x,o.y-25,2,o.x,o.y-25,90);g.addColorStop(0,'#f4bb5430');g.addColorStop(1,'#e09e2800');ctx.fillStyle=g;ctx.fillRect(o.x-90,o.y-115,180,180);}}
function drawTown(){const houses=[[6,7,5,2],[23,7,5,2],[8,17,5,1],[22,17,5,1]];for(const [x,y,w]of houses){for(let i=0;i<w;i++){sprite('terrain',33,6,6,(x+i)*TILE+24,y*TILE+55,60,65);tile(29,(x+i)*TILE,(y+1)*TILE);} }ctx.fillStyle='#143b3655';for(let i=0;i<20;i++){const x=(3+i*7%29)*TILE,y=(3+i*11%21)*TILE;if(Math.abs(x-17*TILE)>170){ctx.beginPath();ctx.arc(x,y,18,0,TAU);ctx.fill();}}}
function drawMap(){mini.fillStyle='#0a171d';mini.fillRect(0,0,156,126);const sx=156/W,sy=126/H;for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(!world.seen[y][x]||!world.map[y][x])continue;mini.fillStyle=world.visible[y][x]?'#446268':'#243a43';mini.fillRect(x*sx,y*sy,sx+.2,sy+.2);}for(const o of objects){if(!world.seen[Math.floor(o.y/TILE)]?.[Math.floor(o.x/TILE)]||['torch','barrel'].includes(o.type))continue;mini.fillStyle=o.type==='stairs'||o.type==='ending'?'#e1bb79':o.type==='chest'?'#9d855a':'#7bb5a0';mini.fillRect(o.x/TILE*sx-1,o.y/TILE*sy-1,3,3);}mini.fillStyle='#f5dfac';mini.fillRect(player.x/TILE*sx-2,player.y/TILE*sy-2,4,4);}
function openModal(kind,data={}){lastFocus=document.activeElement;modal=kind;keys.clear();joystick.x=joystick.y=0;$('modalBackdrop').hidden=false;$('modal').dataset.info=JSON.stringify(data);renderModal();$('closeModal').focus();}
function closeModal(){if(modal==='down')return;modal=null;$('modalBackdrop').hidden=true;keys.clear();lastFocus?.focus?.();}
const itemIcon=(i)=>`<span aria-hidden="true" class="item-icon" style="${i>=24?`background-image:url('assets/weapons-extra.webp');background-size:400% 100%;background-position:${(i-24)*100/3}% 0%`:`background-position:${i%6*20}% ${Math.floor(i/6)*100/3}%`}"></span>`;
const btn=(text,action,disabled=false,cls='')=>`<button class="${cls}" data-action="${action}" ${disabled?'disabled':''}>${text}</button>`;
function renderModal(){const titles={huntGate:['ECHO HUNT','残響の狩場'],huntClear:['WAVE CLEARED','狩りの戦果'],commands:['TACTICAL PAUSE','魔法と道具'],equipment:['INVENTORY','旅の装備'],shop:['TRADING POST','道具と装備の店'],forge:['THE BLACKSMITH','鍛冶屋の炉'],guild:['ADVENTURERS GUILD','冒険者ギルド'],teacher:['ARCANE STUDY','灯を紡ぐ魔法'],gate:['INTO THE DEPTHS','迷宮へ'],stairs:['DEEPER BELOW','下り階段'],return:['RETURN TO SANCTUARY','街へ帰還'],journal:['TRAVEL JOURNAL','旅の記録'],help:['HOW TO PLAY','旅の手引き'],down:['A FADING EMBER','灯は、まだ消えない'],ending:['THE EMBER BELOW','灯を受け継ぐ者']};const [en,ja]=titles[modal]||titles.journal;$('modalEyebrow').textContent=en;$('modalTitle').textContent=ja;let html='';const s=stats();
 if(modal==='commands'){html='<p class="lead">選択中は時間が止まっています。魔法は選ぶと即座に発動します。</p><div class="cards">'+state.spells.map(id=>{const sp=SPELLS.find(s=>s.id===id);return `<div class="card"><span class="tag">MAGIC · MP ${sp.mp}</span><h3>${sp.name}</h3><p>${sp.desc}</p>${btn('発動する','cast:'+id,!floor||player.mp<sp.mp)}</div>`}).join('')+`<div class="card"><span class="tag">ITEM · 所持 ${state.potions}</span><h3>回復薬</h3><p>HPを65回復。</p>${btn('使う','potion:hp',!state.potions||player.hp>=s.hp)}</div><div class="card"><span class="tag">ITEM · 所持 ${state.ethers}</span><h3>魔力薬</h3><p>MPを35回復。</p>${btn('使う','potion:mp',!state.ethers||player.mp>=s.mp)}</div></div>`;}
 if(modal==='equipment'){html=`<div class="stats-grid">${[['最大HP',s.hp],['最大MP',s.mp],['攻撃力',s.atk],['防御力',s.def]].map(([k,v])=>`<div class="stat"><small>${k}</small><b>${v}</b></div>`).join('')}</div><div class="tabs">${btn('武器','tab:weapons',false,currentTab==='weapons'?'active':'')}${btn('防具','tab:armor',false,currentTab==='armor'?'active':'')}${btn('戦利品 '+state.loot.length,'tab:loot',false,currentTab==='loot'?'active':'')}${btn('素材','tab:materials',false,currentTab==='materials'?'active':'')}</div>`;if(currentTab==='weapons')html+=WEAPONS.filter(w=>state.owned.includes(w.id)).map(w=>`<div class="list-row"><div class="item-label">${itemIcon(w.icon)}<div><b>${w.name} ${(state.upgrade[w.id]||0)?'+'+state.upgrade[w.id]:''}</b><p>攻撃 ${w.atk+(state.lv-1)*2+(state.upgrade[w.id]||0)*4} / 間合い ${w.range} / 間隔 ${w.ct}秒<br>${w.desc}</p></div></div>${btn(state.weapon===w.id?'装備中':'装備','equip:'+w.id,state.weapon===w.id)}</div>`).join('');if(currentTab==='armor')html+=ARMOR.filter(a=>state.armors.includes(a.id)).map(a=>`<div class="list-row"><div class="item-label">${itemIcon(a.icon??6+ARMOR.indexOf(a))}<div><b>${a.name}</b><p>${a.desc}</p></div></div>${btn(state.armor===a.id?'装備中':'装備','armor:'+a.id,state.armor===a.id)}</div>`).join('');if(currentTab==='materials')html+=materialRows();}
 if(modal==='shop'){html=`<p class="lead">「帰るための薬は、忘れずに。」　所持金 <b>${state.gold} G</b></p><div class="tabs">${btn('武器','tab:weapons')}${btn('防具','tab:armor')}${btn('道具・売却','tab:materials')}</div>`;if(currentTab==='weapons')html+=WEAPONS.filter(w=>w.price).map(w=>`<div class="list-row"><div class="item-label">${itemIcon(w.icon)}<div><b>${w.name}</b><p>攻撃 ${w.atk} / 間合い ${w.range}<br>${w.desc}</p></div></div>${btn(state.owned.includes(w.id)?'購入済み':w.price+' G','buyweapon:'+w.id,state.owned.includes(w.id)||state.gold<w.price)}</div>`).join('');if(currentTab==='armor')html+=ARMOR.filter(a=>a.price).map(a=>`<div class="list-row"><div class="item-label">${itemIcon(a.icon??6+ARMOR.indexOf(a))}<div><b>${a.name}</b><p>${a.desc}</p></div></div>${btn(state.armors.includes(a.id)?'購入済み':a.price+' G','buyarmor:'+a.id,state.armors.includes(a.id)||state.gold<a.price)}</div>`).join('');if(currentTab==='materials')html+=`<div class="list-row"><div><b>回復薬 ×1</b><p>HP65回復 / 所持 ${state.potions}</p></div>${btn(goldCost(20)+' G','buy:potions',state.gold<goldCost(20))}</div><div class="list-row"><div><b>魔力薬 ×1</b><p>MP35回復 / 所持 ${state.ethers}</p></div>${btn(goldCost(35)+' G','buy:ethers',state.gold<goldCost(35))}</div>`+materialRows(true);}
 if(modal==='forge'){const n=state.upgrade[state.weapon]||0,cost=goldCost(60+n*50),ore=n+1;html=`<p class="lead">「よく使う刃ほど、いい灯を宿す。」<br>灯鉱石とお金で、装備中の武器を最大+5まで強化できます。</p><div class="notice">${weapon().name} +${n} → +${n+1}<br>攻撃力 +4 / 必要：${cost} G ＋ 灯鉱石 ${ore}個<br>所持：${state.gold} G / 灯鉱石 ${state.materials.ore}個</div>${btn(n>=5?'最大強化済み':'この武器を強化','upgrade',n>=5||state.gold<cost||state.materials.ore<ore,'primary')}<p class="muted">素材を集めるなら迷宮の宝箱へ。装備を変えると、強化対象も変わります。</p>`;}
 if(modal==='guild'){html='<p class="lead">「この街の灯を、絶やさないために。」<br>討伐・救助の記録は受注前の分も数えます。達成した依頼はここで報告してください。</p>'+QUESTS.map(q=>{const claimed=state.claimed.includes(q.id),accepted=state.accepted.includes(q.id),count=Math.min(q.target,state.counts[q.id]);return `<div class="list-row"><div><b>${q.name}</b><p>${q.text}　${count}/${q.target}<br>報酬：${q.gold} G / EXP ${q.xp}</p></div>${btn(claimed?'報告済み':!accepted?'受注する':count>=q.target?'報告する':'進行中',(accepted?'claim:':'accept:')+q.id,claimed||(accepted&&count<q.target))}</div>`}).join('');}
 if(modal==='teacher'){html='<p class="lead">「覚えた魔法は、何度でも。必要なのは魔力だけ。」<br>魔法はコマンドから使用。街の休息の灯でMPを全回復できます。</p>'+SPELLS.map(sp=>`<div class="list-row"><div><b>${sp.name} <small>MP ${sp.mp}</small></b><p>${sp.desc}</p></div>${btn(state.spells.includes(sp.id)?'習得済み':sp.price+' Gで習得','learn:'+sp.id,state.spells.includes(sp.id)||state.gold<sp.price)}</div>`).join('');}
 if(modal==='huntGate')html=huntGateHTML();
 if(modal==='huntClear')html=huntClearHTML();
 if(modal==='equipment'&&currentTab==='loot')html+=lootRows();
 if(modal==='gate')html='<p class="lead">苔むす回廊、忘れられた詰所、そして古灯の祭壇。<br>迷宮は地下3階まで続きます。探索中も「帰還」から街へ戻れます。</p><div class="notice">持ち物：回復薬 '+state.potions+' / 魔力薬 '+state.ethers+'<br>武器：'+weapon().name+' / Lv.'+state.lv+'</div>'+btn('地下1階へ進む','enter:1',false,'primary')+'<p class="muted">迷宮へ入り直すと、敵と宝箱が再配置されます。HP・MPは現在の値を引き継ぎます。周回で育てるなら街の「狩場」へ。</p>';
 if(modal==='stairs')html=`<p class="lead">階段の先から、冷たい風が吹いてくる。<br>下の階は敵が強くなります。今なら戦利品を持って街に戻れます。</p>${btn('地下'+(floor+1)+'階へ進む','enter:'+(floor+1),false,'primary')} ${btn('街へ帰る','town')}`;
 if(modal==='return')html='<p class="lead">集めた素材やお金を持って、街へ戻ります。<br>HPとMPが全回復し、冒険の記録が保存されます。</p>'+btn('街に帰還する','town',false,'primary');
 if(modal==='journal')html=`<div class="stats-grid">${[['レベル',state.lv],['到達階',state.best],['討伐数',state.counts.slimes+state.counts.bones],['所持金',state.gold]].map(([k,v])=>`<div class="stat"><small>${k}</small><b>${v}</b></div>`).join('')}</div><p class="lead">${state.cleared?'古灯の守護者を倒し、新たな灯守りになりました。':'迷宮の底で、古い灯があなたを待っています。'}<br>成長・持ち物・依頼は自動保存されます。再開時は街から始まります。探索中の敵や宝箱の状態は保存されません。</p><div class="tabs">${btn('記録を保存','save')}${btn('操作の手引き','help')}${btn('タイトルに戻る','title')}</div><details><summary class="muted">冒険の記録を消去</summary><p class="muted">レベル・装備・所持品・依頼の記録を削除します。</p>${btn('削除の確認へ','resetconfirm',false,'danger')}</details>`;
 if(modal==='help')html='<div class="notice">敵に近づくと自動で通常攻撃。赤い円は敵の攻撃予兆です。円の外へ移動するか、回避でやり過ごしましょう。</div><div class="list-row"><div><b>移動</b><p>PC：WASD / 矢印キー<br>スマホ：左下のスティック</p></div></div><div class="list-row"><div><b>回避 / 調べる</b><p>PC：Shift / E　スマホ：右下のボタン<br>回避中は無敵。再使用まで1.25秒。</p></div></div><div class="list-row"><div><b>魔法・道具 / 装備</b><p>Space / I、または右下の魔法ボタン・下の装備ボタン。メニュー中は時間停止。<br>通常攻撃の向きは近い敵へ自動で合わせます。</p></div></div><div class="list-row"><div><b>忍び歩き</b><p>C、または下のボタン。移動が遅くなる代わりに発見されにくくなります。<br>気づかれていない敵の背後・側面から攻撃すると2倍。短剣なら3倍。</p></div></div><p class="muted">街ではNPCや入口へ近づき「調べる」。休息の灯は無料で全回復。素材は店で売却、鉱石は鍛冶に使用。倒れると所持金の15%を落としますが、素材や装備は残ります。</p>';
 if(modal==='down'){const {lost}=JSON.parse($('modal').dataset.info);html=`<p class="lead">街の人があなたを運んでくれた。<br>${lost} Gを落としました。装備と素材は無事です。</p>${btn('街で目を覚ます','revive',false,'primary')}`;$('closeModal').hidden=true;}else $('closeModal').hidden=false;
 if(modal==='ending')html='<div class="notice">あなたが刃を収めると、守護者の胸の灯が静かに揺れた。<br>それは迷宮を閉ざすための炎ではない。<br>帰り道を照らすために、守られ続けてきた灯だった。</div><p class="lead">古灯の剣を入手しました。装備メニューから装備できます。<br>街へ戻り、ギルドにこの旅の結末を伝えましょう。<br>クリア後も探索・装備強化を続けられます。</p>'+btn('灯を携えて、街へ','town',false,'primary');
 $('modalBody').innerHTML=html;}
function materialRows(sell=false){return [['gel','雫のかけら',5],['wing','夜色の翼',7],['bone','古びた骨',9],['ore','灯鉱石',16],['core','古灯の核',100],['silk','毒蜘蛛の糸',10],['ember','火霊の残り火',13],['shell','甲虫の鋼殻',15]].map(([id,name,price])=>`<div class="list-row"><div><b>${name} × ${state.materials[id]}</b><p>${id==='ore'?'武器の強化に使用。':id==='core'?'古い守護者が残した灯。':'店で売却してお金にできる。'}</p></div>${sell?btn('全て売却 '+state.materials[id]*price+' G','sell:'+id,!state.materials[id]):''}</div>`).join('')}
function transact(price,fn){if(state.gold<price)return;state.gold-=price;fn();save();renderModal();hud();tone(560,.1);}
function action(raw){const [a,id]=raw.split(':');if(a==='viewLoot'){currentTab='loot';return openModal('equipment');}if(a==='cast')return cast(id);if(a==='potion')return potion(id);if(a==='tab'){currentTab=id;renderModal();return;}if(a==='equip'){if(state.owned.includes(id)||state.loot.some(w=>w.uid===id)){state.weapon=id;player.hp=Math.min(player.hp,stats().hp);}}
 if(a==='sellLoot'){const drop=state.loot.find(w=>w.uid===id);if(drop&&state.weapon!==id){state.gold+=drop.value;state.loot=state.loot.filter(w=>w.uid!==id);delete state.upgrade[id];}}
 if(a==='hunt'&&!floor)return enterHunt(Number(id));
 if(a==='huntNext'&&hunt?.cleared){hunt.wave++;return spawnHuntWave();}if(a==='armor'){if(state.armors.includes(id)){const old=stats();state.armor=id;player.hp=Math.min(player.hp+(stats().hp-old.hp),stats().hp);player.mp=Math.min(player.mp,stats().mp);}}
 if(a==='buyweapon'){const w=WEAPONS.find(w=>w.id===id);if(w&&!state.owned.includes(id))return transact(w.price,()=>{state.owned.push(id);toast(w.name+'を購入。装備から切り替えられます。')});}if(a==='buyarmor'){const ar=ARMOR.find(w=>w.id===id);if(ar&&!state.armors.includes(id))return transact(ar.price,()=>state.armors.push(id));}if(a==='buy')return transact(goldCost(id==='potions'?20:35),()=>state[id]++);
 if(a==='learn'){const s=SPELLS.find(s=>s.id===id);if(s&&!state.spells.includes(id))return transact(s.price,()=>state.spells.push(id));}if(a==='sell'){const prices={gel:5,wing:7,bone:9,ore:16,core:100,silk:10,ember:13,shell:15};if(id in prices){state.gold+=state.materials[id]*prices[id];state.materials[id]=0;}}
 if(a==='upgrade'){const n=state.upgrade[state.weapon]||0;if(n<5&&state.materials.ore>=n+1)return transact(goldCost(60+n*50),()=>{state.materials.ore-=n+1;state.upgrade[state.weapon]=n+1;toast('武器を強化しました。攻撃力 +4');});}
 if(a==='accept'&&!state.accepted.includes(id)&&QUESTS.some(q=>q.id===id))state.accepted.push(id);if(a==='claim'){const q=QUESTS.find(q=>q.id===id);if(q&&!state.claimed.includes(id)&&state.accepted.includes(id)&&state.counts[id]>=q.target){state.claimed.push(id);state.gold+=q.gold;xp(q.xp);toast('依頼報酬：'+q.gold+' G / EXP '+q.xp);}}
 if(a==='enter')return enterDungeon(Number(id));if(a==='town'||a==='revive'){modal=null;$('modalBackdrop').hidden=true;enterTown();announce('灯守りの街');return;}if(a==='save'){save();toast('旅の記録を保存しました。');return;}if(a==='help')return openModal('help');if(a==='title'){save();modal=null;$('modalBackdrop').hidden=true;running=false;$('titleScreen').hidden=false;$('continueBtn').hidden=false;return;}if(a==='resetconfirm'){ $('modalBody').innerHTML='<p class="lead">この冒険の記録を完全に削除しますか？</p>'+btn('削除して最初から','reset',false,'danger')+' '+btn('取り消す','cancelreset');return;}if(a==='cancelreset')return renderModal();if(a==='reset'){try{localStorage.removeItem(SAVE)}catch{}state=fresh();modal=null;$('modalBackdrop').hidden=true;enterTown(true);save();announce('新しい旅');return;}
 save();renderModal();hud();}
// EXPANSION START
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

// EXPANSION END
// ASCENT START
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
drawTown=function(){ascentDrawTown();if(state.counts.sewerRescue){sprite('npcs',8,4,4,14*TILE+24,13*TILE+31,70,70);ctx.fillStyle='#7ba279';ctx.fillRect(14*TILE+12,13*TILE-32,24,8);}if(state.forgeUnlocked){ctx.fillStyle='#cfac68';ctx.fillRect(8*TILE+10,9*TILE-4,30,5);}};

// ASCENT END
// CAMPAIGN START
// Separate long-form adventure and legacy debug saves. Rules cannot change mid-run.
const SAVE_SLOTS={debug:'ember-below-v1',adventure:'ember-below-adventure-v1'},LAST_SLOT='ember-below-active-slot';
const MODE_NAMES={debug:'デバッグ',adventure:'冒険'},HERO_NAMES={traveler:'茶髪の旅人',heroine:'白髪ロングの女勇者'};
let newGameDraft={mode:'adventure',hero:'traveler'},lastModeAutoSave=0;
const campaignFresh=fresh;
fresh=function(){return {...campaignFresh(),gameMode:'debug',hero:'traveler',playSeconds:0,journeyClaimed:[]};};
function isAdventure(){return state?.gameMode==='adventure';}
function enemyFactor(){return isAdventure()?3:1;}
function goldCost(n){return Math.round(n*(isAdventure()?30:1));}
const campaignNeedXP=needXP;
needXP=function(){return campaignNeedXP()*(isAdventure()?50:1);};
// Catalogue prices are computed from immutable base prices, never multiplied in-place.
for(const item of [...WEAPONS,...ARMOR,...SPELLS]){const base=item.price;Object.defineProperty(item,'price',{enumerable:true,get:()=>goldCost(base)});}
const campaignNormalize=normalizeSave;
normalizeSave=function(raw){const s=campaignNormalize(raw);s.gameMode=raw.gameMode==='adventure'?'adventure':'debug';s.hero=Object.hasOwn(HERO_NAMES,raw.hero)?raw.hero:'traveler';s.playSeconds=Number.isFinite(raw.playSeconds)?clamp(raw.playSeconds,0,1e9):0;s.journeyClaimed=Array.isArray(raw.journeyClaimed)?[...new Set(raw.journeyClaimed.filter(id=>JOURNEY_GOALS.some(g=>g.id===id)))]:[];const limit=(40+(s.lv-1)*30)*(s.gameMode==='adventure'?50:1);s.xp=Number.isFinite(raw.xp)?clamp(Math.floor(raw.xp),0,limit-1):0;return s;};
function chooseSlot(mode){SAVE=SAVE_SLOTS[mode==='adventure'?'adventure':'debug'];}
function rememberSlot(){try{localStorage.setItem(LAST_SLOT,state.gameMode);}catch{}}
function slotSave(mode){try{const text=localStorage.getItem(SAVE_SLOTS[mode]);if(!text)return null;const s=normalizeSave(JSON.parse(text));return s.gameMode===mode?s:null;}catch{return null;}}
const campaignSave=save;
save=function(){if(!state)return;chooseSlot(state.gameMode);campaignSave();rememberSlot();};
const campaignRead=readSave;
readSave=function(){const s=campaignRead();if(!s)return null;const expected=SAVE===SAVE_SLOTS.adventure?'adventure':'debug';return s.gameMode===expected?s:null;};
function continueMode(mode){if(!loaded||!slotSave(mode))return;chooseSlot(mode);start(true);rememberSlot();refreshCampaignTitle();}
function newGameHTML(){const existing=slotSave(newGameDraft.mode);return '<p class="lead">長い旅を始める前に、モードと主人公を選びましょう。主人公による性能差はありません。</p><h3>ゲームモード</h3><div class="cards">'+Object.keys(MODE_NAMES).map(id=>'<button class="card mode-card '+(newGameDraft.mode===id?'chosen':'')+'" data-action="newMode:'+id+'" aria-pressed="'+(newGameDraft.mode===id)+'"><b>'+MODE_NAMES[id]+'</b><p>'+(id==='adventure'?'長期攻略用。必要EXP×50、金貨での購入・鍛冶費用×30、敵のHP・攻撃力×3。':'これまでの速い育成・通常価格・敵能力。機能の確認や気軽な周回向け。')+'</p></button>').join('')+'</div><h3>主人公</h3><div class="cards">'+Object.entries(HERO_NAMES).map(([id,name])=>'<button class="card hero-card '+(newGameDraft.hero===id?'chosen':'')+'" data-action="newHero:'+id+'" aria-pressed="'+(newGameDraft.hero===id)+'"><span class="hero-preview '+id+'"></span><b>'+name+'</b></button>').join('')+'</div><div class="notice">'+(existing?MODE_NAMES[newGameDraft.mode]+'のLv.'+existing.lv+'の記録を新しい冒険で置き換えます。開始前の記録は1件保存し、バックアップ画面から戻せます。':'このモードにはまだ記録がありません。')+'<br>デバッグと冒険は別々に保存されます。別モードの進行は変更しません。<br>冒険は4時間以上の探索・収集を目標にした厳しい設定です。実際の所要時間は攻略方法で変わります。</div>'+btn('この設定で、はじめから','confirmNewGame',!loaded,'primary')+' '+btn('タイトルへ戻る','cancelNewGame');}
function openNewGame(){newGameDraft={mode:'adventure',hero:'traveler'};state??=readSave()||fresh();if(!player)enterTown(true);openModal('newGame');}
function beginNewGame(){if(!loaded)return false;const mode=newGameDraft.mode,hero=newGameDraft.hero,key=SAVE_SLOTS[mode],next={...fresh(),gameMode:mode,hero};
 try{const old=localStorage.getItem(key);if(old)localStorage.setItem(key+'-before-new-game',old);localStorage.setItem(key,JSON.stringify(next));}catch{toast('新しい記録を保存できません。現在の記録は変更していません。');return false;}
 state=next;chooseSlot(mode);currentTab='weapons';modal=null;$('modalBackdrop').hidden=true;running=true;$('titleScreen').hidden=true;enterTown(true);rememberSlot();save();refreshCampaignTitle();hud();toast(MODE_NAMES[mode]+'モード：'+HERO_NAMES[hero]+'で旅を始めました。');return true;
}
function refreshCampaignTitle(){const active=SAVE===SAVE_SLOTS.adventure?'adventure':'debug',current=slotSave(active),other=active==='adventure'?'debug':'adventure',alternate=slotSave(other);$('startBtn').textContent='つづきから（'+MODE_NAMES[active]+'）';$('startBtn').hidden=!current;$('continueBtn').hidden=true;const b=$('otherContinueBtn');if(b){b.hidden=!alternate;b.textContent=MODE_NAMES[other]+'のつづき';b.onclick=()=>continueMode(other);}const label=$('titleSaveInfo');if(label)label.textContent=current?MODE_NAMES[active]+' · '+HERO_NAMES[current.hero]+' · Lv.'+current.lv+' · '+formatPlayTime(current.playSeconds):'「はじめから」でモードと主人公を選べます。';if(modal==='newGame')renderModal();}
function setupCampaignTitle(){try{chooseSlot(localStorage.getItem(LAST_SLOT)==='adventure'?'adventure':'debug');}catch{chooseSlot('debug');}refreshCampaignTitle();$('startBtn').onclick=()=>continueMode(SAVE===SAVE_SLOTS.adventure?'adventure':'debug');$('continueBtn').onclick=()=>start(true);$('newGameBtn').onclick=openNewGame;}
function formatPlayTime(seconds){const m=Math.floor((seconds||0)/60);return Math.floor(m/60)+'時間'+m%60+'分';}
const campaignEnemy=enemy;
enemy=function(type,x,y){const count=enemies.length;campaignEnemy(type,x,y);if(enemies.length<=count)return;const e=enemies.at(-1),factor=enemyFactor();e.hp=Math.round(e.hp*factor);e.maxHp=Math.round(e.maxHp*factor);e.atk=Math.round(e.atk*factor);};
const campaignSprite=sprite;
sprite=function(sheet,index,cols,rows,x,y,w,h,alpha=1){if(state?.hero==='heroine'&&['hero','combat'].includes(sheet)){let i=index+(sheet==='combat'?16:0);if(sheet==='combat'&&index===5){ctx.save();ctx.translate(x*2,0);ctx.scale(-1,1);campaignSprite('heroine',25,4,8,x,y,w,h,alpha);ctx.restore();return;}return campaignSprite('heroine',i,4,8,x,y,w,h,alpha);}return campaignSprite(sheet,index,cols,rows,x,y,w,h,alpha);};
const JOURNEY_GOALS=[
 {id:'kills5',name:'最初の一歩',count:5,potions:2,tickets:0},{id:'kills20',name:'街の外に慣れる',count:20,potions:3,tickets:3},{id:'kills50',name:'武器を探す旅',count:50,potions:4,tickets:5},{id:'kills100',name:'百戦の旅人',count:100,potions:4,tickets:8},{id:'kills200',name:'迷宮の常連',count:200,potions:5,tickets:10},{id:'kills400',name:'熟練の探索者',count:400,potions:8,tickets:15}
];
function totalKills(){return Object.values(state.book).reduce((n,v)=>n+v,0);}
function journeyHTML(){return '<p class="lead">'+MODE_NAMES[state.gameMode]+' · '+HERO_NAMES[state.hero]+'<br>実際に探索した時間 '+formatPlayTime(state.playSeconds)+' / 討伐 '+totalKills()+'体</p><div class="notice">冒険：必要EXP50倍・金貨の支出30倍・敵HPと攻撃力3倍。売値や敵の報酬は据え置き。無料の帰還・休息、素材の調合、ガチャ、塔の紋章交換を活用しよう。<br>長期目標：地域ボス4体、塔30階、専用装備11種。4時間は目安で、待ち時間で進行を制限しません。</div>'+(isAdventure()?JOURNEY_GOALS.map(g=>'<div class="list-row"><div><b>'+g.name+'</b><p>討伐 '+Math.min(totalKills(),g.count)+' / '+g.count+'体<br>回復薬'+g.potions+'個'+(g.tickets?'・ガチャ券'+g.tickets+'枚':'')+'</p></div>'+btn(state.journeyClaimed.includes(g.id)?'受取済み':'補給を受け取る','journeyClaim:'+g.id,state.journeyClaimed.includes(g.id)||totalKills()<g.count)+'</div>').join(''):'<p>デバッグは従来の育成速度です。長期の冒険はタイトルの「はじめから」で選べます。</p>');}
const campaignUpdate=update;
update=function(dt){state.playSeconds=(state.playSeconds||0)+dt;campaignUpdate(dt);if(clock-lastModeAutoSave>=30){save();lastModeAutoSave=clock;}};
const campaignHud=hud;
hud=function(){campaignHud();if($('heroName'))$('heroName').textContent=state.hero==='heroine'?'白銀の勇者':'旅人';if($('modeBadge'))$('modeBadge').textContent=MODE_NAMES[state.gameMode]+' MODE';};
const campaignRender=renderModal;
renderModal=function(){campaignRender();if(modal==='newGame'){$('modalEyebrow').textContent='A NEW JOURNEY';$('modalTitle').textContent='はじめから';$('modalBody').innerHTML=newGameHTML();}if(modal==='journey'){$('modalEyebrow').textContent='ADVENTURE RECORD';$('modalTitle').textContent='冒険手帳';$('modalBody').innerHTML=journeyHTML();}
 if(modal==='journal'){$('modalBody').innerHTML=$('modalBody').innerHTML.replace('冒険（標準）','被ダメージ補正あり').replaceAll('冒険：被ダメージ','補正あり：被ダメージ');$('modalBody').innerHTML='<div class="notice">'+MODE_NAMES[state.gameMode]+'モード / '+HERO_NAMES[state.hero]+' / '+formatPlayTime(state.playSeconds)+'<br>次のレベルまで '+(needXP()-state.xp)+' EXP</div>'+$('modalBody').innerHTML+'<hr>'+btn('長期の冒険手帳','open:journey',!!floor);}
 if(['shop','forge','teacher','trader'].includes(modal)&&isAdventure())$('modalBody').innerHTML='<p class="notice">旅に必要な装備や薬をそろえよう。</p>'+$('modalBody').innerHTML;
 if(modal==='backup')$('modalBody').innerHTML+='<hr>'+btn('はじめから開始前の記録を復元','restoreBeforeNew',!safeStorageGet(SAVE+'-before-new-game'));
 if(modal==='restorePreview'&&restoreCandidate)$('modalBody').innerHTML='<div class="notice">読み込み先：'+MODE_NAMES[restoreCandidate.gameMode]+'モード / '+HERO_NAMES[restoreCandidate.hero]+'。もう一方のモードの記録は変更しません。</div>'+$('modalBody').innerHTML;
};
const campaignRestore=commitRestore;
commitRestore=function(){if(!restoreCandidate)return false;const before=SAVE;chooseSlot(restoreCandidate.gameMode);const ok=campaignRestore();if(!ok)SAVE=before;else{rememberSlot();refreshCampaignTitle();}return ok;};
const campaignAction=action;
action=function(raw){const [a,id]=raw.split(':');if(a==='newMode'){if(modal==='newGame'&&Object.hasOwn(MODE_NAMES,id)){newGameDraft.mode=id;renderModal();}return;}if(a==='newHero'){if(modal==='newGame'&&Object.hasOwn(HERO_NAMES,id)){newGameDraft.hero=id;renderModal();}return;}if(a==='confirmNewGame'){if(modal==='newGame')beginNewGame();return;}if(a==='cancelNewGame'){closeModal();return;}
 if(a==='journeyClaim'){if(!floor&&isAdventure()){const goal=JOURNEY_GOALS.find(g=>g.id===id);if(goal&&totalKills()>=goal.count&&!state.journeyClaimed.includes(id)){state.journeyClaimed.push(id);state.potions+=goal.potions;state.tickets+=goal.tickets;save();renderModal();hud();}}return;}
 if(a==='restoreBeforeNew'){if(floor)return;try{restoreCandidate=normalizeSave(JSON.parse(safeStorageGet(SAVE+'-before-new-game')));openModal('restorePreview');}catch{toast('開始前の記録を読めませんでした。');}return;}
 if(a==='reset'){const mode=state.gameMode,hero=state.hero;try{localStorage.setItem(SAVE+'-before-new-game',JSON.stringify(state));}catch{}state={...fresh(),gameMode:mode,hero};modal=null;$('modalBackdrop').hidden=true;enterTown(true);save();hud();return;}
 const result=campaignAction(raw);if(a==='title')refreshCampaignTitle();return result;
};

// CAMPAIGN END
// DISCOVERY START
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
hitPlayer=function(amount){if(player.inv>0||player.dodge>0||player.hp<=0)return;const veteran=state.difficulty==='veteran';let dmg=Math.max(1,Math.min(Math.round(stats().hp*(veteran?.32:.22)),Math.round(amount*(veteran?1:.82))-stats().def));if(player.shield>0){const absorbed=Math.min(player.shield,dmg);player.shield-=absorbed;dmg-=absorbed;}player.hp=Math.max(0,player.hp-dmg);player.inv=.85;if(dmg)tone(90,.12,'sawtooth',.025);if(player.hp<=0){state.deaths++;const lost=Math.floor(state.gold*(veteran?.15:.08));state.gold-=lost;save();openModal('down',{lost});}};
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

// DISCOVERY END
function frame(t){const dt=Math.min((t-last)/1000,.04);last=t;if(running&&loaded&&!modal&&!document.hidden)update(dt);if(running&&loaded)draw();requestAnimationFrame(frame)}
document.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();if(k==='tab'&&modal){const els=[...$('modal').querySelectorAll('button:not([disabled]):not([hidden]),summary')];if(!els.length)return;if(e.shiftKey&&document.activeElement===els[0]){e.preventDefault();els.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===els.at(-1)){e.preventDefault();els[0].focus();}return;}if(k==='escape'&&modal){closeModal();return;}if(!running||!loaded)return;if(e.repeat)return;if(k==='escape'){if(modal)closeModal();else openModal('journal');return;}if(modal){if(k===' '&&modal==='commands')closeModal();return;}keys.add(k);if(k==='shift')dodge();if(k==='e')interact();if(k===' ')openModal('commands');if(k==='i')openModal('equipment');if(k==='c'&&floor)stealth=!stealth;});
document.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{keys.clear();joystick.x=joystick.y=0;if(running&&floor&&!modal)openModal('journal');});document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();joystick.x=joystick.y=0;if(running&&floor&&!modal)openModal('journal');}});
document.querySelectorAll('[data-town]').forEach(b=>b.onclick=()=>{if(running&&!floor){currentTab='weapons';openModal(b.dataset.town)}});
document.querySelectorAll('[data-menu]').forEach(b=>b.onclick=()=>running&&openModal(b.dataset.menu));$('modalBody').onclick=e=>{const b=e.target.closest('[data-action]');if(b&&!b.disabled)action(b.dataset.action)};$('closeModal').onclick=closeModal;$('modalBackdrop').onclick=e=>{if(e.target===$('modalBackdrop'))closeModal()};$('menuBtn').onclick=()=>running&&openModal('journal');$('helpBtn').onclick=()=>{if(!running&&loaded){state??=fresh();enterTown(true);running=true;$('titleScreen').hidden=true;}if(loaded)openModal('help')};$('returnBtn').onclick=()=>floor&&openModal('return');$('stealthBtn').onclick=()=>{if(floor&&!modal)stealth=!stealth;else if(!floor)toast('忍び歩きは迷宮で使えます。')};$('soundBtn').onclick=()=>{sound=!sound;$('soundBtn').textContent='音 '+(sound?'ON':'OFF');tone(440,.15)};
$('huntContinue').onclick=()=>{if(tower?.cleared)openModal('towerClear');else if(hunt?.cleared)openModal('huntClear')};
$('touchDodge').onpointerdown=e=>{e.preventDefault();dodge()};$('touchInteract').onclick=interact;
let stickId=null;const stick=$('joystick');function stickMove(e){if(e.pointerId!==stickId)return;const r=stick.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,l=Math.hypot(dx,dy),rad=r.width*.32;joystick.x=dx/Math.max(rad,l);joystick.y=dy/Math.max(rad,l);stick.firstElementChild.style.transform=`translate(${joystick.x*rad}px,${joystick.y*rad}px)`;}
stick.onpointerdown=e=>{e.preventDefault();stickId=e.pointerId;stick.setPointerCapture(e.pointerId);stickMove(e)};stick.onpointermove=stickMove;function release(){stickId=null;joystick.x=joystick.y=0;stick.firstElementChild.style.transform='';}stick.onpointerup=release;stick.onpointercancel=release;stick.onlostpointercapture=release;
function start(continued){if(!loaded)return;if(continued)state=readSave()||fresh();else if(readSave()){state=readSave();}else state=fresh();enterTown(true);running=true;$('titleScreen').hidden=true;save();announce('灯守りの街');toast('街の施設から準備し、迷宮か狩場へ。操作は右上の「遊び方」で確認できます。');}
setupCampaignTitle();
Promise.all(['hero','combat','enemies','npcs','terrain','props','items','effects','title','newenemies','weapons-extra','heroine'].map(name=>new Promise((resolve,reject)=>{const img=new Image();img.onload=resolve;img.onerror=()=>reject(name);img.src='assets/'+name+'.webp';art[name]=img}))).then(()=>{loaded=true;$('loading').hidden=true;resize();refreshCampaignTitle();}).catch(name=>{$('loading').innerHTML='画像を読み込めませんでした。<span>ページを再読み込みしてください：'+name+'</span>';$('titleScreen').hidden=true;});
requestAnimationFrame(frame);
// Read-only diagnostic snapshot for headless logic tests.
window.emberSnapshot=()=>({loaded,running,modal,floor,hunt:hunt&&{...hunt},player:player&&{x:Math.round(player.x),y:Math.round(player.y),hp:Math.ceil(player.hp),mp:Math.floor(player.mp)},state:state&&JSON.parse(JSON.stringify(state)),enemies:enemies.filter(e=>e.hp>0).length,enemyDetails:enemies.filter(e=>e.hp>0).map(e=>({type:e.type,x:e.x,y:e.y,hp:e.hp})),objects:objects.map(o=>({type:o.type,x:o.x,y:o.y,opened:o.opened})),stats:state&&stats()});
})();
