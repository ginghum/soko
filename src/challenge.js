// Faster enemies, uninterrupted hunts, keyboard commands, and distinct weapon art.
let commandCursor=0;
function handleGameKey(e){const k=e.key.toLowerCase(),tag=(e.target?.tagName||document.activeElement?.tagName||'').toLowerCase(),typing=['input','textarea','select'].includes(tag)||e.target?.isContentEditable;
 if(typing){if(k==='escape'){e.preventDefault();closeModal();}return;}
 if(running&&loaded&&(!modal||modal==='commands')&&['arrowup','arrowdown','arrowleft','arrowright',' ','enter'].includes(k))e.preventDefault();
 if(k==='tab'&&modal){const els=[...$('modal').querySelectorAll('button:not([disabled]):not([hidden]),input,textarea,select,summary')];if(els.length){if(e.shiftKey&&document.activeElement===els[0]){e.preventDefault();els.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===els.at(-1)){e.preventDefault();els[0].focus();}}return;}
 if(k==='escape'){if(modal)closeModal();else if(running&&loaded)openModal('journal');return;}
 if(!running||!loaded)return;
 if(modal){if(modal==='commands'){const choices=commandChoices();if(!choices.length)return;if(['arrowdown','arrowright','s','d','arrowup','arrowleft','w','a'].includes(k)){commandCursor=(commandCursor+(['arrowup','arrowleft','w','a'].includes(k)?-1:1)+choices.length)%choices.length;focusCommand();}else if(k==='enter'&&!e.repeat)action(choices[commandCursor].action);else if(/^[0-9]$/.test(k)&&!e.repeat){const i=k==='0'?9:Number(k)-1;if(state.spells[i])action('cast:'+state.spells[i]);}}return;}
 if(e.repeat)return;keys.add(k);if(k===' '||k==='shift')dodge();else if(k==='enter'){commandCursor=0;openModal('commands');focusCommand();}else if(k==='e')interact();else if(k==='i')openModal('equipment');else if(k==='c'&&floor)stealth=!stealth;
}
function commandChoices(){return [...state.spells.map(id=>({action:'cast:'+id})),{action:'potion:hp'},{action:'potion:mp'}];}
function focusCommand(){const list=commandChoices();commandCursor=clamp(commandCursor,0,list.length-1);for(const [i,c]of list.entries()){const el=$('modalBody').querySelector('button[data-action="'+c.action+'"]');if(el){el.classList.toggle('keyboard-choice',i===commandCursor);if(i===commandCursor){el.focus();el.scrollIntoView?.({block:'nearest'});}}}}
const challengeRender=renderModal;
renderModal=function(){challengeRender();if(modal==='commands'){$('modalBody').innerHTML='<p class="notice">↑↓ / WASDで選択 · Enterで発動 · Escで閉じる<br>1〜9・0で対応する魔法を直接発動</p>'+$('modalBody').innerHTML;focusCommand();}
 if(modal==='journal'){$('modalBody').innerHTML=$('modalBody').innerHTML.replace(/<p>追加地域：[\s\S]*?<\/p>/g,'');}
};
const challengeJourney=journeyHTML;
journeyHTML=function(){return challengeJourney().replace(/<p>デバッグは従来の育成速度です。[\s\S]*?<\/p>/g,'');};
// These multipliers do not change HP. Apply after each mode's final spawn scaling.
function strengthenEnemy(e){if(!e||e.type===20||e.challengeReady)return;const boss=e.type===3||e.type>=14;e.speed=Math.max(boss?85:60,e.speed*(boss?1.65:1.45));e.ct*=boss?.58:.68;e.range*=boss?1.25:1.12;e.atk=Math.round(e.atk*(boss?1.5:1.35));e.cool=Math.min(e.cool,e.ct*.8);e.challengeReady=true;}
const challengeDungeon=enterDungeon;
enterDungeon=function(n){challengeDungeon(n);for(const e of enemies)strengthenEnemy(e);};
const challengeRegion=enterRegion;
enterRegion=function(...args){challengeRegion(...args);for(const e of enemies)strengthenEnemy(e);};
const challengeTower=enterTower;
enterTower=function(...args){challengeTower(...args);for(const e of enemies)strengthenEnemy(e);};
const challengeBoss=enterBoss;
enterBoss=function(...args){challengeBoss(...args);for(const e of enemies)strengthenEnemy(e);};
const challengeWave=spawnHuntWave;
spawnHuntWave=function(){const pos={x:player.x,y:player.y};challengeWave();if(hunt.wave>1&&walkable(pos.x,pos.y,12)){player.x=pos.x;player.y=pos.y;}for(const e of enemies)strengthenEnemy(e);hunt.nextWaveIn=2;};
const challengeUpdate=update;
update=function(dt){challengeUpdate(dt);if(!hunt||!hunt.cleared||player.hp<=0||modal)return;if(enemies.some(e=>e.hp>0)){hunt.nextWaveIn=2;$('huntContinue').textContent='銀灯スライムを追跡中';return;}hunt.nextWaveIn=Math.max(0,(hunt.nextWaveIn??2)-dt);$('huntContinue').textContent='次の群れまで '+Math.ceil(hunt.nextWaveIn)+'秒';if(hunt.nextWaveIn<=0){hunt.wave++;spawnHuntWave();}};
const challengeWindup=beginWindup;
beginWindup=function(e,angle){challengeWindup(e,angle);e.wind=e.windMax=(e.bossId||e.type===3||e.towerElite)?.85:([5,6,7,9,10,11,13].includes(e.type)?.8:.72);};
const challengeRadius=attackRadius;
attackRadius=function(e){return Math.round(challengeRadius(e)*(e.type===3||e.type>=14?1.4:1.15));};
resolveEnemyAttack=function(e){if(e.type===20)return;e.cool=e.ct;const boss=e.type===3||e.type>=14,immune=()=>equippedAccessories().some(a=>a.poisonImmune);
 const impact=(point,r=attackRadius(e),poison=false)=>{if(dist(point,player)<r&&player.inv<=0&&player.dodge<=0){hitPlayer(e.atk);if(poison&&!immune()){player.poison=5;player.poisonTick=1;}}fx(point.x,point.y,[6,16,19].includes(e.type)?'fire':e.type===15||e.type===18?'ice':'slash',r/55);};
 if(e.aims){for(const p of e.aims)impact(p,attackRadius(e),e.type===14);return;}
 if([5,10,13,18].includes(e.type)){bolts(e,e.type===5?1:e.type===13?5:e.type===18&&e.secondForm?5:3,e.type===5?320:275);return;}
 if(e.type===7||e.type===9){const a=Math.atan2(e.aim.y-e.y,e.aim.x-e.x);for(let n=0;n<230;n+=7){move(e,Math.cos(a)*7,Math.sin(a)*7,11);if(dist(e,player)<38)hitPlayer(e.atk);}fx(e.x,e.y,'slash',1.3);return;}
 const radial=(e.type===3&&e.phase%3===0)||([14,15,16,19].includes(e.type)&&e.phase%2===0)||(e.type===17&&e.secondForm&&e.phase%2===0);
 if(radial){const count=e.mutated?16:e.secondForm?14:12;for(let i=0;i<count;i++){const a=i*TAU/count;attacks.push({x:e.x,y:e.y,vx:Math.cos(a)*245,vy:Math.sin(a)*245,life:4.2,damage:e.atk,color:'#deb380'});}fx(e.x,e.y,'fire',2.4);return;}
 impact(e.aim,attackRadius(e),[4,8,11,14].includes(e.type));
};
drawWindup=function(e){const radius=attackRadius(e);ctx.save();ctx.strokeStyle='#ffc39c';ctx.fillStyle='#d3604b30';ctx.lineWidth=2;
 const circle=(p)=>{ctx.beginPath();ctx.arc(p.x,p.y,radius,0,TAU);ctx.fill();ctx.stroke();ctx.beginPath();ctx.arc(p.x,p.y,radius*(1-e.wind/e.windMax),0,TAU);ctx.stroke();};
 if(e.aims)e.aims.forEach(circle);
 else if([5,7,9,10,13,18].includes(e.type)){const a=Math.atan2(e.aim.y-e.y,e.aim.x-e.x),count=e.type===5||e.type===7||e.type===9?1:e.type===13?5:e.type===18&&e.secondForm?5:3,length=e.type===7||e.type===9?230:360;for(let i=0;i<count;i++){const b=a+(i-(count-1)/2)*.32;ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.x+Math.cos(b)*length,e.y+Math.sin(b)*length);ctx.stroke();}if(e.type===7||e.type===9){ctx.lineWidth=76;ctx.strokeStyle='#db765044';ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.x+Math.cos(a)*230,e.y+Math.sin(a)*230);ctx.stroke();}}
 else if((e.type===3&&e.phase%3===0)||([14,15,16,19].includes(e.type)&&e.phase%2===0)||(e.type===17&&e.secondForm&&e.phase%2===0)){const count=e.mutated?16:e.secondForm?14:12;for(let i=0;i<count;i++){const a=i*TAU/count;ctx.beginPath();ctx.moveTo(e.x+Math.cos(a)*24,e.y+Math.sin(a)*24);ctx.lineTo(e.x+Math.cos(a)*220,e.y+Math.sin(a)*220);ctx.stroke();}}else circle(e.aim);ctx.restore();};
