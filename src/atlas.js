// Persistent exploration and a ticket-focused hunting ground.
ENEMY_NAMES.push('灯籤ミミック');
let mapWorld=null,mapOwner=null,mapKey=null,mapTravelDepth=0,mapArena=null,mapSavedAt=0,ticketStarting=false;
function validMapKey(key){if(/^hunt:(normal|ticket):(1|4|8|12)$/.test(key))return true;const a=key.match(/^arena:([A-Za-z]+):(0|1)$/);if(a)return !!BOSSES[a[1]];const m=key.match(/^floor:(ruins|sewer|frost|shrine|tower):(\d+)$/);return !!m&&Number(m[2])>=1&&Number(m[2])<=REGIONS[m[1]].floors;}
const atlasFresh=fresh;
fresh=function(){return {...atlasFresh(),mapMemory:{},ticketBest:0,ticketKills:0};};
const atlasNormalize=normalizeSave;
normalizeSave=function(raw){const s=atlasNormalize(raw);s.mapMemory={};if(raw.mapMemory&&typeof raw.mapMemory==='object')for(const [key,bits]of Object.entries(raw.mapMemory).slice(0,96)){if(validMapKey(key)&&typeof bits==='string'&&bits.length===W*H&&/^[01]+$/.test(bits))s.mapMemory[key]=bits;}s.ticketBest=Number.isFinite(raw.ticketBest)?clamp(Math.floor(raw.ticketBest),0,1e6):0;s.ticketKills=Number.isFinite(raw.ticketKills)?clamp(Math.floor(raw.ticketKills),0,1e9):0;return s;};
function currentMapKey(){if(!floor)return null;if(mapArena)return 'arena:'+mapArena;if(hunt)return 'hunt:'+(hunt.ticket?'ticket':'normal')+':'+hunt.tier;return 'floor:'+region+':'+floor;}
function rememberMap(){if(!state||state!==mapOwner||world!==mapWorld||!mapKey)return false;const bits=world.seen.flat().map(v=>v?'1':'0').join(''),old=state.mapMemory[mapKey];state.mapMemory[mapKey]=bits;return bits!==old;}
function restoreMap(){mapWorld=world;mapOwner=state;mapKey=currentMapKey();const bits=mapKey&&state.mapMemory[mapKey];if(bits)for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(bits[y*W+x]==='1')world.seen[y][x]=true;}
function mapTravel(fn,arena=null){return function(...args){const outer=mapTravelDepth===0,before=world;if(outer){rememberMap();mapArena=arena?args[0]+':'+(args[1]?1:0):null;}mapTravelDepth++;try{return fn(...args);}finally{mapTravelDepth--;if(outer&&world!==before)restoreMap();}};}
enterTown=mapTravel(enterTown);enterDungeon=mapTravel(enterDungeon);enterRegion=mapTravel(enterRegion);enterHunt=mapTravel(enterHunt);enterTower=mapTravel(enterTower);enterBoss=mapTravel(enterBoss,true);
const atlasSave=save;
save=function(){rememberMap();return atlasSave();};
const atlasUpdate=update;
update=function(dt){atlasUpdate(dt);if(clock-mapSavedAt>=3){mapSavedAt=clock;if(rememberMap())save();}};
window.addEventListener('pagehide',()=>{if(state&&running)save();});
const atlasEnemy=enemy;
enemy=function(type,x,y){if(type!==21)return atlasEnemy(type,x,y);const factor=enemyFactor(),depth=hunt?1+(hunt.wave-1)*.08:1;enemies.push({id:++uid,type:21,x:x*TILE+24,y:y*TILE+24,hp:Math.round(75*factor*depth),maxHp:Math.round(75*factor*depth),atk:Math.round(22*factor*depth),speed:100,range:72,ct:1.4,cool:1.2,wind:0,alert:999,dir:0,slow:0,hurt:0,phase:0,poison:0,poisonTick:1,stun:0,seed:Math.random()*10,xp:0,gold:4,ticketEnemy:true});};
const atlasWave=spawnHuntWave;
spawnHuntWave=function(){const ticket=ticketStarting||hunt?.ticket;atlasWave();if(!ticket)return;hunt.ticket=true;enemies=[];attacks=[];const count=4+Math.min(4,Math.floor((hunt.wave-1)/3)),spots=[[10,7],[24,7],[10,19],[24,19],[17,6],[9,13],[25,13],[17,20]];for(let i=0;i<count;i++)enemy(21,...spots[i]);if(hunt.wave%5===0){const e=enemies.at(-1);e.ticketElite=true;e.hp=e.maxHp=e.maxHp*2;e.atk=Math.round(e.atk*1.2);}updateLocation();announce('灯籤の狩場 第'+hunt.wave+'群');toast('灯籤の狩場 第'+hunt.wave+'群。ミミックからガチャ券を集めよう。');};
const enterTicketHunt=mapTravel(function(tier=1){if(![1,4,8,12].includes(tier)||floor)return;ticketStarting=true;try{enterHunt(tier);}finally{ticketStarting=false;}});
const atlasHurt=hurtEnemy;
hurtEnemy=function(e,amount,back=false){if(e?.type!==21)return atlasHurt(e,amount,back);if(e.hp<=0)return;e.hp-=Math.max(1,Math.round(amount));e.hurt=.18;e.alert=5;if(e.hp>0)return;e.wind=0;const tickets=e.ticketElite?3:1;state.tickets+=tickets;state.ticketKills++;state.book[21]=(state.book[21]||0)+1;state.gold+=e.gold;if(hunt){state.huntKills++;state.counts.hunters++;}if(Math.random()<EQUIPMENT_DROP_RATE)rollLoot(false);save();toast('灯籤ミミック：ガチャ券'+tickets+'枚を入手！');};
const atlasRadius=attackRadius;
attackRadius=function(e){return e.type===21?60:atlasRadius(e);};
const atlasDrawEnemy=drawEnemy;
drawEnemy=function(e){if(e.type!==21)return atlasDrawEnemy(e);const frame=e.hurt>0?3:e.wind>0?1:e.cool>e.ct-.25?2:0,size=e.ticketElite?98:78;shadow(e.x,e.y,e.ticketElite?27:19);sprite('ticket-mimic',face(Math.cos(e.dir),Math.sin(e.dir))*4+frame,4,4,e.x,e.y+8,size,size,e.hurt?.65:1);if(e.hp<e.maxHp){ctx.fillStyle='#14252b';ctx.fillRect(e.x-23,e.y-64,46,4);ctx.fillStyle='#e4c16f';ctx.fillRect(e.x-23,e.y-64,46*clamp(e.hp/e.maxHp,0,1),4);}};
const atlasLocation=updateLocation;
updateLocation=function(){atlasLocation();if(hunt?.ticket){$('zoneTag').textContent='TICKET HUNT';$('locationName').textContent='灯籤の狩場';}};
const atlasClearHunt=clearHuntWave;
clearHuntWave=function(){const previousBest=state.huntBest;atlasClearHunt();if(hunt?.ticket){state.huntBest=previousBest;state.ticketBest=Math.max(state.ticketBest,hunt.wave);save();}};
const atlasHuntGate=huntGateHTML;
huntGateHTML=function(){return '<div class="card ticket-hunt-card"><span class="ticket-portrait" role="img" aria-label="灯籤ミミック"></span><h3>灯籤の狩場</h3><p>灯籤ミミックを倒すとガチャ券1枚を確定入手。5群ごとの大きなミミックは3枚。全滅すると次の群れが自動で出現します。<br>最高 '+state.ticketBest+'群 / 討伐 '+state.ticketKills+'体</p>'+btn('ガチャ券を集めに行く','ticketHunt:1',false,'primary')+'</div>'+atlasHuntGate();};
const atlasRender=renderModal;
renderModal=function(){atlasRender();if(modal==='codex')$('modalBody').innerHTML+='<div class="list-row"><span class="ticket-portrait" role="img" aria-label="灯籤ミミック"></span><div><b>灯籤ミミック</b><p>灯籤の狩場に生息。ガチャ券を確定で落とす。5群ごとに大きな個体が出現する。</p></div></div>';};
const atlasAction=action;
action=function(raw){if(raw.startsWith('ticketHunt:'))return enterTicketHunt(Number(raw.split(':')[1]));return atlasAction(raw);};
const atlasHud=hud;
hud=function(){atlasHud();if(hunt?.ticket)$('questPin').innerHTML='<small>TICKET HUNT</small>ガチャ券 '+state.tickets+'枚 / 討伐 '+state.ticketKills+'体<br>券狩場の最高記録 '+state.ticketBest+'群';};

// Keep inventory actions at the same reading position, even when the clicked
// button becomes disabled (equipped) or its row disappears (sold/dismantled).
const inventoryAction=action;
action=function(raw){
 const keep=modal==='equipment'&&!['open','tab','viewLoot'].includes(raw.split(':')[0]);
 if(!keep)return inventoryAction(raw);
 const body=$('modalBody'),top=body.scrollTop,left=body.scrollLeft,tab=currentTab;
 const oldChoices=menuElements(),active=document.activeElement,index=oldChoices.indexOf(active),activeAction=active?.dataset?.action;
 try{return inventoryAction(raw);}finally{
  if(modal==='equipment'&&currentTab===tab){
   const choices=menuElements(),next=choices.find(e=>e.dataset?.action===activeAction)||choices[Math.min(Math.max(index,0),choices.length-1)];
   if(index>=0&&next){choices.forEach(e=>e.classList.remove('keyboard-choice'));next.classList.add('keyboard-choice');menuCursor=choices.indexOf(next);next.focus({preventScroll:true});}
   body.scrollTop=top;body.scrollLeft=left;
  }
 }
};
