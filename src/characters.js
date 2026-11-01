// Dedicated character atlases. Row order is shared with ART_ASSETS.md.
const CHARACTER_ART={
 8:['sewer-cast',0,82],9:['sewer-cast',1,80],10:['sewer-cast',2,86],11:['sewer-cast',3,82],
 12:['depths-cast',0,86],13:['depths-cast',1,88],14:['depths-cast',2,148],15:['depths-cast',3,144],
 16:['tower-cast',0,152],17:['tower-cast',1,132],18:['tower-cast',2,136],19:['tower-cast',3,148],
 20:['silver-cast',0,64]
};
const characterDrawEnemy=drawEnemy;
drawEnemy=function(e){const spec=CHARACTER_ART[e.type];if(!spec)return characterDrawEnemy(e);const [sheet,row,size]=spec,boss=e.type>=14&&e.type<=19;
 shadow(e.x,e.y,boss?34:e.type===20?15:20);
 if(e.secondForm){ctx.save();ctx.strokeStyle='#c296cc99';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(e.x,e.y+2,38,13,0,0,TAU);ctx.stroke();ctx.restore();}
 const frame=e.hurt>0?3:e.type===20?(e.metalSeen?(e.metalLife<15?2:1):0):e.wind>0?1:e.cool>e.ct-.25?2:0;
 sprite(sheet,row*4+frame,4,4,e.x,e.y+8+Math.sin(clock*5+e.seed)*1.2,size,size,e.hurt>0?.72:1);
 if(!boss&&(e.type===20||e.hp<e.maxHp)){ctx.fillStyle='#081319';ctx.fillRect(e.x-21,e.y-size*.8,42,4);ctx.fillStyle=e.type===20?'#d8eef3':'#b6bc74';ctx.fillRect(e.x-21,e.y-size*.8,42*clamp(e.hp/e.maxHp,0,1),4);}
};
const characterDrawObject=drawObject;
drawObject=function(o){const row={rescue:1,sewerRescue:2,trader:3}[o.type];if(row===undefined)return characterDrawObject(o);shadow(o.x,o.y,17);sprite('silver-cast',row*4+(o.done?0:o.type==='trader'?0:3),4,4,o.x,o.y+7,80,80,o.done?.6:1);if(!o.done){ctx.fillStyle='#e7c985';ctx.fillRect(o.x-3,o.y-64,6,6);}};
const characterDrawTown=drawTown;
drawTown=function(){characterDrawTown();if(state.counts.rescue){shadow(20*TILE+24,13*TILE+24,17);sprite('silver-cast',4,4,4,20*TILE+24,13*TILE+31,76,76);}};
function characterPortrait(type){const a=CHARACTER_ART[type];return a?'<span class="monster-portrait" role="img" aria-label="'+ENEMY_NAMES[type]+'" style="background-image:url(assets/'+a[0]+'.webp);background-position:0 '+a[1]*100/3+'%"></span>':'';}
const characterRenderModal=renderModal;
renderModal=function(){characterRenderModal();if(modal==='codex'){let html=$('modalBody').innerHTML;ENEMY_NAMES.forEach((name,i)=>{const portrait=characterPortrait(i);if(portrait)html=html.replace('<b>'+(state.book[i]?'◆':'◇')+' '+name+'</b>',portrait+'<b>'+(state.book[i]?'◆':'◇')+' '+name+'</b>');});$('modalBody').innerHTML=html;}};
