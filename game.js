// BLOCKWELT V5 — selbst entwickeltes kreatives Blockabenteuer.
// Keine Minecraft-Dateien oder Texturen; 3D-Technik: Three.js (MIT).
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.js';

const $ = (id) => document.getElementById(id);
const gameEl = $('game');
const BLOCK_TYPES = ['grass','dirt','stone','wood','leaves','sand','planks','bricks','cobble','glass','gold','water','path'];
const LABELS = {grass:'Gras',dirt:'Erde',stone:'Stein',wood:'Holz',leaves:'Blätter',sand:'Sand',planks:'Bretter',bricks:'Ziegel',cobble:'Pflaster',glass:'Glas',gold:'Gold',water:'Wasser',path:'Weg'};
const HALF = 96; // V5: 192 × 192. Dynamische Chunks halten den iPhone-Speicher klein.
const LEGACY_HALF = 32; // Der komplette alte V3-Weltausschnitt bleibt erhalten.
const MOBILE = matchMedia('(pointer: coarse)').matches || innerWidth < 740;
const STREAM_RADIUS = MOBILE ? 2 : 3; // iPhone: maximal 5×5 aktive Chunks.
const WATER_LEVEL = 5;
const VILLAGES = [
  {name:'Sonnen-Dorf',x:47,z:9,people:5},
  {name:'Birken-Dorf',x:-53,z:-48,people:4}
];
const LAKES = [{x:-61,z:41,r:14},{x:63,z:-49,r:12}];
const OLD_MIN = -18, OLD_MAX = 17, CHUNK = 16, MAX_Y = 70;
const KEY = 'blockwelt-kleine-baumeister-v1';
const blocks = new Map();
const edits = new Map();
const chunkMeshes = new Map();
const generatedChunks = new Set();
let lastStreamCenter = '';
const chunksPerSide = HALF / CHUNK;
let showCreatures = true;
let dayMode = true;
let selectedType = 'grass';
let gameRunning = false;
let toastTimer = null;
const undoStack = [];
let flying = false;
let jumpHeld = false;
let descendHeld = false;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#a9d8ee');
scene.fog = new THREE.Fog('#a9d8ee', MOBILE ? 26 : 40, MOBILE ? 53 : 74);
const camera = new THREE.PerspectiveCamera(72, 1, .06, MOBILE ? 67 : 90);
camera.rotation.order = 'YXZ';
const renderer = new THREE.WebGLRenderer({antialias:!MOBILE, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MOBILE ? 1.35 : 1.65));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setSize(window.innerWidth,window.innerHeight);
gameEl.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight('#ecf7ff','#677e5b',2.1));
const sunlight = new THREE.DirectionalLight('#fff5d6',2.25);
sunlight.position.set(-23,49,-28);
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
    planks:['#c49358','#d0a36a','#b5824d','#e2b277','#ac7848'],
    bricks:['#be805f','#c98a69','#ad6c52','#d49a78','#b77759'],
    cobble:['#929e99','#aeb7af','#7f8e88','#c0c8bd','#8d9a92'],
    glass:['#9bdfeb','#b5eaf0','#83c9da','#d6f8fc','#95d4e2'],
    gold:['#f7d468','#eab24a','#e8c75b','#ffe69b','#d9a73b'],
    water:['#52afd9','#74c4df','#439fca','#8dd5e7','#65bdd8'],
    path:['#c9a778','#daba89','#b5976c','#dfc092','#bda077']
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
    if(type==='bricks'&&((y%16<2)||((x+(Math.floor(y/16)%2)*8)%16<2)))index=2;
    if(type==='cobble'&&((x%12<2)||(y%12<2)))index=2;
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
  if(type==='water'){
    const mat=new THREE.MeshLambertMaterial({map:texture(type,'side'),transparent:true,opacity:.63,depthWrite:false});
    materialByType[type]=[mat,mat,mat,mat,mat,mat];
  }else if(type==='glass'){
    const mat=new THREE.MeshLambertMaterial({map:texture(type,'side'),transparent:true,opacity:.78,depthWrite:false});
    materialByType[type]=[mat,mat,mat,mat,mat,mat];
  }else materialByType[type]=[side,side,top,bottom,side,side];
}
const blockGeo=new THREE.BoxGeometry(1,1,1);
const key=(x,y,z)=>`${x},${y},${z}`;
const get=(x,y,z)=>blocks.get(key(x,y,z));
function put(x,y,z,type){const k=key(x,y,z);if(type)blocks.set(k,type);else blocks.delete(k);}
// Preserve the complete V2 terrain and tree positions in the original area.
function oldHeight(x,z){
  return Math.max(2,Math.min(6,Math.round(3.25+Math.sin(x*.31)*.68+Math.cos(z*.29)*.62+Math.sin((x+z)*.23)*.35)));
}
function oldArea(x,z){return x>=OLD_MIN&&x<=OLD_MAX&&z>=OLD_MIN&&z<=OLD_MAX;}
function legacyTerrainHeight(x,z){
  if(oldArea(x,z))return oldHeight(x,z);
  const edgeX=Math.max(OLD_MIN,Math.min(OLD_MAX,x));
  const edgeZ=Math.max(OLD_MIN,Math.min(OLD_MAX,z));
  const original=oldHeight(edgeX,edgeZ);
  const distance=Math.max(Math.abs(x-edgeX),Math.abs(z-edgeZ));
  const blend=Math.min(1,Math.max(0,(distance-.3)/8.8));
  let hills=5.8+Math.sin(x*.14)*2+Math.cos(z*.17)*1.9+Math.sin((x-z)*.11)*1.2;
  // Eastern rocky mountains with a small walk-in cave.
  if(x>18)hills+=10*Math.exp(-((x-27)**2)/80-((z+6)**2)/140);
  // Dry south-western valley, flatter so building is easier.
  if(x< -18&&z>4)hills=4.5+Math.sin(x*.35)*.8+Math.cos(z*.32)*.7;
  return Math.max(2,Math.min(24,Math.round(original*(1-blend)+hills*blend)));
}
function legacyBiomeAt(x,z){
  if(oldArea(x,z))return 'wiese';
  if(x>=20&&z<=5)return 'fels';
  if(x<=-20&&z>=5)return 'sand';
  return 'wald';
}
function pixelHash(x,z,salt=0){
  let n=(Math.imul(x,374761393)+Math.imul(z,668265263)+Math.imul(salt,1442695041))|0;
  n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;
}
// Smooth, deterministic V5 wilderness; the old V3 rectangle is never regenerated.
function lakeDistance(x,z){
  let closest=1e6;
  for(const lake of LAKES){closest=Math.min(closest,Math.hypot(x-lake.x,z-lake.z)-lake.r);}
  return closest;
}
function inVillage(x,z){return VILLAGES.find(v=>Math.hypot(x-v.x,z-v.z)<19)||null;}
function inLegacy(x,z){return x>=-LEGACY_HALF && x<LEGACY_HALF && z>=-LEGACY_HALF && z<LEGACY_HALF;}
function clamp(v,a,b){return Math.min(b,Math.max(a,v));}
function terrainHeight(x,z){
  if(inLegacy(x,z))return legacyTerrainHeight(x,z);
  const lx=clamp(x,-LEGACY_HALF,LEGACY_HALF-1),lz=clamp(z,-LEGACY_HALF,LEGACY_HALF-1);
  const dist=Math.max(Math.abs(x-lx),Math.abs(z-lz));
  const blend=clamp((dist-.1)/11,0,1);
  const ridge=Math.sin(x*.083+Math.cos(z*.067)*1.5)*4.2+
              Math.cos(z*.105)*3.2+Math.sin((x+z)*.052)*3.1;
  const mountain=16*Math.pow(Math.max(0,Math.sin(x*.028+1.1)*Math.cos(z*.038-.7)),3)+
                 7*Math.max(0,Math.sin((x-z)*.047));
  let h=9+ridge+mountain;
  const village=inVillage(x,z);
  if(village){
    const d=Math.hypot(x-village.x,z-village.z);
    const flat=clamp((19-d)/7,0,1);
    h=h*(1-flat)+5*flat;
  }
  const dl=lakeDistance(x,z);
  if(dl<7){
    const depth=clamp((7-dl)/7,0,1);
    h=h*(1-depth)+3*depth;
  }
  return clamp(Math.round(legacyTerrainHeight(lx,lz)*(1-blend)+h*blend),2,36);
}
function biomeAt(x,z){
  if(inLegacy(x,z))return legacyBiomeAt(x,z);
  if(inVillage(x,z))return 'dorf';
  if(lakeDistance(x,z)<6)return 'see';
  if(x< -29&&z>7&&z<76)return 'wueste';
  if(terrainHeight(x,z)>19)return 'berge';
  if(x>37&&z<-28)return 'nadelwald';
  return 'wald';
}
// Houses, pathways and trees are deterministic across chunk boundaries.
const HOUSE_OFFSETS=[[-8,-8],[7,-9],[-10,7],[9,8]];
function villageBlocks(x,z,y,chunkPut){
  for(const v of VILLAGES){
    if(Math.abs(x-v.x)>21||Math.abs(z-v.z)>21)continue;
    // Paths connecting the houses; keep a clean, broad square in the center.
    if(Math.abs(x-v.x)<15&&Math.abs(z-v.z)<=1||
       Math.abs(z-v.z)<15&&Math.abs(x-v.x)<=1||
       Math.abs(x-v.x)<=2&&Math.abs(z-v.z)<=2){
      const h=terrainHeight(x,z);
      if(y===h-1)chunkPut(x,y,z,'path');
    }
    for(let i=0;i<HOUSE_OFFSETS.length;i++){
      const [dx,dz]=HOUSE_OFFSETS[i];
      const hx=v.x+dx,hz=v.z+dz;
      const rx=x-hx,rz=z-hz,ax=Math.abs(rx),az=Math.abs(rz);
      if(ax>4||az>4)continue;
      const floor=5;
      if(ax<=3&&az<=3&&y===floor)chunkPut(x,y,z,'planks');
      // Chest-high stone foundation, warm wood frame, windows and open doorway.
      if(ax<=3&&az<=3&&y>=floor+1&&y<=floor+3&&(ax===3||az===3)){
        let type='planks';
        if(y===floor+1)type='cobble';
        if((ax===3&&az===0||az===3&&ax===0)&&y===floor+2)type='glass';
        if(rz===3&&rx===0&&y<=floor+2)type=null;
        if(type!==null)chunkPut(x,y,z,type);
      }
      // Stepped warm roof, recognizable as a village house.
      for(let k=0;k<3;k++){
        if(y===floor+4+k && az<=4-k && ax<=4-k && (az===4-k||ax===4-k))chunkPut(x,y,z,'bricks');
      }
      if(y===floor+6&&ax<=1&&az<=1)chunkPut(x,y,z,'planks');
    }
    // A village meeting well at the crossroads.
    if(Math.abs(x-v.x)<=2&&Math.abs(z-v.z)<=2){
      const ax=Math.abs(x-v.x),az=Math.abs(z-v.z);
      if(y===5&&(ax===2||az===2))chunkPut(x,y,z,'cobble');
      if(y===5&&ax<2&&az<2)chunkPut(x,y,z,'water');
      if(y>=6&&y<=8&&ax===2&&az===2)chunkPut(x,y,z,'wood');
      if(y===9&&ax<=2&&az<=2)chunkPut(x,y,z,'planks');
    }
  }
}
function generatedTreeAt(ax,az){
  if(inLegacy(ax,az)||inVillage(ax,az)||lakeDistance(ax,az)<10)return false;
  if(Math.abs(ax)>=HALF-4||Math.abs(az)>=HALF-4)return false;
  const b=biomeAt(ax,az),h=terrainHeight(ax,az);
  if(b==='wueste'||b==='see'||h>20)return false;
  return pixelHash(ax,az,40) > (b==='nadelwald'?.27:.48);
}
function decorateChunkTree(ax,az,xmin,xmax,zmin,zmax){
  if(!generatedTreeAt(ax,az))return;
  const h=terrainHeight(ax,az),conifer=biomeAt(ax,az)==='nadelwald';
  const high=conifer?7:5;
  function setIfInside(x,y,z,type){
    if(x<xmin||x>xmax||z<zmin||z>zmax||inLegacy(x,z))return;
    if(y<terrainHeight(x,z))return;
    if(!get(x,y,z))put(x,y,z,type);
  }
  for(let dy=0;dy<high;dy++)setIfInside(ax,h+dy,az,'wood');
  for(let dy=2;dy<high+2;dy++){
    const radius=conifer?(dy<=4?2:dy<=6?1:0):dy>=high?1:2;
    for(let dx=-radius;dx<=radius;dx++)for(let dz=-radius;dz<=radius;dz++){
      if(radius===2&&Math.abs(dx)===2&&Math.abs(dz)===2)continue;
      setIfInside(ax+dx,h+dy,az+dz,'leaves');
    }
  }
}
function isLegacyChunk(cx,cz){return cx>=-2&&cx<=1&&cz>=-2&&cz<=1;}
function generateChunkData(cx,cz){
  if(isLegacyChunk(cx,cz)||generatedChunks.has(chunkKey(cx,cz)))return;
  const xmin=cx*CHUNK,xmax=xmin+CHUNK-1,zmin=cz*CHUNK,zmax=zmin+CHUNK-1;
  for(let x=xmin;x<=xmax;x++)for(let z=zmin;z<=zmax;z++){
    const h=terrainHeight(x,z),biome=biomeAt(x,z);
    for(let y=0;y<h;y++){
      let type=y===h-1?'grass':y>=h-4?'dirt':'stone';
      if(biome==='wueste'||biome==='see')type=y>=h-3?'sand':'stone';
      if(biome==='berge'&&y>=h-3)type='stone';
      if(biome==='dorf'&&y===h-1)type='grass';
      put(x,y,z,type);
    }
    if(lakeDistance(x,z)<0&&h<=WATER_LEVEL){
      for(let y=h;y<=WATER_LEVEL;y++)put(x,y,z,'water');
    }
  }
  // Draw only the parts of neighboring trees that belong to this chunk.
  for(let gx=Math.floor((xmin-5)/8)*8;gx<=xmax+5;gx+=8){
    for(let gz=Math.floor((zmin-5)/8)*8;gz<=zmax+5;gz+=8){
      const ax=gx+Math.floor(pixelHash(gx,gz,51)*3)-1;
      const az=gz+Math.floor(pixelHash(gx,gz,52)*3)-1;
      decorateChunkTree(ax,az,xmin,xmax,zmin,zmax);
    }
  }
  // Structures are assembled by world coordinates, so walls line up across chunks.
  for(const village of VILLAGES){
    if(village.x<xmin-20||village.x>xmax+20||village.z<zmin-20||village.z>zmax+20)continue;
    for(let x=xmin;x<=xmax;x++)for(let z=zmin;z<=zmax;z++){
      if(Math.hypot(x-village.x,z-village.z)>20)continue;
      for(let y=3;y<=13;y++)villageBlocks(x,z,y,put);
    }
  }
  // Persist the player's builds on top of deterministic terrain.
  for(const edit of edits.values()){
    const [x,y,z,type]=edit;
    if(x>=xmin&&x<=xmax&&z>=zmin&&z<=zmax)put(x,y,z,type);
  }
  generatedChunks.add(chunkKey(cx,cz));
}
function disposeChunkMesh(id){
  for(const mesh of chunkMeshes.get(id)||[]){scene.remove(mesh);mesh.dispose();}
  chunkMeshes.delete(id);
}
function unloadChunkData(cx,cz){
  if(isLegacyChunk(cx,cz))return;
  const id=chunkKey(cx,cz);
  if(!generatedChunks.delete(id))return;
  for(let x=cx*CHUNK;x<(cx+1)*CHUNK;x++)for(let z=cz*CHUNK;z<(cz+1)*CHUNK;z++){
    for(let y=0;y<=MAX_Y+7;y++)blocks.delete(key(x,y,z));
  }
}
function updateWorldStream(force=false){
  const cx=Math.floor(player.x/CHUNK),cz=Math.floor(player.z/CHUNK);
  const id=chunkKey(cx,cz);
  if(!force&&id===lastStreamCenter)return;
  lastStreamCenter=id;
  const desired=new Set();
  // Generate data in a one-chunk halo to avoid incorrect open edges.
  for(let dx=-STREAM_RADIUS-1;dx<=STREAM_RADIUS+1;dx++)for(let dz=-STREAM_RADIUS-1;dz<=STREAM_RADIUS+1;dz++){
    const x=cx+dx,z=cz+dz;
    if(Math.abs(x)>=chunksPerSide||Math.abs(z)>=chunksPerSide)continue;
    generateChunkData(x,z);
  }
  for(let dx=-STREAM_RADIUS;dx<=STREAM_RADIUS;dx++)for(let dz=-STREAM_RADIUS;dz<=STREAM_RADIUS;dz++){
    const x=cx+dx,z=cz+dz;
    if(Math.abs(x)>=chunksPerSide||Math.abs(z)>=chunksPerSide)continue;
    const key=chunkKey(x,z);desired.add(key);
    if(!chunkMeshes.has(key))rebuildChunk(x,z);
  }
  for(const id of [...chunkMeshes.keys()])if(!desired.has(id))disposeChunkMesh(id);
  for(const id of [...generatedChunks]){
    const [x,z]=id.split(',').map(Number);
    if(Math.max(Math.abs(cx-x),Math.abs(cz-z))>STREAM_RADIUS+1)unloadChunkData(x,z);
  }
}
function tree(x,z,tall=false){
  const h=terrainHeight(x,z);
  const trunk=tall?5:4;
  for(let y=h;y<h+trunk;y++)put(x,y,z,'wood');
  if(tall){
    // Spruce-like tree with a triangular crown, built from familiar leaves.
    for(let dy=1;dy<=6;dy++){
      const radius=dy<=2?2:dy<=4?1:0;
      for(let dx=-radius;dx<=radius;dx++)for(let dz=-radius;dz<=radius;dz++){
        if(Math.abs(dx)===2&&Math.abs(dz)===2)continue;
        const xx=x+dx,zz=z+dz,yy=h+dy+1;
        if(xx>=-LEGACY_HALF&&xx<LEGACY_HALF&&zz>=-LEGACY_HALF&&zz<LEGACY_HALF&&!get(xx,yy,zz))put(xx,yy,zz,'leaves');
      }
    }
  }else{
    for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++)for(let dy=2;dy<=4;dy++){
      if(Math.abs(dx)===2&&Math.abs(dz)===2)continue;
      if(dy===4&&Math.abs(dx)+Math.abs(dz)>2)continue;
      const xx=x+dx,yy=h+dy,zz=z+dz;
      if(xx>=-LEGACY_HALF&&xx<LEGACY_HALF&&zz>=-LEGACY_HALF&&zz<LEGACY_HALF&&!get(xx,yy,zz))put(xx,yy,zz,'leaves');
    }
  }
}
function baseWorld(){
  blocks.clear();generatedChunks.clear();
  for(let x=-LEGACY_HALF;x<LEGACY_HALF;x++)for(let z=-LEGACY_HALF;z<LEGACY_HALF;z++){
    const h=legacyTerrainHeight(x,z),biome=legacyBiomeAt(x,z);
    for(let y=0;y<h;y++){
      let type=y===h-1?'grass':y>=h-3?'dirt':'stone';
      if(!oldArea(x,z)){
        if(biome==='sand')type=y>=h-3?'sand':'stone';
        else if(biome==='fels'&&h>=9)type=y>=h-2?'stone':'stone';
        else if(biome==='wald'&&y===h-1&&pixelHash(x,z,6)>.84)type='dirt';
      }
      put(x,y,z,type);
    }
  }
  // EXACT V2 tree locations and shape in the old area.
  const trees=[[-9,-9],[-5,-4],[4,-8],[9,-7],[-10,5],[-4,10],[7,7],[10,2],[-10,-1],[3,11],[-15,-13],[-12,15],[14,-12],[15,9],[-16,3],[5,15]];
  for(const [x,z] of trees)tree(x,z,false);
  // Outside the old world, deterministic woodland and pine trees.
  for(let x=-29;x<=29;x+=5)for(let z=-29;z<=29;z+=5){
    const tx=x+Math.floor(pixelHash(x,z,11)*3)-1;
    const tz=z+Math.floor(pixelHash(x,z,12)*3)-1;
    if(oldArea(tx,tz)||tx>=OLD_MIN-3&&tx<=OLD_MAX+3&&tz>=OLD_MIN-3&&tz<=OLD_MAX+3)continue;
    if(tx>18&&tz>=-13&&tz<=1)continue; // Keep cave path clear.
    if(biomeAt(tx,tz)==='sand'||(biomeAt(tx,tz)==='fels'&&terrainHeight(tx,tz)>10))continue;
    if(pixelHash(x,z,13)>.48)tree(tx,tz,pixelHash(x,z,14)>.52);
  }
  // Carve a walk-in tunnel through the eastern mountain. This only changes V3 land.
  for(let x=20;x<=30;x++){
    const width=x>=27?2:1;
    for(let z=-6-width;z<=-6+width;z++)for(let y=5;y<=8;y++)put(x,y,z,null);
  }
  // Small secret chamber at the end of the cave, with a smooth-ish block silhouette.
  for(let x=27;x<=31;x++)for(let z=-10;z<=-2;z++)for(let y=5;y<=11;y++){
    const d=((x-29)/3)**2+((z+6)/4.2)**2+((y-8)/3.6)**2;
    if(d<=1)put(x,y,z,null);
  }
}
function loadEdits(){
  try{
    const arr=JSON.parse(localStorage.getItem(KEY)||'[]');
    if(!Array.isArray(arr))return;
    for(const item of arr){
      if(!Array.isArray(item)||item.length!==4)continue;
      const [x,y,z,type]=item;
      if(![x,y,z].every(Number.isInteger)||x< -HALF||x>=HALF||z< -HALF||z>=HALF||y<0||y>MAX_Y)continue;
      if(type!==null&&!BLOCK_TYPES.includes(type))continue;
      if(inLegacy(x,z))put(x,y,z,type);edits.set(key(x,y,z),item);
    }
  }catch(e){console.warn('Spielstand konnte nicht geladen werden',e);}
}
function saveEdits(){
  try{localStorage.setItem(KEY,JSON.stringify([...edits.values()]));}
  catch(e){toast('Speichern ist auf diesem Gerät nicht möglich');}
}
// Chunked instanced rendering avoids reconstructing the entire world after each tap.
const dummy=new THREE.Object3D();
const chunkKey=(cx,cz)=>`${cx},${cz}`;
function visible(x,y,z){
  return !get(x+1,y,z)||!get(x-1,y,z)||!get(x,y+1,z)||!get(x,y-1,z)||!get(x,y,z+1)||!get(x,y,z-1);
}
function rebuildChunk(cx,cz){
  if(cx<-HALF/CHUNK||cx>=HALF/CHUNK||cz<-HALF/CHUNK||cz>=HALF/CHUNK)return;
  const id=chunkKey(cx,cz);
  disposeChunkMesh(id);
  const byType=Object.fromEntries(BLOCK_TYPES.map(t=>[t,[]]));
  for(let x=cx*CHUNK;x<(cx+1)*CHUNK;x++)for(let z=cz*CHUNK;z<(cz+1)*CHUNK;z++){
    for(let y=0;y<=MAX_Y+8;y++){
      const type=get(x,y,z);
      if(type&&visible(x,y,z))byType[type].push([x,y,z]);
    }
  }
  const chunk=[];
  for(const type of BLOCK_TYPES){
    const positions=byType[type];if(!positions.length)continue;
    const mesh=new THREE.InstancedMesh(blockGeo,materialByType[type],positions.length);
    mesh.userData.positions=positions;
    for(let i=0;i<positions.length;i++){
      const [x,y,z]=positions[i];
      dummy.position.set(x+.5,y+.5,z+.5);
      dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);dummy.updateMatrix();
      mesh.setMatrixAt(i,dummy.matrix);
    }
    if(type==='water'||type==='glass')mesh.renderOrder=2;
    mesh.instanceMatrix.needsUpdate=true;
    // Keep frustum culling enabled for good iPhone performance.
    mesh.computeBoundingSphere();
    scene.add(mesh);chunk.push(mesh);
  }
  chunkMeshes.set(id,chunk);
}
function rebuild(){
  for(const id of [...chunkMeshes.keys()])disposeChunkMesh(id);
  for(const id of [...generatedChunks]){const [cx,cz]=id.split(',').map(Number);unloadChunkData(cx,cz);}
  lastStreamCenter='';updateWorldStream(true);
}
function rebuildAround(x,z){
  const cx=Math.floor(x/CHUNK),cz=Math.floor(z/CHUNK);
  if(chunkMeshes.has(chunkKey(cx,cz)))rebuildChunk(cx,cz);
  const rx=((x%CHUNK)+CHUNK)%CHUNK,rz=((z%CHUNK)+CHUNK)%CHUNK;
  if(rx===0&&chunkMeshes.has(chunkKey(cx-1,cz)))rebuildChunk(cx-1,cz);
  if(rx===CHUNK-1&&chunkMeshes.has(chunkKey(cx+1,cz)))rebuildChunk(cx+1,cz);
  if(rz===0&&chunkMeshes.has(chunkKey(cx,cz-1)))rebuildChunk(cx,cz-1);
  if(rz===CHUNK-1&&chunkMeshes.has(chunkKey(cx,cz+1)))rebuildChunk(cx,cz+1);
}
function nearbyMeshes(){
  const cx=Math.floor(camera.position.x/CHUNK),cz=Math.floor(camera.position.z/CHUNK);
  const near=[];
  for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)near.push(...(chunkMeshes.get(chunkKey(cx+dx,cz+dz))||[]));
  return near;
}

