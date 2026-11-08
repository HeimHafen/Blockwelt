// BLOCKWELT V2 — selbst entwickeltes kreatives Blockabenteuer.
// Keine Minecraft-Dateien oder Texturen; 3D-Technik: Three.js (MIT).
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.js';

const $ = (id) => document.getElementById(id);
const gameEl = $('game');
const BLOCK_TYPES = ['grass','dirt','stone','wood','leaves','sand','planks'];
const LABELS = {grass:'Gras',dirt:'Erde',stone:'Stein',wood:'Holz',leaves:'Blätter',sand:'Sand',planks:'Bretter'};
const HALF = 18; // Größere Welt; bestehende V1-Spielstände bleiben erhalten.
const KEY = 'blockwelt-kleine-baumeister-v1';
const blocks = new Map();
const edits = new Map();
const meshes = [];
let selectedType = 'grass';
let gameRunning = false;
let toastTimer = null;
const undoStack = [];
let flying = false;
let jumpHeld = false;
let descendHeld = false;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#a9d8ee');
scene.fog = new THREE.Fog('#a9d8ee', 22, 64);
const camera = new THREE.PerspectiveCamera(72, 1, .06, 95);
camera.rotation.order = 'YXZ';
const renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setSize(window.innerWidth,window.innerHeight);
gameEl.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight('#e9f7ff','#657f50',2.25));
const sunlight = new THREE.DirectionalLight('#fff5d6',2.25);
sunlight.position.set(-13,23,-9);
scene.add(sunlight);

