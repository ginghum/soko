// Midgame active masteries and complete keyboard navigation.
const ULTIMATES=[
 {id:'dawn',name:'暁光断',branch:'剣技',mp:18,cooldown:35,desc:'周囲240を攻撃力6倍で一閃。予兆を中断し、短く怯ませる。発動時1秒無敵。'},
 {id:'astral',name:'星灯崩陣',branch:'魔導',mp:36,cooldown:45,desc:'周囲340に星灯が3回炸裂。1回ごとに攻撃力2倍＋70の魔法ダメージ。周囲の敵弾も消す。'},
 {id:'eclipse',name:'影縫い・月蝕',branch:'影技',mp:22,cooldown:40,desc:'7秒間、武器ダメージ1.65倍。周囲280の敵を鈍足にし予兆を中断。発動時2秒無敵。'}
];
function ultimate(id){return ULTIMATES.find(u=>u.id===id);}
function branchPoints(branch,s=state){return SKILLS.filter(sk=>sk.branch===branch).reduce((n,sk)=>n+(s.skills[sk.id]||0),0);}
function masteryGate(s=state){return s.gameMode!=='adventure'||s.lv>=8||(s.bossKills.hydra||0)>0;}
const masteryFresh=fresh;
fresh=function(){return {...masteryFresh(),ultimates:[],ultimateCooldowns:{}};};
const masterySpent=skillSpent;
skillSpent=function(s=state){return masterySpent(s)+(s.ultimates?.length||0)*2;};
const masteryNormalize=normalizeSave;
normalizeSave=function(raw){const s=masteryNormalize(raw);s.ultimates=[];s.ultimateCooldowns={};let points=Math.max(0,s.lv-1-masterySpent(s));for(const u of ULTIMATES){if(Array.isArray(raw.ultimates)&&raw.ultimates.includes(u.id)&&masteryGate(s)&&branchPoints(u.branch,s)>=4&&points>=2){s.ultimates.push(u.id);points-=2;}const n=raw.ultimateCooldowns?.[u.id];if(Number.isFinite(n))s.ultimateCooldowns[u.id]=clamp(n,0,u.cooldown);}return s;};
function ultimateRows(learning=false){return ULTIMATES.map(u=>{const known=state.ultimates.includes(u.id),left=Math.ceil(state.ultimateCooldowns[u.id]||0);return '<div class="card ultimate-card"><span class="tag">奥義 · '+u.branch+' · MP '+u.mp+' · 再使用 '+u.cooldown+'秒</span><h3>'+u.name+'</h3><p>'+u.desc+'</p>'+(learning?'<p>必要：'+u.branch+'に4pt / 習得2pt<br>冒険：Lv.8到達 または 水路の三頭蛇を討伐</p>'+btn(known?'習得済み':'奥義を習得','learnUltimate:'+u.id,known||!masteryGate()||branchPoints(u.branch)<4||skillPoints()<2):known?btn(left?'あと'+left+'秒':'奥義を放つ','ultimate:'+u.id,!floor||player.hp<=0||left>0||player.mp<u.mp,'primary'):'<p class="muted">街のスキルツリーで習得できます。</p>')+'</div>';}).join('');}
function useUltimate(id){const u=ultimate(id);if(!u||!floor||!state.ultimates.includes(id)||player.hp<=0||modal==='down')return false;if((state.ultimateCooldowns[id]||0)>0){toast('奥義はまだ力を蓄えています。');return false;}if(player.mp<u.mp){toast('MPが足りません。');return false;}
 player.mp-=u.mp;state.ultimateCooldowns[id]=u.cooldown;closeModal();
 const targets=r=>enemies.filter(e=>e.hp>0&&dist(e,player)<=r&&los(player,e));
 if(id==='dawn'){player.inv=Math.max(player.inv,1);for(const e of targets(240)){hurtEnemy(e,stats().atk*6);if(e.hp>0&&e.type!==20){e.wind=0;e.stun=e.bossId?.5:1.3;}}fx(player.x,player.y,'slash',3.5);fx(player.x,player.y,'fire',2.8);}
 if(id==='astral'){player.astralPulses=[0,.4,.8];player.astralPower=(stats().atk*2+70)*(weapon().magic||1)*spellMultiplier('fire')*(traits().has('arcane')?1.2:1);attacks=attacks.filter(a=>a.player||dist(a,player)>340);fx(player.x,player.y,'ice',4.8);}
 if(id==='eclipse'){player.eclipseTime=7;player.inv=Math.max(player.inv,2);for(const e of targets(280)){if(e.type===20)continue;e.slow=6;e.wind=0;e.cool=Math.max(e.cool,.8);}fx(player.x,player.y,'ice',3.6);fx(player.x,player.y,'slash',2.8);}
 save();hud();toast('奥義「'+u.name+'」！');tone(220,.3,'triangle');return true;
}
const masteryHitWeapon=hitWeapon;
hitWeapon=function(e,damage,back=false){return masteryHitWeapon(e,damage*(player.eclipseTime>0?1.65:1),back);};
const masteryUpdate=update;
update=function(dt){for(const u of ULTIMATES)state.ultimateCooldowns[u.id]=Math.max(0,(state.ultimateCooldowns[u.id]||0)-dt);player.eclipseTime=Math.max(0,(player.eclipseTime||0)-dt);masteryUpdate(dt);if(!floor||player.hp<=0||modal==='down'){player.astralPulses=[];return;}const pulses=player.astralPulses||[];for(let i=0;i<pulses.length;i++){pulses[i]-=dt;if(pulses[i]<=0){const before=castingMagic;castingMagic=true;try{for(const e of enemies.filter(e=>e.hp>0&&dist(e,player)<=340&&los(player,e)))hurtEnemy(e,player.astralPower);}finally{castingMagic=before;}fx(player.x,player.y,'ice',4.8);pulses.splice(i--,1);}}};
const masteryAction=action;
action=function(raw){const [a,id]=raw.split(':');if(a==='learnUltimate'){const u=ultimate(id);if(floor||!u||state.ultimates.includes(id)||!masteryGate()||branchPoints(u.branch)<4||skillPoints()<2)return;state.ultimates.push(id);save();renderModal();hud();toast('奥義「'+u.name+'」を習得した。');return;}if(a==='ultimate')return useUltimate(id);if(a==='respec'&&!floor){state.ultimates=[];state.ultimateCooldowns={};}if(a==='open'&&id==='town'&&floor)return;return masteryAction(raw);};
const TOWN_KEYS={'1':'gate','2':'huntGate','3':'tower','4':'shop','5':'forge','6':'teacher','7':'guild','8':'gacha','9':'skills','0':'expeditions',v:'codex',b:'alchemy',j:'journey',k:'bosses'};
const TOWN_NAMES={gate:'迷宮へ',huntGate:'狩場',tower:'挑戦の塔',shop:'お店',forge:'鍛冶',teacher:'魔法を習う',guild:'ギルド',gacha:'装備ガチャ',skills:'スキル',expeditions:'地域探索',codex:'図鑑',alchemy:'調合屋',journey:'冒険手帳',bosses:'ボス再戦'};
let menuCursor=0;
function menuElements(){const scope=modal?$('modalBody'):!running?$('titleScreen'):null;if(!scope)return [];const list=[...scope.querySelectorAll('button,summary,input:not([type="hidden"]),textarea,select')].filter(el=>!el.disabled&&!el.hidden&&(el.getClientRects?el.getClientRects().length>0:true));if(modal){const close=$('closeModal');if(!close.disabled&&!close.hidden)list.push(close);}return list;}
function focusMenu(el){const list=menuElements();if(!el||!list.includes(el))return;list.forEach(b=>b.classList.remove('keyboard-choice'));el.classList.add('keyboard-choice');menuCursor=list.indexOf(el);el.focus();el.scrollIntoView?.({block:'nearest'});if(modal==='commands'){const n=commandChoices().findIndex(c=>c.action===el.dataset?.action);if(n>=0)commandCursor=n;}}
function firstMenuChoice(){const list=menuElements();return (modal==='commands'?list.find(e=>e.dataset?.action?.startsWith('cast:')):modal==='skills'?list.find(e=>e.dataset?.action?.startsWith('skill:')||e.dataset?.action?.startsWith('learnUltimate:')):list.find(e=>e.classList.contains?.('primary')))||list.find(e=>e.dataset?.action!=='respec'&&!e.classList.contains?.('danger'))||list.at(-1);}
function navigateMenu(delta){const list=menuElements();if(!list.length)return;const at=list.indexOf(document.activeElement),next=((at<0?-1:at)+delta+list.length)%list.length;focusMenu(list[next]);}
const masteryRender=renderModal;
renderModal=function(){const active=document.activeElement?.dataset?.action;masteryRender();if(modal==='skills')$('modalBody').innerHTML+='<h3>極めた先の奥義</h3><p>各系統の鍛錬を重ねると、奥義を習得できます。1つにつき2pt、街での振り直しで返却。</p>'+ultimateRows(true);
 if(modal==='ultimates'){$('modalTitle').textContent='奥義';$('modalEyebrow').textContent='SECRET ARTS';$('modalBody').innerHTML='<p class="notice">↑↓ / WASDで選択 · Enterで発動 · Escで戻る</p>'+ultimateRows();}
 if(modal==='commands'&&state.ultimates.length)$('modalBody').innerHTML+='<h3>奥義</h3>'+ultimateRows();
 if(modal==='town'){$('modalTitle').textContent='街の施設';$('modalEyebrow').textContent='SANCTUARY';$('modalBody').innerHTML='<p class="notice">↑↓ / WASDで選択 · Enterで決定<br>街では表示キーで施設を直接開けます。</p><div class="town-key-grid">'+Object.entries(TOWN_KEYS).map(([key,id])=>btn('['+key.toUpperCase()+'] '+TOWN_NAMES[id],'open:'+id)).join('')+'</div>';}
 if(modal==='help')$('modalBody').innerHTML='<div class="notice">PC：移動 WASD / 矢印 · 回避 Enter / Shift · 魔法 Space · 奥義 Q<br>調べる E · 装備 I · 経験結晶 X · 街の施設 T · 帰還 R · 記録 Esc<br>メニュー：矢印 / WASDで選択、Enterで決定。Tabも使用可能。階段ではE→Enterで次の階へ。塔の突破後はN→Enterで続行。<br>街：1迷宮 / 2狩場 / 3塔 / 4店 / 5鍛冶 / 6魔法 / 7ギルド / 8ガチャ / 9スキル / 0地域。<br>魔法は1〜9・0で直接発動。入力欄では通常の文字入力ができます。</div>'+$('modalBody').innerHTML;
 if(modal==='help')$('modalBody').innerHTML=$('modalBody').innerHTML.replaceAll('PC：Space（Shiftも可） / E','PC：Enter（Shiftも可） / E').replaceAll('Enter / I、または','Space / I、または');
 focusMenu(menuElements().find(e=>e.dataset?.action===active)||firstMenuChoice());};