// Every weapon (including the base of randomized loot) receives its own icon.
WEAPONS.forEach((w,i)=>{w.icon=100+i;});
function weaponArt(index){const n=index-100;return {sheet:n<16?'weapons-a':'weapons-b',cell:n%16};}
const challengeItemIcon=itemIcon;
itemIcon=function(i){if(i<100)return challengeItemIcon(i);const a=weaponArt(i);return '<span aria-hidden="true" class="item-icon weapon-art" style="background-image:url(assets/'+a.sheet+'.webp);background-size:400% 400%;background-position:'+a.cell%4*100/3+'% '+Math.floor(a.cell/4)*100/3+'%"></span>';};
const challengeHud=hud;
hud=function(){challengeHud();const a=weaponArt(weapon().icon),el=$('weaponIcon');el.style.backgroundImage='url(assets/'+a.sheet+'.webp)';el.style.backgroundSize='400% 400%';el.style.backgroundPosition=a.cell%4*100/3+'% '+Math.floor(a.cell/4)*100/3+'%';};
const challengePlayer=drawPlayer;
drawPlayer=function(){challengePlayer();if(player.dodge>0)return;const w=weapon(),a=weaponArt(w.icon),active=player.attack>0,family=w.family||w.id,size=['spear','staff','longsword'].includes(family)?48:38;ctx.save();ctx.translate(player.x,player.y-18);const angles=[.65,2.2,-1.2,-2.5];ctx.rotate((angles[player.dir]||0)+(active?Math.sin(player.attack/.3*Math.PI)*1.3:0));sprite(a.sheet,a.cell,4,4,14,-2,size,size,stealth?.6:1);ctx.restore();};