// Background clouds (not buildable, not included in raycasting).
const cloudMat=new THREE.MeshBasicMaterial({color:'#f9fff7',transparent:true,opacity:.84,depthWrite:false});
const cloudGeo=new THREE.BoxGeometry(1,1,1);
const clouds=new THREE.Group();scene.add(clouds);
for(let i=0;i<12;i++){
  const group=new THREE.Group();group.position.set(-52+i*10.5,29+(i%3)*3,-40-(i%2)*9);
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
  for(let ix=minX;ix<=maxX;ix++)for(let iz=minZ;iz<=maxZ;iz++)for(let iy=minY;iy<=maxY;iy++)if(get(ix,iy,iz)&&get(ix,iy,iz)!=='water')return true;
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
  updateWorldStream();
  const keyboardX=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));
  const keyboardF=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'));
  let x=keyboardX+stick.x,f=keyboardF-stick.y;
  const magnitude=Math.hypot(x,f);if(magnitude>1){x/=magnitude;f/=magnitude;}
  const speed=(flying?6.6:4.75)*dt;
  const dx=(Math.cos(yaw)*x-Math.sin(yaw)*f)*speed;
  const dz=(-Math.sin(yaw)*x-Math.cos(yaw)*f)*speed;
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.12));
  for(let i=0;i<steps;i++){horizontal('x',dx/steps);horizontal('z',dz/steps);}
  if(flying){
    const ascend=jumpHeld||keys.has('Space')||keys.has('KeyE');
    const descend=descendHeld||keys.has('ShiftLeft')||keys.has('ShiftRight')||keys.has('KeyQ');
    const direction=Number(ascend)-Number(descend);
    if(direction){
      const goal=Math.max(.5,Math.min(55,player.y+direction*6.2*dt));
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

const raycaster=new THREE.Raycaster();raycaster.far=5.6;
const highlight=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.015,1.015,1.015)),new THREE.LineBasicMaterial({color:'#fffce2',depthTest:false,transparent:true,opacity:.96}));
highlight.visible=false;highlight.renderOrder=15;scene.add(highlight);
let pointed=null;
function updateTarget(){
  raycaster.setFromCamera(new THREE.Vector2(0,0),camera);
  const hits=raycaster.intersectObjects(nearbyMeshes(),false);
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
  if(x< -HALF||x>=HALF||z< -HALF||z>=HALF||y<0||y>MAX_Y){toast('Hier endet deine kleine Welt');return;}
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
  saveEdits();rebuildAround(x,z);updateTarget();
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
  saveEdits();rebuildAround(x,z);updateTarget();syncUndo();
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
  const data={format:'blockwelt',version:5,savedAt:new Date().toISOString(),edits:[...edits.values()]};
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
    if(data?.format!=='blockwelt'||![2,3,5].includes(data.version)||!Array.isArray(data.edits)||data.edits.length>20000)throw new Error('format');
    const incoming=new Map();
    for(const edit of data.edits){
      if(!Array.isArray(edit)||edit.length!==4)throw new Error('entry');
      const [x,y,z,type]=edit;
      if(![x,y,z].every(Number.isInteger)||x< -HALF||x>=HALF||z< -HALF||z>=HALF||y<0||y>MAX_Y||(type!==null&&!BLOCK_TYPES.includes(type)))throw new Error('entry');
      incoming.set(key(x,y,z),[x,y,z,type]);
    }
    if(!confirm('Die bisherige Welt durch diese Sicherung ersetzen?'))return;
    baseWorld();edits.clear();undoStack.length=0;
    for(const [k,edit] of incoming){const [x,y,z,type]=edit;if(inLegacy(x,z))put(x,y,z,type);edits.set(k,edit);}
    saveEdits();rebuild();respawn();syncUndo();
    toast('Deine gesicherte Welt wurde geladen!');
  }catch(e){console.warn('Ungültige Blockwelt-Sicherung',e);toast('Diese Sicherung kann nicht geladen werden');}
}
function toast(message){
  $('toast').textContent=message;$('toast').classList.add('visible');
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),1650);
}