// Make tiny pixel textures procedurally. Their palette and patterns are original.
function texture(type,face){
  const canvas=document.createElement('canvas'); canvas.width=32;canvas.height=32;
  const ctx=canvas.getContext('2d');
  let seed=type.split('').reduce((a,c)=>a*31+c.charCodeAt(0),17)+(face==='top'?14:face==='bottom'?78:47);
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const palette={
    grass:['#70b95e','#7abf67','#63af56','#8ac66b','#5fa852'],
    dirt:['#9a7252','#a6805c','#886549','#b08a63','#94704f'],
    stone:['#99a4a3','#adb7b4','#8b9795','#bec7bf','#929c99'],
    wood:['#a97c50','#bf8b54','#90653f','#c99a66','#9c7147'],
    leaves:['#508e57','#5f9f60','#427a4c','#75a86b','#4c8654'],
    sand:['#dec993','#e7d39d','#d5bd86','#f0dba8','#cbb481'],
    planks:['#c49358','#d0a36a','#b5824d','#e2b277','#ac7848']
  };
  let baseType=(type==='grass'&&face==='bottom')?'dirt':type;
  for(let y=0;y<32;y+=4) for(let x=0;x<32;x+=4){
    let colors=palette[baseType];
    if(type==='grass'&&face==='side') colors=y<7?palette.grass:palette.dirt;
    let index=Math.floor(random()*colors.length);
    if(type==='wood'&&face==='side'&&x%12<4) index=2;
    if(type==='wood'&&face==='top') {const r=Math.max(Math.abs(x-14),Math.abs(y-14)); index=r%12<4?2:1;}
    if(type==='planks'&&face==='side'&&y%16<4)index=2;
    if(type==='planks'&&face==='top'&&x%16<3)index=2;
    ctx.fillStyle=colors[index];ctx.fillRect(x,y,4,4);
  }
  if(type==='grass'&&face==='side'){
    ctx.fillStyle='#5c9e50';for(let x=0;x<32;x+=4){ctx.fillRect(x,7,4,3+Math.floor(random()*5));}
  }
  const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;
  return t;
}
const materialByType={};
for(const type of BLOCK_TYPES){
  const side=new THREE.MeshLambertMaterial({map:texture(type,'side')});
  const top=new THREE.MeshLambertMaterial({map:texture(type,'top')});
  const bottom=new THREE.MeshLambertMaterial({map:texture(type,'bottom')});
  materialByType[type]=[side,side,top,bottom,side,side];
}
const blockGeo=new THREE.BoxGeometry(1,1,1);
const key=(x,y,z)=>`${x},${y},${z}`;
const get=(x,y,z)=>blocks.get(key(x,y,z));
function put(x,y,z,type){const k=key(x,y,z);if(type)blocks.set(k,type);else blocks.delete(k);}
function terrainHeight(x,z){
  return Math.max(2,Math.min(6,Math.round(3.25+Math.sin(x*.31)*.68+Math.cos(z*.29)*.62+Math.sin((x+z)*.23)*.35)));
}
function baseWorld(){
  blocks.clear();
  for(let x=-HALF;x<HALF;x++)for(let z=-HALF;z<HALF;z++){
    const h=terrainHeight(x,z);
    for(let y=0;y<h;y++)put(x,y,z,y===h-1?'grass':y>=h-3?'dirt':'stone');
  }
  // Kinderfreundliche Bäume, rund um die Startposition bleibt Raum zum Bauen.
  const trees=[[-9,-9],[-5,-4],[4,-8],[9,-7],[-10,5],[-4,10],[7,7],[10,2],[-10,-1],[3,11],[-15,-13],[-12,15],[14,-12],[15,9],[-16,3],[5,15]];
  for(const [x,z] of trees){
    const h=terrainHeight(x,z);
    for(let y=h;y<h+4;y++)put(x,y,z,'wood');
    for(let dx=-2;dx<=2;dx++) for(let dz=-2;dz<=2;dz++) for(let dy=2;dy<=4;dy++){
      if(Math.abs(dx)===2&&Math.abs(dz)===2)continue;
      if(dy===4&&Math.abs(dx)+Math.abs(dz)>2)continue;
      const xx=x+dx,yy=h+dy,zz=z+dz;
      if(xx>=-HALF&&xx<HALF&&zz>=-HALF&&zz<HALF&&!get(xx,yy,zz))put(xx,yy,zz,'leaves');
    }
  }
}
function loadEdits(){
  try{
    const arr=JSON.parse(localStorage.getItem(KEY)||'[]');
    if(!Array.isArray(arr))return;
    for(const item of arr){
      if(!Array.isArray(item)||item.length!==4)continue;
      const [x,y,z,type]=item;
      if(![x,y,z].every(Number.isInteger)||x< -HALF||x>=HALF||z< -HALF||z>=HALF||y<0||y>25)continue;
      if(type!==null&&!BLOCK_TYPES.includes(type))continue;
      put(x,y,z,type);edits.set(key(x,y,z),item);
    }
  }catch(e){console.warn('Spielstand konnte nicht geladen werden',e);}
}
function saveEdits(){
  try{localStorage.setItem(KEY,JSON.stringify([...edits.values()]));}
  catch(e){toast('Speichern ist auf diesem Gerät nicht möglich');}
}
const dummy=new THREE.Object3D();
function visible(x,y,z){
  return !get(x+1,y,z)||!get(x-1,y,z)||!get(x,y+1,z)||!get(x,y-1,z)||!get(x,y,z+1)||!get(x,y,z-1);
}
function rebuild(){
  while(meshes.length){const mesh=meshes.pop();scene.remove(mesh);mesh.dispose();}
  const typePositions=Object.fromEntries(BLOCK_TYPES.map(t=>[t,[]]));
  for(const [k,type] of blocks){
    const [x,y,z]=k.split(',').map(Number);
    if(visible(x,y,z))typePositions[type].push([x,y,z]);
  }
  for(const type of BLOCK_TYPES){
    const positions=typePositions[type];if(!positions.length)continue;
    const mesh=new THREE.InstancedMesh(blockGeo,materialByType[type],positions.length);
    mesh.userData.positions=positions;
    mesh.frustumCulled=false;
    positions.forEach(([x,y,z],i)=>{
      dummy.position.set(x+.5,y+.5,z+.5);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate=true;
    scene.add(mesh);meshes.push(mesh);
  }
}

// Background clouds (not buildable, not included in raycasting).
const cloudMat=new THREE.MeshBasicMaterial({color:'#f9fff7',transparent:true,opacity:.84,depthWrite:false});
const cloudGeo=new THREE.BoxGeometry(1,1,1);
const clouds=new THREE.Group();scene.add(clouds);
for(let i=0;i<8;i++){
  const group=new THREE.Group();group.position.set(-26+i*8.1,17+(i%3)*2,-20-(i%2)*5);
  for(let j=0;j<3;j++){
    const p=new THREE.Mesh(cloudGeo,cloudMat);p.position.set((j-1)*2.2,j===1?.6:0,0);
    p.scale.set(j===1?4.7:3.4,1.6,2.5);group.add(p);
  }
  clouds.add(group);
}

const player={x:.5,y:terrainHeight(0,6)+.02,z:6.5,vy:0,grounded:false};
let yaw=.08,pitch=-.22;
const PLAYER_R=.25,PLAYER_H=1.73,GRAVITY=19.5,JUMP=7.0;
function blocked(x,y,z){
  const minX=Math.floor(x-PLAYER_R+.005),maxX=Math.floor(x+PLAYER_R-.005);
  const minZ=Math.floor(z-PLAYER_R+.005),maxZ=Math.floor(z+PLAYER_R-.005);
  const minY=Math.floor(y+.04),maxY=Math.floor(y+PLAYER_H-.04);
  for(let ix=minX;ix<=maxX;ix++)for(let iz=minZ;iz<=maxZ;iz++)for(let iy=minY;iy<=maxY;iy++)if(get(ix,iy,iz))return true;
  return false;
}
function groundedAt(x,y,z){return blocked(x,y-.07,z);}
function horizontal(axis,amount){
  if(!amount)return;
  const proposed=player[axis]+amount;
  if(proposed< -HALF+.3||proposed>HALF-.3)return;
  const nx=axis==='x'?proposed:player.x,nz=axis==='z'?proposed:player.z;
  if(!blocked(nx,player.y,nz)){player[axis]=proposed;return;}
  // Gentle auto-step over a one-block ledge for younger players.
  if(player.grounded&&!blocked(nx,player.y+1.02,nz)&&blocked(nx,player.y+.94-.09,nz)){
    player.y+=1.02;player[axis]=proposed;player.vy=0;
  }
}
function updateMovement(dt){
  if(!gameRunning)return;
  const keyboardX=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));
  const keyboardF=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'));
  let x=keyboardX+stick.x,f=keyboardF-stick.y;
  const magnitude=Math.hypot(x,f);if(magnitude>1){x/=magnitude;f/=magnitude;}
  const speed=4.25*dt;
  const dx=(Math.cos(yaw)*x-Math.sin(yaw)*f)*speed;
  const dz=(-Math.sin(yaw)*x-Math.cos(yaw)*f)*speed;
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.12));
  for(let i=0;i<steps;i++){horizontal('x',dx/steps);horizontal('z',dz/steps);}
  if(flying){
    const ascend=jumpHeld||keys.has('Space')||keys.has('KeyE');
    const descend=descendHeld||keys.has('ShiftLeft')||keys.has('ShiftRight')||keys.has('KeyQ');
    const direction=Number(ascend)-Number(descend);
    if(direction){
      const goal=Math.max(.5,Math.min(24,player.y+direction*5.1*dt));
      if(!blocked(player.x,goal,player.z))player.y=goal;
    }
    player.vy=0;player.grounded=false;
    return;
  }
  player.vy-=GRAVITY*dt;
  const dy=player.vy*dt;
  const vsteps=Math.max(1,Math.ceil(Math.abs(dy)/.09));
  for(let i=0;i<vsteps;i++){
    const nextY=player.y+dy/vsteps;
    if(!blocked(player.x,nextY,player.z))player.y=nextY;
    else{player.vy=0;break;}
  }
  player.grounded=groundedAt(player.x,player.y,player.z);
  if(player.grounded&&player.vy<0)player.vy=0;
  if(player.y< -5){respawn();toast('Wieder sicher auf der Wiese!');}
}
function respawn(){player.x=.5;player.z=6.5;player.y=terrainHeight(0,6)+.08;player.vy=0;}
function jump(){if(!gameRunning||flying)return;if(player.grounded){player.vy=JUMP;player.grounded=false;}}
function updateCamera(){
  camera.position.set(player.x,player.y+1.57,player.z);
  camera.rotation.set(pitch,yaw,0);
}