const masteryOpen=openModal;
openModal=function(...args){menuCursor=0;masteryOpen(...args);focusMenu(firstMenuChoice());};
handleGameKey=function(e){const k=e.key.toLowerCase(),el=e.target||document.activeElement,tag=(el?.tagName||'').toLowerCase(),typing=['input','textarea','select'].includes(tag)||el?.isContentEditable;
 if(typing){if(k==='escape'){e.preventDefault();closeModal();}else if(k==='enter'&&!e.repeat&&tag==='input'&&['newHeroName','renameInput'].includes(el.id)){e.preventDefault();action(el.id==='newHeroName'?'confirmNewGame':'confirmRename');}else if(k==='enter'&&e.ctrlKey&&modal==='backup'){e.preventDefault();action('previewImport');}return;}
 if(modal||!running){if(k==='escape'){e.preventDefault();closeModal();return;}if(k==='tab'){const list=menuElements();if(list.length){e.preventDefault();navigateMenu(e.shiftKey?-1:1);}return;}if(['arrowdown','arrowright','s','d','arrowup','arrowleft','w','a'].includes(k)){e.preventDefault();navigateMenu(['arrowup','arrowleft','w','a'].includes(k)?-1:1);return;}if((k==='enter'||k===' ')&&!e.repeat){e.preventDefault();const list=menuElements(),chosen=list.includes(document.activeElement)?document.activeElement:(list[menuCursor]||firstMenuChoice());chosen?.click();return;}if(modal==='town'&&TOWN_KEYS[k]&&!e.repeat){e.preventDefault();action('open:'+TOWN_KEYS[k]);return;}if(modal==='commands'&&/^[0-9]$/.test(k)&&!e.repeat){e.preventDefault();const id=state.spells[k==='0'?9:Number(k)-1];if(id)action('cast:'+id);}return;}
 if(!loaded)return;if(['arrowup','arrowdown','arrowleft','arrowright',' ','enter'].includes(k))e.preventDefault();if(e.repeat)return;keys.add(k);
 if(k==='enter'||k==='shift')dodge();else if(k===' ')openModal('commands');else if(k==='q')openModal('ultimates');else if(k==='e')interact();else if(k==='i')openModal('equipment');else if(k==='x')openModal('expBag');else if(k==='r'&&floor)openModal('return');else if(k==='t'&&!floor)openModal('town');else if(k==='h')openModal('help');else if(k==='escape')openModal('journal');else if(k==='c'&&floor)stealth=!stealth;else if(!floor&&TOWN_KEYS[k]){currentTab='weapons';openModal(TOWN_KEYS[k]);}else if(k==='n'&&floor){if(tower?.cleared)openModal('towerClear');else if(targetObject()?.type==='stairs')interact();}
};
const masteryHud=hud;
hud=function(){masteryHud();const b=$('ultimateButton');if(b)b.textContent='奥義 Q'+(state.ultimates.length?' ('+state.ultimates.length+')':'');};