// Independent voxel characters. No Minecraft textures, models or game files.
const creatures=[];
const npcRay=new THREE.Vector3();
const npcBlue=new THREE.MeshLambertMaterial({color:'#345a86'});
const npcSkin=new THREE.MeshLambertMaterial({color:'#e0af85'});
const npcDark=new THREE.MeshLambertMaterial({color:'#213c32'});
const npcWhite=new THREE.MeshLambertMaterial({color:'#f5eacd'});
const villagerRobes=['#a97148','#577cba','#8d6596','#668c54','#b7884f'];
function part(parent,w,h,d,material,x,y,z){
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
  mesh.position.set(x,y,z);parent.add(mesh);return mesh;
}
function makeCreature(kind,x,z,number,homeX=x,homeZ=z){
  const group=new THREE.Group();
  const robe=new THREE.MeshLambertMaterial({color:villagerRobes[number%villagerRobes.length]});
  let leftLeg,rightLeg,leftArm,rightArm,head;
  if(kind==='villager'){
    part(group,.7,.86,.46,robe,0,1.02,0);
    part(group,.72,.22,.51,robe,0,.55,0);
    head=part(group,.74,.69,.65,npcSkin,0,1.78,0);
    part(group,.13,.17,.16,npcSkin,0,1.72,-.41); // friendly little nose
    part(group,.12,.11,.05,npcDark,-.19,1.86,-.343);
    part(group,.12,.11,.05,npcDark,.19,1.86,-.343);
    part(group,.42,.11,.08,npcDark,0,2.15,.04); // cap trim
    part(group,.78,.12,.75,robe,0,2.24,.02);
    leftLeg=part(group,.25,.56,.32,npcDark,-.19,.31,0);
    rightLeg=part(group,.25,.56,.32,npcDark,.19,.31,0);
    leftArm=part(group,.19,.68,.25,robe,-.46,1.08,0);
    rightArm=part(group,.19,.68,.25,robe,.46,1.08,0);
  }else{
    const skin=new THREE.MeshLambertMaterial({color:'#79b968'});
    const darkGreen=new THREE.MeshLambertMaterial({color:'#316b56'});
    const lively=new THREE.MeshLambertMaterial({color:'#9ad87a'});
    part(group,.78,1.13,.62,skin,0,.91,0);
    head=part(group,.87,.76,.73,lively,0,1.85,0);
    part(group,.2,.18,.06,npcDark,-.21,1.91,-.397);
    part(group,.2,.18,.06,npcDark,.21,1.91,-.397);
    part(group,.27,.14,.07,darkGreen,0,1.68,-.40);
    part(group,.15,.16,.08,npcDark,0,1.60,-.41);
    leftLeg=part(group,.24,.43,.26,darkGreen,-.23,.24,-.16);
    rightLeg=part(group,.24,.43,.26,darkGreen,.23,.24,-.16);
    leftArm=part(group,.24,.43,.26,skin,-.23,.24,.17);
    rightArm=part(group,.24,.43,.26,skin,.23,.24,.17);
  }
  scene.add(group);
  const entity={kind,group,head,leftLeg,rightLeg,leftArm,rightArm,x,z,homeX,homeZ,angle:number*2.32,turnTimer:number*.9,walkTimer:number,number};
  creatures.push(entity);
}
// A gentle greeter near the starting area and villages with roaming residents.
makeCreature('villager',-3,8,0,-3,8);
for(const [vi,v] of VILLAGES.entries()){
  for(let i=0;i<v.people;i++){
    const angle=i*Math.PI*2/v.people;
    makeCreature('villager',v.x+Math.cos(angle)*5,v.z+Math.sin(angle)*5,i+1+vi*7,v.x,v.z);
  }
  for(let i=0;i<2;i++)makeCreature('sneaker',v.x+13+i*3,v.z+13-i*3,i+vi*2,v.x+13,v.z+12);
}
makeCreature('sneaker',11,14,5,11,14);
makeCreature('sneaker',-19,6,6,-19,6);
const npcTargetBtn=$('npcBtn');
let selectedNpc=null;
function updateCreatures(dt){
  const t=performance.now()*.001;
  selectedNpc=null;
  let best=.09;
  for(const npc of creatures){
    const dist=Math.hypot(npc.x-player.x,npc.z-player.z);
    const active=showCreatures&&dist<(MOBILE?46:65);
    npc.group.visible=active;
    if(!active)continue;
    npc.turnTimer-=dt;
    if(npc.turnTimer<=0){
      npc.angle+=Math.sin(t*.45+npc.number*13)*2.2;
      npc.turnTimer=1.1+pixelHash(npc.number,Math.floor(t/2),83)*3.2;
    }
    const speed=npc.kind==='villager'?.48:.33;
    const nx=npc.x+Math.cos(npc.angle)*speed*dt;
    const nz=npc.z+Math.sin(npc.angle)*speed*dt;
    const wanderLimit=npc.kind==='villager'?8:7;
    const nearHome=Math.hypot(nx-npc.homeX,nz-npc.homeZ)<wanderLimit;
    if(nearHome&&nx>-HALF+2&&nx<HALF-2&&nz>-HALF+2&&nz<HALF-2&&
       !isInsideHouse(nx,nz)&&lakeDistance(nx,nz)>0&&Math.abs(terrainHeight(nx,nz)-terrainHeight(npc.x,npc.z))<2){
      npc.x=nx;npc.z=nz;
    }else npc.angle+=2.3*dt;
    const ground=terrainHeight(Math.round(npc.x),Math.round(npc.z));
    npc.group.position.set(npc.x,ground+Math.sin(t*2.3+npc.number)*.025,npc.z);
    npc.group.rotation.y=-npc.angle-Math.PI/2;
    npc.walkTimer+=dt*speed*11;
    const sway=Math.sin(npc.walkTimer)*.27;
    npc.leftLeg.rotation.x=sway;npc.rightLeg.rotation.x=-sway;
    npc.leftArm.rotation.x=-sway*.65;npc.rightArm.rotation.x=sway*.65;
    npc.head.rotation.y=Math.sin(t*.8+npc.number)*.06;
    if(dist<6){
      npcRay.set(npc.x,npc.group.position.y+1.45,npc.z).project(camera);
      const screenDist=Math.hypot(npcRay.x,npcRay.y);
      if(npcRay.z>=-1&&npcRay.z<=1&&screenDist<best){best=screenDist;selectedNpc=npc;}
    }
  }
  npcTargetBtn.classList.toggle('visible',!!selectedNpc&&gameRunning);
  npcTargetBtn.textContent=selectedNpc?.kind==='villager'?'👋 Hallo sagen':'🌿 Schleicher ansehen';
}
function isInsideHouse(x,z){
  for(const v of VILLAGES)for(const [ox,oz] of HOUSE_OFFSETS){
    if(Math.abs(x-(v.x+ox))<4.5&&Math.abs(z-(v.z+oz))<4.5)return true;
  }
  return false;
}
npcTargetBtn.addEventListener('click',()=>{
  if(!gameRunning||!selectedNpc)return;
  toast(selectedNpc.kind==='villager'?'Hallo! Schön, dass du unser Dorf besuchst!':'Der grüne Schleicher ist ganz friedlich!');
});
function visitVillage(){
  const v=VILLAGES[0];
  player.x=v.x+4;player.z=v.z;player.y=terrainHeight(player.x,player.z)+.12;
  yaw=Math.PI/2;pitch=-.13;
  player.vy=0;player.grounded=false;updateWorldStream(true);updateCamera();
  toast('Willkommen im Sonnen-Dorf!');
}
$('villageBtn').addEventListener('click',visitVillage);
$('mobsBtn').addEventListener('click',()=>{
  showCreatures=!showCreatures;
  $('mobsBtn').textContent=showCreatures?'✓ Bewohner und Schleicher: an':'○ Bewohner und Schleicher: aus';
  toast(showCreatures?'Die Welt ist lebendig!':'Die Figuren machen eine Pause.');
});
$('dayBtn').addEventListener('click',()=>{
  dayMode=!dayMode;
  scene.background.set(dayMode?'#a9d8ee':'#152a4d');
  scene.fog.color.set(dayMode?'#a9d8ee':'#152a4d');
  sunlight.intensity=dayMode?2.25:.38;
  $('dayBtn').textContent=dayMode?'☀ Tagmodus':'☾ Nachtmodus';
  $('nightStars').classList.toggle('visible',!dayMode);
});