const raycaster=new THREE.Raycaster();raycaster.far=6.3;
const highlight=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.015,1.015,1.015)),new THREE.LineBasicMaterial({color:'#fffce2',depthTest:false,transparent:true,opacity:.96}));
highlight.visible=false;highlight.renderOrder=15;scene.add(highlight);
let pointed=null;
function updateTarget(){
  raycaster.setFromCamera(new THREE.Vector2(0,0),camera);
  const hits=raycaster.intersectObjects(meshes,false);
  pointed=null;
  for(const hit of hits){
    if(hit.instanceId===undefined||!hit.face)continue;
    const pos=hit.object.userData.positions[hit.instanceId];if(!pos)continue;
    pointed={x:pos[0],y:pos[1],z:pos[2],type:get(...pos),face:hit.face.normal.clone()};break;
  }
  highlight.visible=!!pointed;
  if(pointed){highlight.position.set(pointed.x+.5,pointed.y+.5,pointed.z+.5);$('targetLabel').textContent=LABELS[pointed.type]||'';}
  else $('targetLabel').textContent='Schau einen Block an';
}
function intersectsPlayer(x,y,z){
  return Math.abs((x+.5)-player.x)<PLAYER_R+.5&&Math.abs((z+.5)-player.z)<PLAYER_R+.5&&y<player.y+PLAYER_H&&y+1>player.y;
}
function modifyWorld(place,quiet=false){
  if(!gameRunning)return;
  if(!pointed){toast('Schau zuerst einen Block an');return;}
  let {x,y,z}=pointed;
  if(place){x+=Math.round(pointed.face.x);y+=Math.round(pointed.face.y);z+=Math.round(pointed.face.z);}
  if(x< -HALF||x>=HALF||z< -HALF||z>=HALF||y<0||y>25){toast('Hier endet deine kleine Welt');return;}
  if(place&&(get(x,y,z)||intersectsPlayer(x,y,z))){toast('Hier ist schon etwas');return;}
  if(!place&&y===0){toast('Der Boden bleibt sicher stehen');return;}
  const type=place?selectedType:null;
  const k=key(x,y,z);
  const oldType=get(x,y,z)||null;
  const oldEdit=edits.get(k);
  undoStack.push({x,y,z,oldType,oldEdit:oldEdit ? [...oldEdit]:null});
  if(undoStack.length>40)undoStack.shift();
  syncUndo();
  put(x,y,z,type);
  edits.set(key(x,y,z),[x,y,z,type]);
  saveEdits();rebuild();updateTarget();
  if(!quiet)toast(place?`${LABELS[selectedType]} gesetzt!`:'Block abgebaut!');
}
function syncUndo(){
  const button=$('undoBtn');
  button.disabled=undoStack.length===0;
}
function undo(){
  if(!undoStack.length){toast('Noch nichts zum Rückgängigmachen');return;}
  const {x,y,z,oldType,oldEdit}=undoStack.pop();
  const k=key(x,y,z);
  put(x,y,z,oldType);
  if(oldEdit)edits.set(k,oldEdit);else edits.delete(k);
  saveEdits();rebuild();updateTarget();syncUndo();
  toast('Letzten Baustein rückgängig gemacht');
}
function setFlying(next){
  flying=next;player.vy=0;
  jumpHeld=false;descendHeld=false;
  document.body.classList.toggle('flying',flying);
  $('flightBtn').setAttribute('aria-pressed',String(flying));
  $('flightBtn').textContent=flying?'✓ Flugmodus eingeschaltet':'✦ Flugmodus einschalten';
  $('jumpBtn').querySelector('small').textContent=flying?'HOCH':'SPRINGEN';
  toast(flying?'Du kannst jetzt fliegen!':'Du läufst wieder!');
}
function exportWorld(){
  const data={format:'blockwelt',version:2,savedAt:new Date().toISOString(),edits:[...edits.values()]};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');link.href=url;link.download='Blockwelt-Meine-Welt.json';
  document.body.appendChild(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),3000);
  toast('Deine Welt wurde als Datei gesichert');
}
async function importWorld(file){
  if(!file)return;
  if(file.size>2_000_000){toast('Diese Datei ist zu groß');return;}
  try{
    const data=JSON.parse(await file.text());
    if(data?.format!=='blockwelt'||data.version!==2||!Array.isArray(data.edits)||data.edits.length>20000)throw new Error('format');
    const incoming=new Map();
    for(const edit of data.edits){
      if(!Array.isArray(edit)||edit.length!==4)throw new Error('entry');
      const [x,y,z,type]=edit;
      if(![x,y,z].every(Number.isInteger)||x< -HALF||x>=HALF||z< -HALF||z>=HALF||y<0||y>25||(type!==null&&!BLOCK_TYPES.includes(type)))throw new Error('entry');
      incoming.set(key(x,y,z),[x,y,z,type]);
    }
    if(!confirm('Die bisherige Welt durch diese Sicherung ersetzen?'))return;
    baseWorld();edits.clear();undoStack.length=0;
    for(const [k,edit] of incoming){const [x,y,z,type]=edit;put(x,y,z,type);edits.set(k,edit);}
    saveEdits();rebuild();respawn();syncUndo();
    toast('Deine gesicherte Welt wurde geladen!');
  }catch(e){console.warn('Ungültige Blockwelt-Sicherung',e);toast('Diese Sicherung kann nicht geladen werden');}
}
function toast(message){
  $('toast').textContent=message;$('toast').classList.add('visible');
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),1650);
}

