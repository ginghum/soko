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