const keys=new Set();
window.addEventListener('keydown',e=>{
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
  keys.add(e.code);
  if(e.code==='Space'&&!e.repeat)jump();
  if(/^Digit[1-9]$/.test(e.code))selectBlock(BLOCK_TYPES[Number(e.code.slice(-1))-1]);
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
$('homeBtn').addEventListener('click',()=>{respawn();updateCamera();toast('Zurück bei deiner Startwiese!');});
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

// Small location indicator: no map, no extra complex menus for young players.
const regions={dorf:'🏘️ Dorf',see:'🌊 See',wueste:'🏜️ Sandland',berge:'🏔️ Hochland',nadelwald:'🌲 Tannenwald',wiese:'🌿 Startwiese',wald:'🌲 Waldland',sand:'🏜️ Sandtal',fels:'⛰️ Felsenberg'};
let regionName='';
function updateRegion(){
  let b=biomeAt(Math.floor(player.x),Math.floor(player.z));
  if(b==='fels'&&player.x>23&&player.z>=-11&&player.z<=-1&&player.y<11)b='hoehle';
  const name=b==='hoehle'?'🪨 Berghöhle':regions[b];
  if(name!==regionName){regionName=name;$('regionLabel').textContent=name;}
}
function resize(){
  const w=window.innerWidth,h=window.innerHeight;
  camera.aspect=w/Math.max(1,h);camera.updateProjectionMatrix();renderer.setSize(w,h,false);
}
window.addEventListener('resize',resize);
window.addEventListener('orientationchange',()=>setTimeout(resize,180));
baseWorld();loadEdits();rebuild();syncUndo();updateCamera();resize();
$('loading').remove();
let lastTime=performance.now(),lastTarget=0;
function animate(now){
  requestAnimationFrame(animate);
  const dt=Math.min(.04,Math.max(0,(now-lastTime)/1000));lastTime=now;
  updateMovement(dt);updateCamera();updateRegion();updateCreatures(dt);
  if(now-lastTarget>35){updateTarget();lastTarget=now;}
  clouds.position.x=Math.sin(now*.00007)*1.4;
  renderer.render(scene,camera);
}
requestAnimationFrame(animate);