const keys=new Set();
window.addEventListener('keydown',e=>{
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
  keys.add(e.code);
  if(e.code==='Space'&&!e.repeat)jump();
  if(/^Digit[1-7]$/.test(e.code))selectBlock(BLOCK_TYPES[Number(e.code.slice(-1))-1]);
  if(e.code==='KeyZ'&&e.ctrlKey){e.preventDefault();undo();}
  if(e.code==='Escape'&&gameRunning)openMenu();
});
window.addEventListener('keyup',e=>keys.delete(e.code));
window.addEventListener('blur',()=>{keys.clear();stick.x=0;stick.y=0;centerStick();});
const stick={x:0,y:0,id:null};
const joystick=$('joystick'),knob=$('joystickKnob');
function centerStick(){knob.style.left='50%';knob.style.top='50%';}
function moveStick(e){
  const r=joystick.getBoundingClientRect();const max=r.width*.31;
  let dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);
  const m=Math.hypot(dx,dy);if(m>max){dx*=max/m;dy*=max/m;}
  stick.x=dx/max;stick.y=dy/max;
  knob.style.left=`calc(50% + ${dx}px)`;knob.style.top=`calc(50% + ${dy}px)`;
}
joystick.addEventListener('pointerdown',e=>{
  if(!gameRunning)return;e.preventDefault();e.stopPropagation();
  stick.id=e.pointerId;joystick.setPointerCapture(e.pointerId);moveStick(e);
});
joystick.addEventListener('pointermove',e=>{if(e.pointerId===stick.id)moveStick(e);});
function stopStick(e){if(e.pointerId!==stick.id)return;stick.id=null;stick.x=0;stick.y=0;centerStick();}
joystick.addEventListener('pointerup',stopStick);joystick.addEventListener('pointercancel',stopStick);
let lookId=null,lookX=0,lookY=0;
renderer.domElement.addEventListener('pointerdown',e=>{
  if(!gameRunning||lookId!==null)return;
  e.preventDefault();lookId=e.pointerId;lookX=e.clientX;lookY=e.clientY;
  renderer.domElement.setPointerCapture(e.pointerId);
});
renderer.domElement.addEventListener('pointermove',e=>{
  if(!gameRunning||e.pointerId!==lookId)return;
  const dx=e.clientX-lookX,dy=e.clientY-lookY;lookX=e.clientX;lookY=e.clientY;
  yaw-=dx*.0048;pitch-=dy*.0048;
  pitch=Math.max(-1.34,Math.min(1.34,pitch));
});
for(const event of ['pointerup','pointercancel'])renderer.domElement.addEventListener(event,e=>{if(e.pointerId===lookId)lookId=null;});
// Mouse: drag to look, left click to mine, right click to place.
let mouseDown=null;
renderer.domElement.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')mouseDown={x:e.clientX,y:e.clientY,button:e.button};});
renderer.domElement.addEventListener('pointerup',e=>{
  if(e.pointerType==='mouse'&&mouseDown&&Math.hypot(e.clientX-mouseDown.x,e.clientY-mouseDown.y)<6){modifyWorld(mouseDown.button===2);}
  mouseDown=null;
});
renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());
function bindHold(id,onStart,onEnd){
  const element=$(id);
  element.addEventListener('pointerdown',e=>{
    if(!gameRunning)return;
    e.preventDefault();e.stopPropagation();
    try{element.setPointerCapture(e.pointerId);}catch(_){}
    onStart();
  });
  for(const name of ['pointerup','pointercancel','lostpointercapture'])element.addEventListener(name,onEnd);
}
bindHold('jumpBtn',()=>{jumpHeld=true;jump();},()=>{jumpHeld=false;});
bindHold('descendBtn',()=>{descendHeld=true;},()=>{descendHeld=false;});
// Kurzes Tippen: ein Block. Gedrückt halten: mehrere Blöcke nacheinander.
function bindBuild(id,place){
  const element=$(id);let startDelay=null,repeat=null,activeId=null;
  const stop=()=>{clearTimeout(startDelay);clearInterval(repeat);startDelay=null;repeat=null;activeId=null;};
  element.addEventListener('pointerdown',e=>{
    if(!gameRunning)return;
    e.preventDefault();e.stopPropagation();stop();activeId=e.pointerId;
    try{element.setPointerCapture(e.pointerId);}catch(_){}
    modifyWorld(place);
    startDelay=setTimeout(()=>{repeat=setInterval(()=>{if(gameRunning)modifyWorld(place,true);else stop();},230);},410);
  });
  for(const name of ['pointerup','pointercancel','lostpointercapture'])element.addEventListener(name,e=>{if(activeId===null||e.pointerId===activeId)stop();});
  window.addEventListener('blur',stop);
}
bindBuild('breakBtn',false);bindBuild('placeBtn',true);
function selectBlock(type){
  selectedType=type;
  document.querySelectorAll('.slot').forEach(el=>{
    const active=el.dataset.block===type;el.classList.toggle('active',active);el.setAttribute('aria-pressed',String(active));
  });
}
document.querySelectorAll('.slot').forEach(el=>el.addEventListener('click',()=>selectBlock(el.dataset.block)));
function openMenu(){gameRunning=false;stick.x=0;stick.y=0;centerStick();jumpHeld=false;descendHeld=false;$('overlay').classList.remove('hidden');$('dialogTitle').textContent='Deine Blockwelt';$('startBtn').textContent='▶ Weiterspielen';}
$('menuBtn').addEventListener('click',openMenu);
$('undoBtn').addEventListener('click',undo);
$('flightBtn').addEventListener('click',()=>setFlying(!flying));
$('exportBtn').addEventListener('click',exportWorld);
$('importBtn').addEventListener('click',()=>$('importFile').click());
$('importFile').addEventListener('change',async e=>{const f=e.target.files?.[0];e.target.value='';await importWorld(f);});
$('startBtn').addEventListener('click',()=>{
  $('overlay').classList.add('hidden');gameRunning=true;toast('Viel Spaß beim Bauen!');
});
$('resetBtn').addEventListener('click',()=>{
  if(!confirm('Soll deine gebaute Welt wirklich gelöscht und neu begonnen werden?'))return;
  try{localStorage.removeItem(KEY);}catch(e){console.warn(e);}
  edits.clear();undoStack.length=0;syncUndo();baseWorld();rebuild();respawn();toast('Deine Welt ist wieder neu!');
});

function resize(){
  const w=window.innerWidth,h=window.innerHeight;
  camera.aspect=w/Math.max(1,h);camera.updateProjectionMatrix();renderer.setSize(w,h,false);
}
window.addEventListener('resize',resize);
window.addEventListener('orientationchange',()=>setTimeout(resize,180));
baseWorld();loadEdits();rebuild();syncUndo();updateCamera();resize();
$('loading').remove();
let lastTime=performance.now();
function animate(now){
  requestAnimationFrame(animate);
  const dt=Math.min(.04,Math.max(0,(now-lastTime)/1000));lastTime=now;
  updateMovement(dt);updateCamera();updateTarget();
  clouds.position.x=Math.sin(now*.00007)*1.4;
  renderer.render(scene,camera);
}
requestAnimationFrame(animate);
