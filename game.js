import {buildCastleArchitecture,dressDoorway,interiorLampSites,wingWindows,towerWindows,buildLowerCellars,cellarLamps} from './nachtrabe.js?v=113';
// BLOCKWELT V113 — Schloss Nachtrabe – Wildnis.
// V24 ist die feste Grundlage. Keine Änderungen an Terrain-, Speicher- oder Werkstatt-IDs.
// Südliche Werkstätten öffnen sich jetzt zum Dorfplatz, mit sicheren
// Wegen, individuell schaltbaren Fassadenzeichen und freiem Brunnenblick.
// Die Geländeform und Spieler-Speicherschlüssel bleiben unverändert.
// Keine Minecraft-Dateien oder Texturen; 3D-Technik: Three.js (MIT).
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.js';

const $ = (id) => document.getElementById(id);
const gameEl = $('game');
const BLOCK_TYPES = ['grass','dirt','stone','wood','leaves','sand','planks','bricks','cobble','glass','gold','water','path','snow','blossom','lantern','netherBrick','netherDeep','netherTrim','netherGold','lavaGlow'];
const LABELS = {grass:'Gras',dirt:'Erde',stone:'Stein',wood:'Holz',leaves:'Blätter',sand:'Sand',planks:'Bretter',bricks:'Ziegel',cobble:'Pflaster',glass:'Glas',gold:'Gold',water:'Wasser',path:'Weg',snow:'Schnee',blossom:'Blüten',lantern:'Laterne',netherBrick:'Netherziegel',netherDeep:'Dunkelstein',netherTrim:'Nether-Kante',netherGold:'Netherwappen',lavaGlow:'Glutstein'};
const HALF = 96; // 192 × 192 Felder; Chunk-Streaming hält den iPhone-Speicher klein.
const LEGACY_HALF = 32; // Der komplette alte V3-Weltausschnitt bleibt erhalten.
const MOBILE = matchMedia('(pointer: coarse)').matches || innerWidth < 740;
const STORAGE_VIEW = 'blockwelt-view-v7';
const STORAGE_DETAIL = 'blockwelt-grafik-v9';
let graphicMode='schoen';
try { graphicMode=localStorage.getItem(STORAGE_DETAIL)==='flüssig'?'flüssig':'schoen'; }catch(_){}
let farView = true; // Fernlandschaft ist ein leichtes LOD-Modell, KEIN zusätzlicher vollständiger Chunk.
try { farView = localStorage.getItem(STORAGE_VIEW) !== 'normal'; } catch (_) {}
const STREAM_RADIUS = MOBILE ? 2 : 3; // iPhone: maximal 5×5 aktive Chunks.
const WATER_LEVEL = 5;
const VILLAGES = [
  {name:'Sonnen-Dorf',x:47,z:9,people:5},
  {name:'Birken-Dorf',x:-53,z:-48,people:4}
];
const LAKES = [{x:-61,z:41,r:14},{x:63,z:-49,r:12}];
const OLD_MIN = -18, OLD_MAX = 17, CHUNK = 16, MAX_Y = 70;
// Separate world slots: the original adventure key MUST stay exactly unchanged.
const ADVENTURE_KEY = 'blockwelt-kleine-baumeister-v1';
const MEADOW_KEY = 'blockwelt-grosse-wiese-v26';
const activeWorld = 'wiese';
const isMeadow = () => true;
const currentSaveKey = () => isMeadow() ? MEADOW_KEY : ADVENTURE_KEY;
const BUNKER_FLOOR=-6;
const MEADOW_HEIGHT = 5; // Grass top y=4, feet y=5: a flat, stable building field.
// V27 — EIGENSTÄNDIGE NETHERFESTUNG AUF DER GROSSEN WIESE.
// Der Bauplan besteht nur aus echten Minecraft-ähnlichen Voxeln. Keine
// gerenderten Kulissen, keine Eingriffe in die unveränderte Abenteuerwelt.
const NETHER_BOUNDS={minX:-56,maxX:56,minZ:-86,maxZ:-11};
const doorSites=[];
const stairTreads=new Map();
let netherChunkPlan=null;
let netherPlanVoxels=null;
let netherPlanCount=0;
function makeNetherPlan(){
  if(netherChunkPlan)return netherChunkPlan;
  const vox=new Map();
  const N='netherBrick',D='netherDeep',T='netherTrim',G='netherGold',L='lavaGlow';
  const solid=(x,y,z,type=N)=>{
    if(!Number.isInteger(x)||!Number.isInteger(y)||!Number.isInteger(z)||
       x< -HALF||x>=HALF||z< -HALF||z>=HALF||y<BUNKER_FLOOR||y>MAX_Y)return;
    vox.set(key(x,y,z),type);
  };
  const empty=(x,y,z)=>vox.delete(key(x,y,z));
  const box=(xa,xb,ya,yb,za,zb,type=N)=>{
    for(let x=xa;x<=xb;x++)for(let z=za;z<=zb;z++)for(let y=ya;y<=yb;y++)solid(x,y,z,type);
  };
  const deck=(xa,xb,y,za,zb,type=N)=>box(xa,xb,y,y,za,zb,type);
  const lamp=(x,y,z)=>{
    solid(x,y-1,z,D);solid(x,y,z,'lantern');
  };
  const routes=[];
  buildCastleArchitecture({box,solid,deck,empty,routes,doors:doorSites});
  for(const path of routes)for(const [x,y,z] of path)solid(x,y,z,T);
  for(const path of routes)for(const [x,y,z] of path)
    for(let dy=1;dy<=3;dy++)empty(x,y+dy,z);
  deck(-2,2,4,-34,15,'cobble');
  // Bunker tucked beneath the meadow east of the approach.
  box(13,25,-6,4,-24,-10,N);
  box(14,24,-5,-1,-23,-11,null);
  box(18,20,-5,-2,-10,-10,null);
  deck(18,20,-6,-10,-10,T);
  for(let step=0;step<10;step++){
    const z=step,y=3-step;
    box(17,21,-6,y+3,-z,-z,N);
    box(18,20,y+1,Math.max(4,y+3),-z,-z,null);
    if(step>=4)deck(17,21,4,-z,-z,'grass');
    solid(19,y,-z,'lavaGlow');
  }
  for(const z of [-13,-18,-22])deck(14,24,-1,z,z,'wood');
  buildLowerCellars({box,deck,solid});

  // A half-height tread bridges each pair of consecutive full-block steps.
  for(let x=18;x<=20;x++)
    routes.push([...Array.from({length:10},(_,i)=>[x,-6+i,-9+i]),[x,4,1]]);
  for(const path of routes)for(let i=1;i<path.length;i++){
    const [x,y,z]=path[i-1], [nx,ny,nz]=path[i];
    if(ny!==y+1||Math.abs(nx-x)+Math.abs(nz-z)!==1)continue;
    if(!vox.get(key(x,y,z))||vox.get(key(x,y+1,z))||vox.get(key(x,y+2,z)))continue;
    stairTreads.set(key(x,y+1,z),{x,y:y+1,z,dx:nx-x,dz:nz-z,
      lower:vox.get(key(x,y,z)),upper:vox.get(key(nx,ny,nz))||'grass'});
  }
  // Finale Geometriedaten werden pro 16x16-Chunk gespeichert. Der Chunkgenerator
  // schreibt sie VOR den Spieleränderungen und überschreibt niemals den Save.
  netherPlanVoxels=vox;
  netherChunkPlan=new Map();
  for(const [k,type] of vox){
    const [x,y,z]=k.split(',').map(Number);
    const id=`${Math.floor(x/CHUNK)},${Math.floor(z/CHUNK)}`;
    if(!netherChunkPlan.has(id))netherChunkPlan.set(id,[]);
    netherChunkPlan.get(id).push([x,y,z,type]);
  }
  netherPlanCount=vox.size;
  return netherChunkPlan;
}
function addNetherChunk(cx,cz){
  for(const [x,y,z,type] of makeNetherPlan().get(chunkKey(cx,cz))||[])
    put(x,y,z,type);
}
function meadowSurfaceY(x,z){
  const base=MEADOW_HEIGHT;
  if(!isMeadow())return terrainHeight(x,z);
  // Nur für Spawn/Schnellreise; niemals ein Spielerbauwerk überschreiben.
  const sample=(cx,cz)=>{for(let y=MAX_Y;y>=MEADOW_HEIGHT;y--)if(get(cx,y,cz))return y+1;return base;};
  return sample(Math.floor(x),Math.floor(z));
}

const blocks = new Map();
const edits = new Map();
const chunkMeshes = new Map();
const decorativeMeshes = new Map();
const generatedChunks = new Set();
let lastStreamCenter = '';
const chunksPerSide = HALF / CHUNK;
const showCreatures = false;
const LIGHT_MODE_KEY='blockwelt-lichtstimmung-v101';
let lightMode=0;
try{
  const saved=Number(localStorage.getItem(LIGHT_MODE_KEY));
  if(Number.isInteger(saved)&&saved>=0&&saved<3)lightMode=saved;
}catch{}
let selectedType = 'grass';
let gameRunning = false;
let toastTimer = null;
const undoStack = [];
let flying = false;
let jumpHeld = false;
let descendHeld = false;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#a5daf8');
scene.fog = new THREE.Fog('#b1d9ed', MOBILE ? 62 : 70, MOBILE ? 170 : 190);
const camera = new THREE.PerspectiveCamera(74, 1, .06, MOBILE ? 165 : 195);
camera.rotation.order = 'YXZ';
const renderer = new THREE.WebGLRenderer({antialias:!MOBILE, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MOBILE ? (graphicMode==='schoen'?1.05:.8) : (graphicMode==='schoen'?1.65:1.3)));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.02;
renderer.setSize(window.innerWidth,window.innerHeight);
gameEl.appendChild(renderer.domElement);
const ambientSky = new THREE.HemisphereLight('#fff2e7','#556c50',1.42);
scene.add(ambientSky);
const sunlight = new THREE.DirectionalLight('#fff4d6',1.78);
sunlight.position.set(-44,68,-28);
scene.add(sunlight);
// Warm side fill provides inexpensive depth on mobile without costly shadow maps.
const rimLight=new THREE.DirectionalLight('#c3d8ff',.31);
rimLight.position.set(29,36,41);scene.add(rimLight);

// Make tiny pixel textures procedurally. Their palette and patterns are original.
function texture(type,face){
  // Handgezeichnete, deterministische Pixelmaterialien. Keine externen Spielgrafiken.
  const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;
  const ctx=canvas.getContext('2d');
  let seed=type.split('').reduce((a,c)=>Math.imul(a,31)+c.charCodeAt(0),17)+
    (face==='top'?14:face==='bottom'?78:47);
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const palettes={
    grass:['#5d9e42','#78b955','#82c160','#6cae49','#98cf70','#69a248'],
    dirt:['#79543a','#98704b','#ae8157','#876044','#be9565','#a17a57'],
    stone:['#77827f','#9ba8a2','#b2bab3','#88958f','#a8b1a8','#687772'],
    wood:['#875932','#a4703e','#d09958','#bd8349','#976132','#d5a86e'],
    leaves:['#306e39','#438a45','#599e50','#6ba75c','#478246','#82b668'],
    sand:['#d5bd81','#eed79b','#f4e3b2','#dfc890','#cdb37b','#edd7a6'],
    planks:['#996331','#b77c43','#d19b5d','#c68b4c','#d9a96a','#a56c36'],
    bricks:['#9b543e','#b36b50','#d0845f','#ba7357','#cd8b65','#a75e46'],
    cobble:['#637771','#85948b','#a4ada4','#71827a','#b5bdb2','#919f95'],
    glass:['#79c5da','#a3e5f0','#d8f8f4','#82d0d8','#c2edf4','#65b4cb'],
    gold:['#c68f2b','#e9ba49','#ffe18b','#f7d46a','#e0a938','#fff1a7'],
    water:['#297da8','#419ec6','#6dbcd8','#8dd6e7','#53afcf','#3b8fb6'],
    path:['#987b55','#baa079','#d1b58c','#ac8c65','#e1c59b','#c6aa80'],
    snow:['#e3eff2','#f8ffff','#c5dce6','#e5f5f8','#f0faff','#d4e5ed'],
    blossom:['#e49bbc','#f3b5d0','#ffe0e7','#d98eae','#f8c8da','#efafd0'],
    lantern:['#f4b642','#ffdc72','#ffe7a1','#df8f2f','#ffd66a','#fff0b0'],
    netherBrick:['#63404d','#794a58','#885764','#724654','#90606d','#5d3949'],
    netherDeep:['#353448','#413d55','#51506a','#3c3a50','#5a566d','#302e43'],
    netherTrim:['#a85b62','#ba6e6b','#c78078','#ab6266','#c27a71','#9a535e'],
    netherGold:['#e8a23d','#f7c65d','#ffd98b','#b86732','#ffde92','#c7863d'],
    lavaGlow:['#f76613','#ff9a1d','#ffd256','#e84f13','#ffe17c','#ff7219']
  };
  const pal=palettes[(type==='grass'&&face==='bottom')?'dirt':type];
  const pick=(a=pal)=>a[Math.floor(random()*a.length)];
  // 4-px-Tesserae statt grober, flacher Kacheln; echte Blockstruktur bleibt lesbar.
  for(let y=0;y<64;y+=4)for(let x=0;x<64;x+=4){
    let pp=pal;
    if(type==='grass'&&face==='side')pp=y<13?palettes.grass:palettes.dirt;
    if(type==='wood'&&face==='side')pp=x%13<3?[pal[0],pal[1],pal[2]]:pal;
    ctx.fillStyle=pick(pp);ctx.fillRect(x,y,4,4);
    if(random()>.79){ctx.fillStyle=pick(pp);ctx.fillRect(x+(random()>.5?2:0),y,2,2);}
  }
  function line(color,x,y,w,h){ctx.fillStyle=color;ctx.fillRect(x,y,w,h);}
  if(type==='grass'&&face==='side'){
    for(let x=0;x<64;x+=4){line('#568c38',x,10,4,2+Math.floor(random()*10));if(random()>.6)line('#8ac76c',x,10,2,2);}
    for(let i=0;i<45;i++){const x=Math.floor(random()*64/2)*2,y=22+Math.floor(random()*42/2)*2;line(random()>.5?'#65492e':'#b48a61',x,y,2,2);}
  }
  if(type==='grass'&&face==='top'){
    for(let i=0;i<42;i++){const x=Math.floor(random()*62/2)*2,y=Math.floor(random()*62/2)*2;
      line(random()>.5?'#4b903d':'#b1d974',x,y,2,4);}
  }
  if(type==='stone'||type==='cobble'){
    for(let i=0;i<10;i++){
      const x=Math.floor(random()*58/2)*2,y=Math.floor(random()*58/2)*2;
      line(random()>.5?'#586b69':'#d2d2c5',x,y,4+Math.floor(random()*4)*2,2);
      if(random()>.67)line('#697a76',x+2,y+2,2,4);
    }
  }
  if(type==='wood'&&face==='top'){
    for(let r=26;r>=6;r-=7){ctx.strokeStyle=r%2?'#845b30':'#6f4b2f';ctx.lineWidth=2;
      ctx.strokeRect(32-r,32-r,r*2,r*2);}
    line('#6c4b31',30,30,5,5);
  }
  if(type==='wood'&&face==='side'){
    for(let x=7;x<64;x+=13){line('#76502d',x,0,2,64);line('#d7a76f',x+3,0,2,64);}
  }
  if(type==='planks'){
    for(let y=0;y<64;y+=16){line('#684724',0,y,64,2);line('#e1b77d',0,y+2,64,2);
      const seam=(Math.floor(y/16)%2)*27+17;line('#80542d',seam,y+3,2,12);}
    for(let i=0;i<7;i++){const x=Math.floor(random()*60),y=5+Math.floor(random()*56);
      line('#986b38',x,y,4,2);}
  }
  if(type==='bricks'||type==='netherBrick'||type==='netherTrim'||type==='netherDeep'){
    for(let y=0;y<64;y+=13){const mortar=type==='bricks'?'#e2b79b':type==='netherDeep'?'#40384c':'#633641';
      line(mortar,0,y,64,type==='bricks'?3:2);
      const offset=(Math.floor(y/13)%2)*13;
      for(let x=offset;x<64;x+=26)line(mortar,x,y+2,2,11);
    }
  }
  // V31: Eigene, charakteristische Nether-Oberflächen statt bloßem Farbrauschen.
  // Läuft pro Material nur einmal beim Start, kostet keine zusätzlichen Meshes.
  if(type==='netherBrick'||type==='netherDeep'||type==='netherTrim'){
    const highlight=type==='netherTrim'?'#dd9a89':type==='netherDeep'?'#958399':'#b47a7a';
    for(let y=1;y<64;y+=13){
      ctx.fillStyle=highlight;ctx.fillRect(1,y+2,62,1);
      const offset=(Math.floor(y/13)%2)*13;
      for(let x=offset;x<64;x+=26)ctx.fillRect(x+2,y+4,1,7);
    }
    // Seltene feine Steinrisse: nicht flächig und nicht repetitiv.
    for(let j=0;j<5;j++){
      const x=4+Math.floor(random()*54),y=6+Math.floor(random()*51);
      line(type==='netherDeep'?'#443b51':'#683d49',x,y,2,6);
      line(highlight,x+2,y+4,4,1);
    }
  }
  if(face==='top'&&(type==='netherBrick'||type==='netherDeep'||type==='netherTrim')){
    for(let row=0;row<2;row++)for(let col=0;col<2;col++){
      const x=col*32,y=row*32;
      line(pal[(row*2+col+1)%pal.length],x,y,32,32);
      line(pal[0],x,y+30,32,2);line(pal[0],x+30,y,2,32);
      line(pal[4],x+2,y+2,27,1);line(pal[4],x+2,y+3,1,26);
      for(let i=0;i<10;i++)line(pick(),x+3+Math.floor(random()*24),y+4+Math.floor(random()*23),3,2);
    }
  }
  if(type==='netherGold'){
    // Pixelwappen / Flammenrune, sichtbar auf Tor, Sockeln und Turmwappen.
    line('#663024',6,6,52,52);
    line('#f5c569',10,10,44,44);
    line('#7b3540',14,14,36,36);
    line('#ffe08b',28,16,8,8);
    line('#ffad43',22,24,20,8);
    line('#ffe08b',18,32,28,6);
    line('#ffad43',25,38,14,8);
    line('#ffe08b',29,46,6,5);
  }
  if(type==='path'){
    for(let i=0;i<23;i++){const x=Math.floor(random()*60),y=Math.floor(random()*60);
      line(random()>.5?'#e9d5b2':'#877457',x,y,2+Math.floor(random()*3)*2,2);}
  }
  if(type==='sand')for(let i=0;i<35;i++){line(random()>.5?'#fff1c8':'#c9ad79',Math.floor(random()*32)*2,Math.floor(random()*32)*2,2,2);}
  if(type==='leaves'||type==='blossom'){
    for(let i=0;i<32;i++){
      const x=Math.floor(random()*15)*4,y=Math.floor(random()*15)*4;
      line(random()>.47?pal[2]:pal[0],x,y,4,4);
    }
  }
  if(type==='water'){
    for(let i=0;i<20;i++){
      const x=Math.floor(random()*29)*2,y=Math.floor(random()*30)*2;
      line(random()>.5?'#b6edee':'#317dab',x,y,4+Math.floor(random()*4)*2,2);
    }
  }
  if(type==='lavaGlow'){
    for(let i=0;i<70;i++){let x=Math.floor(random()*31)*2,y=Math.floor(random()*31)*2;line(random()>.47?'#fff49b':'#df3e10',x,y,2+Math.floor(random()*3)*2,2);}
  }
  if(type==='glass'){
    line('#e9ffff',4,5,4,46);line('#e9ffff',10,10,2,23);line('#4c9cbe',0,58,64,3);
  }
  const map=new THREE.CanvasTexture(canvas);
  map.colorSpace=THREE.SRGBColorSpace;map.magFilter=THREE.NearestFilter;
  map.minFilter=THREE.NearestMipmapNearestFilter;
  map.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),MOBILE?4:8);
  return map;
}
// Each texture pair describes the same surface. Relief changes lighting only;
// the block grid still owns collision, selection and saved edits.
const reliefColors={
  netherBrick:[114,108,96],netherDeep:[71,77,82],netherTrim:[139,127,108],
  grass:[65,81,49],cobble:[109,105,99],stone:[111,113,111],planks:[105,76,51],wood:[91,65,44]
};
// World-space patina stays continuous across adjacent editable blocks.
function addSurfacePatina(material,stone){
  material.onBeforeCompile=shader=>{
    shader.vertexShader='varying vec3 surfacePosition;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`
      vec4 surfaceVertex=vec4(transformed,1.0);
      #ifdef USE_INSTANCING
        surfaceVertex=instanceMatrix*surfaceVertex;
      #endif
      surfacePosition=(modelMatrix*surfaceVertex).xyz;
      #include <project_vertex>
    `);
    shader.fragmentShader='varying vec3 surfacePosition;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
      #include <map_fragment>
      {
      vec3 p=surfacePosition;
      float blotch=sin(p.x*.37+p.z*.19+p.y*.14)*cos(p.z*.44-p.x*.13+p.y*.28);
      float fine=sin(p.x*2.3+p.y*.82)*sin(p.z*1.93+p.y*1.5);
      float stain=smoothstep(.20,.82,blotch*.74+fine*.26);
      diffuseColor.rgb*=.85+.24*blotch+.10*fine;
      ${stone?`float damp=stain*(.25+.75*(1.0-smoothstep(5.0,17.0,p.y)));
      diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.48,.74,.42),damp*.72);`:
      'diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.22,1.02,.74),stain*.72);'}
      }
    `);
  };
  material.customProgramCacheKey=()=>stone?'stone-patina-v53':'grass-patina-v53';
  return material;
}
function reliefMaterial(type,face){
  const size=256,wood=type==='wood'||type==='planks';
  const color=document.createElement('canvas'),height=document.createElement('canvas');
  color.width=color.height=height.width=height.height=size;
  const colorContext=color.getContext('2d'),heightContext=height.getContext('2d');
  const pixels=colorContext.createImageData(size,size),heights=heightContext.createImageData(size,size);
  const base=reliefColors[type],grass=type==='grass';
  for(let py=0;py<size;py++)for(let px=0;px<size;px++){
    const x=px/2,y=py/2;
    const row=Math.floor(y/32),u=(x+(row%2)*32)%64,v=y%32;
    const grain=pixelHash(px,py,63),coarse=pixelHash(x>>2,y>>2,42);
    const edge=wood?Math.min(x%32,31-x%32):Math.min(u,63-u,v,31-v);
    const chip=(pixelHash(x>>2,y>>2,82)-.5)*2.8;
    const surface=grass?1:Math.max(0,Math.min(1,(edge+chip)/3));
    const pattern=wood?Math.sin(x*1.6+Math.sin(y*.055)*2)*10:
      (pixelHash(Math.floor((x+row%2*32)/64)%2,row,21)-.5)*26;
    const weather=wood?0:Math.sin(x*.075+y*.09)*5+Math.cos(x*.14-y*.12)*4;
    const stain=Math.sin(x*.052+y*.064)*Math.cos(y*.083-x*.039);
    const mineral=wood||grass?0:Math.max(0,Math.sin(x*.27+y*.19+coarse*2)-.65)*20;
    const fracture=wood||grass?0:Math.exp(-Math.abs(u-18-v*.39-Math.sin(v*.71)*2)*2)*pixelHash(row,Math.floor(x/64),137);
    const moss=wood?0:Math.max(0,stain-.46)*(grass?31:17);
    const shade=pattern+(grain-.5)*14+(coarse-.5)*20+weather+stain*12+mineral-fracture*26;
    const i=(py*size+px)*4;
    for(let channel=0;channel<3;channel++){
      pixels.data[i+channel]=base[channel]*(.51+.49*surface)+shade+moss*[-.7,.8,-.9][channel];
      heights.data[i+channel]=38+surface*168+(grain-.5)*27+pattern-fracture*28;
    }
    pixels.data[i+3]=heights.data[i+3]=255;
  }
  colorContext.putImageData(pixels,0,0);heightContext.putImageData(heights,0,0);
  const map=new THREE.CanvasTexture(color),bumpMap=new THREE.CanvasTexture(height);
  map.colorSpace=THREE.SRGBColorSpace;
  map.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
  const wet=type==='cobble';
  const material=new THREE.MeshPhysicalMaterial({
    map,bumpMap,bumpScale:face==='bottom'?.021:.035,
    roughness:wet?.57:wood?.83:.91,metalness:0,
    clearcoat:wet?.19:0,clearcoatRoughness:.42,
    emissive:wood?'#352519':'#383340',emissiveIntensity:.31
  });
  return grass||type.startsWith('nether')||type==='cobble'?addSurfacePatina(material,!grass):material;
}
const materialByType={};
for(const type of BLOCK_TYPES){
  const makeFace=face=>{
    if(reliefColors[type]&&(type!=='grass'||face==='top'))return reliefMaterial(type,face);
    const map=texture(type,face);
    const material=new THREE.MeshLambertMaterial({map});
    if(type.startsWith('nether')){
      material.emissiveMap=map;
      material.emissive.set('#ffe3db');
      material.emissiveIntensity=type==='netherDeep'?.36:.28;
    }
    return material;
  };
  const side=makeFace('side'),top=makeFace('top'),bottom=makeFace('bottom');
  if(type==='lantern'||type==='lavaGlow'){
    const lampMap=texture(type,'side');
    if(type==='lantern'){
      const ctx=lampMap.image.getContext('2d');
      ctx.fillStyle='#42332a';
      for(const x of [0,30,60])ctx.fillRect(x,0,4,64);
      for(const y of [0,59])ctx.fillRect(0,y,64,5);
      ctx.fillStyle='#947050';
      ctx.fillRect(4,5,56,1);
      lampMap.needsUpdate=true;
    }
    const mat=new THREE.MeshLambertMaterial({map:lampMap,emissiveMap:lampMap,
      emissive:'#ffb46d',emissiveIntensity:type==='lavaGlow'?1.2:1.45});
    materialByType[type]=[mat,mat,mat,mat,mat,mat];
  }else if(type==='water'){
    const mat=new THREE.MeshLambertMaterial({map:texture(type,'side'),transparent:true,opacity:.72,depthWrite:false});
    materialByType[type]=[mat,mat,mat,mat,mat,mat];
  }else if(type==='glass'){
    const mat=new THREE.MeshLambertMaterial({map:texture(type,'side'),transparent:true,opacity:.78,depthWrite:false});
    materialByType[type]=[mat,mat,mat,mat,mat,mat];
  }else materialByType[type]=[side,side,top,bottom,side,side];
}
// V8: Seen erhalten nur eine ruhige, zusammenhängende obere Wasserhaut.
// Beim Wasserfall werden nur tatsächlich freiliegende Seiten gerendert,
// statt die transparenten Wände jeder einzelnen Wasser-Zelle zu zeichnen.
const waterSurfaceMap=materialByType.water[0].map;
// No edge-antialiasing gaps on water tiles; fixed depth sorting on opaque ground.
waterSurfaceMap.generateMipmaps=true;
waterSurfaceMap.wrapS=THREE.RepeatWrapping;
waterSurfaceMap.wrapT=THREE.RepeatWrapping;
const waterTopGeometry=new THREE.BoxGeometry(1.012,.065,1.012);
const waterWallXGeometry=new THREE.BoxGeometry(.062,1.015,1.012);
const waterWallZGeometry=new THREE.BoxGeometry(1.012,1.015,.062);
const waterTopMaterial=new THREE.MeshPhongMaterial({map:waterSurfaceMap,color:'#e4faff',transparent:true,opacity:.86,depthWrite:false,shininess:95,specular:'#d7f7fa'});
const waterWallMaterial=new THREE.MeshLambertMaterial({map:waterSurfaceMap,color:'#c5ecf8',transparent:true,opacity:.73,depthWrite:false,side:THREE.DoubleSide});

const blockGeo=new THREE.BoxGeometry(1,1,1);
const blockFaceOffsets=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
const chunkSurfaceMaterials=new Map();

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
  if(isMeadow())return MEADOW_HEIGHT;
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
  if(isMeadow())return 'wiese';
  if(inLegacy(x,z))return legacyBiomeAt(x,z);
  if(inVillage(x,z))return 'dorf';
  if(x<-65&&z<-63)return 'schattenwald';
  if(lakeDistance(x,z)<6)return 'see';
  if(x< -29&&z>7&&z<76)return 'wueste';
  if(terrainHeight(x,z)>19)return 'berge';
  if(x>37&&z<-28)return 'nadelwald';
  return 'wald';
}
// Houses, pathways and trees are deterministic across chunk boundaries.
const HOUSE_OFFSETS=[[-8,-8],[7,-9],[-10,7],[9,8]];
// V23: A tiny, self-contained experience inside each Sonnen-Dorf workshop.
// Children can use the existing interaction button instead of learning a new HUD.
// Nothing here changes the voxel world, player inventory or the V9 save format.
const SUN_WORKSHOPS=[
  {id:'bakery',name:'Bäckerei',emoji:'🥖',actions:['Teig kneten','Brot formen','Brot fertigstellen'],
    replies:['Du knetest den weichen Brotteig.','Du formst einen kleinen Brotlaib.','Dein erstes Dorf-Brot ist fertig!']},
  {id:'maps',name:'Kartenstube',emoji:'🗺️',actions:['Karte ausrollen','Weg markieren','Kompass prüfen'],
    replies:['Du rollst die große Karte aus.','Du markierst den Weg durch das Dorf.','Der Kompass zeigt dir den Heimweg!']},
  {id:'garden',name:'Gärtnerei',emoji:'🌱',actions:['Samen aussuchen','Pflanze gießen','Blüte pflegen'],
    replies:['Du wählst einen kleinen Samen aus.','Du gibst deiner Pflanze Wasser.','Du hast die Blüte liebevoll gepflegt!']},
  {id:'guard',name:'Wachhaus',emoji:'🛡️',actions:['Wappen anschauen','Weg beobachten','Wache begrüßen'],
    replies:['Du entdeckst das blaue Dorfwappen.','Du hältst die Dorfstraße im Blick.','Die Wächterin freut sich über deine Hilfe!']}
];
const SUN_WORKSHOP_KEY='blockwelt-sonnendorf-werkstaetten-v23';
// Workstations are placed at the V22 furniture, not at an imaginary point on a wall.
// The interaction area is INSIDE the building (the wall is at ~3 blocks).
function sunWorkshopAt(pos,edited=edits,ray=traceVoxel){
  if(Math.hypot(pos.x-VILLAGES[0].x,pos.z-VILLAGES[0].z)>23||pos.y<5.65||pos.y>8.25)return null;
  for(let i=0;i<SUN_WORKSHOPS.length;i++){
    const [ox,oz]=HOUSE_OFFSETS[i],hx=VILLAGES[0].x+ox,hz=VILLAGES[0].z+oz;
    const cx=hx+.5,cz=hz+.5;
    if(Math.abs(pos.x-cx)>2.48||Math.abs(pos.z-cz)>2.48)continue;
    const benchX=cx-2.08,benchZ=cz-.62;
    if(Math.hypot(pos.x-benchX,pos.z-benchZ)>2.32)continue;
    // Building over the workbench removes the action instead of a phantom prompt.
    let altered=false;
    for(let x=Math.floor(benchX-.2);x<=Math.floor(benchX+.2);x++)
      for(let z=Math.floor(benchZ-.7);z<=Math.floor(benchZ+.7);z++)
        for(let y=6;y<=7;y++)if(edited.has(`${x},${y},${z}`))altered=true;
    if(altered)continue;
    // Check the actual solid-voxel map: a custom wall across a room must
    // block interaction, even though the player is within touching distance.
    const origin={x:pos.x,y:pos.y+1.50,z:pos.z};
    const direction={x:benchX-origin.x,y:6.94-origin.y,z:benchZ-origin.z};
    const distance=Math.hypot(direction.x,direction.y,direction.z);
    if(distance>.27&&ray(origin,direction,distance-.22))continue;
    return SUN_WORKSHOPS[i];
  }
  return null;
}

// V21: Only the four roofs in the Sonnen-Dorf are architecturally revised.
// This helper is shared by the solid voxel world and decorative roof tiles.
// Other villages retain their exactly original generated roof shapes.
function sunRoofY(houseIndex,absX){
  const oldY=9+(4-absX);
  return houseIndex===0&&absX<=1?oldY+1:oldY;
}
function sunRoofType(houseIndex,rx,rz,normalType){
  // Real skylights, not painted blue squares on a solid stone surface.
  // Keep roof edges, ridge and gables opaque for a clear greenhouse outline.
  if(houseIndex===2&&[1,2].includes(Math.abs(rx))&&Math.abs(rz)<=2)
    return 'glass';
  return normalType;
}

// V22: Interiors should be recognizable as different places, not four empty
// copies of the same cabin. All objects use the EXISTING batched material
// families. They are strictly visual, deliberately along the room perimeter,
// and never in the 1.2 m wide entry / central walking corridor. The original
// structural voxels, save format and player edits remain untouched.
function addSunHouseInterior(i,hx,hz,add){
  // Rendered voxel centers are (integer + .5), not the voxel array indices.
  const a=(kind,dx,y,dz,w,h,d)=>add(kind,hx+.5+dx,y,hz+.5+dz,w,h,d);
  // Floor is a solid y=5 block, with its upper surface at y=6.0. A very thin
  // wool-coloured runner is purely visual; every house gets its own hue.
  a(['clothCream','mapPaper','moss','bannerBlue'][i],0,6.017,0,1.10,.028,3.82);
  // A readable low counter at the left wall, never across either doorway.
  a('oak',-2.08,6.54,-.62,.74,.15,2.05);
  for(const dz of [-1.32,.13]){
    a('oak',-2.35,6.26,dz,.12,.53,.12);
    a('oak',-1.80,6.26,dz,.12,.53,.12);
  }
  // Built-in shelf along the rear wall gives every room a coherent silhouette.
  // Existing corner furniture is at (x=+-2,z=-2,y=6); these shelves sit ABOVE.
  for(const y of [7.12,7.78])a('oak',1.95,y,-2.42,1.27,.10,.28);
  if(i===0){
    // Bäckerei: rising bread, stone oven and hanging warm lantern.
    for(let n=0;n<4;n++)
      a('bread',-2.35+(n%2)*.54,6.77,-1.20+Math.floor(n/2)*.75,.32,.23,.29);
    a('stoneTrim',2.12,6.56,.53,.86,.84,.95);
    a('iron',2.12,6.64,.02,.53,.40,.095);
    a('lamp',2.12,6.54,-.04,.30,.20,.10);
    a('bread',1.75,7.27,-2.43,.32,.23,.24);
    a('bread',2.20,7.27,-2.43,.32,.23,.24);
    a('lamp',0,8.35,-.65,.30,.39,.30);
  }else if(i===1){
    // Kartenstube: survey table, wall map, three book stacks and compass mark.
    a('mapPaper',-2.08,6.64,-.60,.56,.026,1.30);
    a('sunGold',-2.07,6.66,-.61,.22,.028,.22);
    for(let n=0;n<5;n++)
      a('bookSpine',1.52+(n%3)*.33,7.26+Math.floor(n/3)*.66,-2.42,.23,.34,.20);
    a('mapPaper',.0,7.28,-2.43,1.46,1.12,.10);
    a('crossbeam',0,7.93,-2.39,1.66,.10,.15);
    a('crossbeam',0,6.63,-2.39,1.66,.10,.15);
    a('lamp',2.12,8.37,-.15,.25,.32,.25);
  }else if(i===2){
    // Gärtnerei: potting bench, hanging herbs and a glass-roofed green space.
    for(let n=0;n<3;n++){
      const z=-1.28+n*.78;
      a('flowerpot',-2.06,6.75,z,.52,.27,.49);
      a('forestLeaf',-2.06,7.10,z,.41,.46,.41);
      a(n===1?'petalPink':'petalYellow',-2.06,7.39,z,.20,.19,.20);
    }
    for(let n=0;n<3;n++){
      const z=-1.65+n*.83;
      a('forestLeaf',1.79,7.32,z,.28,.36,.30);
      a('oak',1.79,7.78,z,.075,.56,.08);
    }
    a('oak',1.98,6.55,.90,.77,.12,1.26);
    a('flowerpot',1.98,6.77,.85,.46,.27,.40);
    a('bloomWhite',1.98,7.07,.85,.20,.23,.19);
  }else{
    // Wachhaus: duty table, blue standards, ironwork and an equipment rack.
    a('bannerBlue',-2.35,7.69,-2.48,.23,1.06,.14);
    a('sunGold',-2.35,8.17,-2.23,.16,.15,.14);
    a('iron',1.62,7.61,-2.42,.11,1.62,.18);
    a('iron',2.28,7.61,-2.42,.11,1.62,.18);
    a('crossbeam',1.95,8.37,-2.42,1.04,.10,.19);
    a('stoneTrim',2.08,6.52,.42,.86,.65,.83);
    a('mapPaper',-2.07,6.66,-.62,.51,.028,.83);
    a('lamp',1.95,8.43,-.30,.27,.33,.27);
  }
}

// V13 authored scenery data: one carefully composed village, separate from
// solid voxels. All dimensions are in world units. Grouping by material and
// chunk allows one instanced draw per material rather than hundreds of meshes.
// The same data can be exported for an independent code-data preview.
function makeSunVillageDetails(){
  const v=VILLAGES[0],p=[];
  const add=(kind,x,y,z,w,h,d)=>p.push([kind,x,y,z,w,h,d]);
  const roofPalette=['roofRed','roofWarm','roofGrey','roofRed'];
  for(const [i,[ox,oz]] of HOUSE_OFFSETS.entries()){
    const hx=v.x+ox,hz=v.z+oz,roof=roofPalette[i];
    addSunHouseInterior(i,hx,hz,add);
    // Wall faces are at hz ±3.5; eaves at hz ±4.5.
    // V17 front-window and shop signs projected ~0.6m into empty air.
    const front=hz+3.58;
    // Dacheindeckung: bewusst kleine, gedeckte Tonabweichungen pro Reihe,
    // statt vier perfekt einfarbiger Dächer. Keine zusätzlichen Kollisionen.
    for(let rx=-4;rx<=4;rx++)for(let rz=-4;rz<=4;rz+=2){
      const y=sunRoofY(i,Math.abs(rx))+.52;
      // V21: leave transparent greenhouse panes visible; no opaque tiles on top.
      if(sunRoofType(i,rx,rz,'roof')==='glass')continue;
      const aged=pixelHash(hx+rx,hz+rz,3101);
      const tile=aged>.87?roof+'Light':aged<.19?roof+'Dark':roof;
      // V25: 0.1 m Lücken zwischen den bisherigen Dachplatten sind auf
      // dem iPhone als regelmäßige dunkle Schlitze zu sehen. Minimaler
      // Überstand schließt diese, ohne das Dachprofil zu verändern.
      add(tile,hx+rx,y,hz+rz,1.012,.10,2.012);
    }
    // Warm carpentry: doorway beams, solid little porch roof, sign and sills.
    // V14: Rahmen sitzt AUSSEN an der zweiblockhohen Tür statt versenkt
    // in die tragenden Wände oder weit oberhalb des Türsturzes.
    add('oak',hx-.62,7.23,front+.045,.15,2.38,.20);
    add('oak',hx+.62,7.23,front+.045,.15,2.38,.20);
    add('oak',hx,8.47,front+.045,1.38,.17,.22);
    add('sign',hx+2.92,7.86,front+.055,.67,.52,.12);
    add('oak',hx+2.92,8.23,front+.055,.08,.24,.10);
    // Blickfang aus der Hauptstraße: schmale Leuchtfenster am Erdgeschoss.
    for(const fx of [-1,1]){
      // Actual existing front glass blocks are at x=±1, y=7, z=+3.
      add('window',hx+fx,7.00,front+.04,.57,.67,.06);
      add('oak',hx+fx,7.39,front+.06,.73,.11,.12);
      add('oak',hx+fx,6.61,front+.06,.73,.11,.12);
      add('oak',hx+fx-.37,7.00,front+.06,.10,.87,.12);
      add('oak',hx+fx+.37,7.00,front+.06,.10,.87,.12);
      add('crossbeam',hx+fx,7.00,front+.085,.07,.69,.065);
    }
    // Dunkle Giebelstreben definieren die Silhouette, ohne neue Kollisions-
    // voxels anzulegen oder den Dachfirst künstlich zu erhöhen.
    for(let gx=-3;gx<=3;gx++){
      const roofH=sunRoofY(i,Math.abs(gx));
      add('oak',hx+gx,roofH+.57,hz+4.53,.90,.12,.13);
    }
    add('roofRidge',hx,i===0?14.57:13.57,hz,.31,.23,8.40);
    // Fassaden an der Rückseite: Wiederholung desselben Formenspiels.
    add('crossbeam',hx+.5,8.19,hz-3.59,5.90,.15,.13);
    add('crossbeam',hx+.5,6.05,hz-3.59,5.90,.15,.13);
    add('flowerpot',hx-1,6.51,front+.18,.77,.18,.33);
    add('flowerpot',hx+1,6.51,front+.18,.77,.18,.33);
    for(const side of [-1,1]){
      add('oak',hx+side*1.15,7.50,hz+3.67,.10,1.14,.15);
      add('oak',hx+side*1.15,8.13,hz+3.67,.18,.12,.16);
      // Flower blooms above each box, with real color variation.
      for(let c=0;c<3;c++){
        const fx=hx+side*1.0+(c-1)*.23;
        add((c+i)%3===0?'petalPink':(c+i)%3===1?'bloomWhite':'petalYellow',fx,6.74,front+.20,.17,.19,.19);
      }
    }
    // Side windows receive slim timber frames rather than black rectangles.
    for(const side of [-1,1]){
      const xx=hx+side*3.70;
      add('oak',xx,7.52,hz-.86,.12,1.03,.12);
      add('oak',xx,7.52,hz+.86,.12,1.03,.12);
      add('flowerpot',xx,7.00,hz,.26,.20,1.02);
    }
    // Sichtbare Laternen MIT Aufhängung und dunklem Metallrahmen.
    for(const dir of [-1,1]){
      const fx=hx+dir*2.55;
      add('iron',fx,8.91,front+.06,.11,.11,.38);
      add('iron',fx,8.48,front+.27,.10,.78,.10);
      add('lamp',fx,8.48,front+.28,.29,.48,.30);
      add('iron',fx,8.77,front+.28,.37,.08,.38);
      add('iron',fx,8.17,front+.28,.37,.08,.38);
    }
    // Handwerkliche Querbalken in den Gebäudeecken, sichtbares Fachwerk.
    for(const side of [-1,1]){
      add('crossbeam',hx+side*3.61,6.30,hz+.5,.12,.17,5.90);
      add('crossbeam',hx+side*3.61,8.54,hz+.5,.12,.17,5.90);
      for(const rz of [-2.55,2.55])
        add('oak',hx+side*3.66,7.48,hz+rz,.19,2.50,.19);
    }
    // Eine warme Dorf-Fahne macht die Häuser aus der Ferne unterscheidbar.
    if(i!==2){
      add('oak',hx-2.55,9.47,hz+4.61,.09,.98,.09);
      add(i===1?'bannerGreen':'bannerBlue',hx-2.55,9.11,hz+4.69,.60,.64,.075);
      add('sunGold',hx-2.55,8.83,hz+4.75,.17,.10,.08);
    }
    // Zwei horizontale Fachwerkbänder gliedern die Fassaden ohne neue
    // Kollision. Zierleisten folgen der echten Wand, nicht der Spielspur.
    add('crossbeam',hx+.5,8.68,front+.025,6.91,.13,.12);
    add('oak',hx-3.38,7.67,front+.035,.15,2.03,.15);
    add('oak',hx+3.38,7.67,front+.035,.15,2.03,.15);
    // V15: Jede Fassade bekommt eine unverwechselbare Geschichte. Die kleinen
    // Objekte sind ZIERDE und liegen an der Hauswand, nie auf der Laufspur.
    // 0 Bäckerei, 1 Kartenstube, 2 Gärtnerei, 3 Tor-/Wachhaus.
    if(i===0){
      // Brotauslage und kleine rotbraune Markise vor dem Bäckerfenster.
      add('oak',hx-2.16,6.63,front+.30,1.25,.14,.52);
      for(let n=0;n<3;n++){
        add('bread',hx-2.55+n*.37,6.82,front+.36,.29,.19,.35);
      }
      add('clothCream',hx-2.12,8.54,front+.33,1.68,.10,.65);
      add('roofRed',hx-2.88,8.47,front+.33,.15,.12,.66);
      add('roofRed',hx-1.36,8.47,front+.33,.15,.12,.66);
      add('iron',hx+2.20,8.00,front+.19,.41,.08,.08);
      add('sunGold',hx+2.20,7.74,front+.21,.23,.43,.10);
    }else if(i===1){
      // Die Kartenstube: gerahmte Ausstellungsstücke und Sternensymbol.
      add('mapPaper',hx-2.23,7.42,front+.12,.62,.57,.075);
      add('oak',hx-2.23,7.77,front+.15,.78,.11,.10);
      add('oak',hx-2.23,7.08,front+.15,.78,.11,.10);
      add('sunGold',hx+2.23,7.63,front+.12,.34,.34,.09);
      add('oak',hx+2.23,7.63,front+.17,.08,.54,.08);
      add('oak',hx+2.23,7.63,front+.17,.52,.08,.08);
      for(let k=0;k<3;k++)add('bookSpine',hx-2.63+k*.24,6.55,front+.39,.15,.32,.19);
    }else if(i===2){
      // Die Gärtnerei: gezielte grüne Fassadenelemente, Kräuter und Blüten.
      for(const sx of [-2.47,2.47]){
        for(let j=0;j<4;j++){
          add('forestLeaf',hx+sx,6.65+j*.44,front+.15,.40,.30,.25);
        }
        add('bloomWhite',hx+sx,8.07,front+.28,.25,.26,.22);
      }
      for(let k=0;k<4;k++){
        add('flowerpot',hx-2.37+k*.40,6.20,front+.33,.34,.25,.35);
        add(k%2?'petalPink':'petalYellow',hx-2.37+k*.40,6.49,front+.36,.24,.23,.25);
      }
      add('bannerGreen',hx+2.12,8.17,front+.17,.48,.66,.09);
    }else{
      // Das Wachhaus: robuste Stein-/Holzdetails und ein blaues Wappen.
      add('stoneTrim',hx-2.20,6.13,front+.10,1.02,.31,.35);
      add('stoneTrim',hx+2.20,6.13,front+.10,1.02,.31,.35);
      add('bannerBlue',hx+2.27,8.18,front+.21,.59,.78,.10);
      add('sunGold',hx+2.27,8.26,front+.31,.17,.22,.07);
      for(const sx of [-2.76,2.76]){
        add('iron',hx+sx,6.54,front+.28,.11,.70,.12);
        add('sunGold',hx+sx,6.96,front+.28,.18,.13,.18);
      }
    }
    // V19: NORD-Fassaden der beiden südlichen Häuser. Zum Dorfplatz
    // stehen jetzt zwei einladende Werkstätten statt nur geschlossene Rückwände.
    // Alle Elemente sitzen an der realen rückwärtigen Wand z=hz-3.5.
    if(i>=2){
      const north=hz-3.61;
      // Zwei frei bleibende Türpfosten und ein kleiner, flacher Wetterschutz.
      for(const side of [-1,1]){
        add('oak',hx+side*.62,7.23,north-.05,.15,2.38,.19);
      }
      add('oak',hx,8.48,north-.07,1.39,.17,.22);
      for(let k=0;k<5;k++){
        const ax=hx-1.10+k*.55;
        add((k+i)%2?'clothCream':i===2?'bannerGreen':'bannerBlue',
            ax,8.65,north-.64,.54,.10,1.10);
      }
      add('oak',hx-1.15,8.57,north-.69,.11,.10,1.19);
      add('oak',hx+1.15,8.57,north-.69,.11,.10,1.19);
      for(const fx of [-1,1]){
        // Vorhandene rückwärtige Glasfenster liegen bei x=±1,y=7,z=hz-3.
        add('window',hx+fx,7.00,north-.07,.57,.67,.06);
        add('oak',hx+fx,7.39,north-.10,.72,.11,.11);
        add('oak',hx+fx,6.61,north-.10,.72,.11,.11);
        add('oak',hx+fx-.37,7.0,north-.10,.10,.86,.12);
        add('oak',hx+fx+.37,7.0,north-.10,.10,.86,.12);
        add('crossbeam',hx+fx,7.0,north-.12,.07,.66,.06);
        add('flowerpot',hx+fx,6.52,north-.30,.67,.18,.31);
        add('windowGlow',hx+fx,7.0,north-.19,.38,.45,.068);
      }
      add('crossbeam',hx+.50,8.68,north-.04,6.90,.13,.12);
      for(const side of [-1,1])
        add('oak',hx+side*3.36,7.67,north-.05,.15,2.06,.14);
      // Die Gärtnerei zeigt grüne Ranken; am Wachhaus hängt das blaue Wappen.
      if(i===2){
        for(const side of [-2.7,2.7])for(let k=0;k<4;k++)
          add('forestLeaf',hx+side,6.45+k*.46,north-.27,.28,.35,.25);
        for(const sx of [-2.7,2.7])
          add('bloomWhite',hx+sx,8.40,north-.37,.26,.24,.23);
      }else{
        add('bannerBlue',hx+2.28,8.04,north-.28,.60,.77,.09);
        add('sunGold',hx+2.28,8.10,north-.37,.18,.22,.075);
        for(const side of [-2.8,2.8])
          add('stoneTrim',hx+side,6.40,north-.20,.30,.62,.29);
      }
    }
    // V20: Ein geschlossenes Ensemble statt vier gleichartiger Hauskörper.
    // Handwerksspezifische Fassaden sind an den ECHTEN Wänden befestigt.
    // Die Vorbauten bleiben flach und lassen x = hx an beiden Türen frei.
    // Neu sind NUR nicht-kollidierende Instanzen, keine Spieler-Baublöcke.
    const plazaFacing=i>=2;
    const facadeZ=plazaFacing?hz-3.62:hz+3.62;
    const facadeDir=plazaFacing?-1:1;
    const outward=(distance)=>facadeZ+facadeDir*distance;
    // Ein durchgehender Steinsockel gibt dem Holzhaus ein ruhiges Fundament.
    // Fenster, Türen und Wege bleiben durch die Segmentierung unverdeckt.
    for(const side of [-1,1]){
      add('stoneTrim',hx+side*2.08,6.15,outward(.045),2.18,.18,.17);
      // Abgesetzte Fachwerk-Lisenen und oberer durchlaufender Ringbalken.
      add('oak',hx+side*2.70,8.06,outward(.075),.12,1.01,.15);
      add('crossbeam',hx+side*2.11,8.66,outward(.08),2.60,.12,.14);
    }
    // Dunkle Dachunterseite: beim Blick entlang der Gasse ist nun klar,
    // wo der Dachkörper auf der Fassade sitzt.
    add('roofRidge',hx,9.72,outward(.88),7.74,.16,.14);
    // Ein kleiner zweiter Giebelrahmen auf der tatsächlich zum Platz
    // zeigenden Seite. Kein kopierter Massen-Balken über dem Dorfweg.
    for(const sx of [-2.25,2.25]){
      add('oak',hx+sx,10.55,outward(.90),.13,1.13,.13);
      add('oak',hx+sx*.64,11.43,outward(.92),.11,.67,.13);
    }
    if(i===0){
      // BÄCKEREI: zusammenhängende rot-elfenbeinfarbene Stoffmarkise,
      // rustikale Warenbretter und ein kleiner heller Brot-Aufsteller.
      for(let strip=0;strip<5;strip++){
        add(strip%2===0?'roofRed':'clothCream',hx-2.28+strip*.29,
          8.78,outward(.44),.285,.10,.80);
      }
      add('oak',hx-2.28,8.73,outward(.86),1.54,.09,.12);
      for(let b=0;b<3;b++){
        add('oak',hx+1.70,6.51+b*.34,outward(.22),1.35,.08,.28);
        if(b===2)for(let loaf=0;loaf<3;loaf++)
          add('bread',hx+1.27+loaf*.42,6.66+b*.34,outward(.25),.29,.15,.22);
      }
    }else if(i===1){
      // KARTENSTUBE: hölzerner Aushang mit eingerollter Karte,
      // eingerahmt wie ein Handwerksladen und kein zweites Fenster.
      add('oak',hx-2.04,8.01,outward(.16),1.38,1.03,.15);
      add('mapPaper',hx-2.04,8.01,outward(.258),1.06,.73,.065);
      for(const side of [-1,1]){
        add('sunGold',hx-2.04+side*.39,8.01,outward(.30),.06,.55,.08);
        add('oak',hx-2.04+side*.65,8.08,outward(.23),.10,1.14,.12);
      }
      add('oak',hx+2.16,8.79,outward(.14),1.14,.12,.20);
      for(let n=0;n<4;n++)add('bookSpine',hx+1.73+n*.28,8.58,outward(.23),.22,.34,.19);
    }else if(i===2){
      // GÄRTNEREI: offenes, begrüntes Vordach zur Nordfront.
      // Alle Querleisten sind höher als der begehbare Türdurchgang.
      for(const side of [-1,1]){
        add('oak',hx+side*1.72,8.72,outward(.48),.13,.13,1.02);
        add('forestLeaf',hx+side*1.62,8.92,outward(.37),.53,.28,.47);
        add('flowerpot',hx+side*2.52,6.36,outward(.33),.54,.40,.51);
        add('forestLeaf',hx+side*2.52,6.75,outward(.33),.44,.36,.44);
      }
      add('oak',hx,8.77,outward(.79),3.54,.13,.13);
      for(let blossom=-2;blossom<=2;blossom++)
        add(blossom%2?'petalPink':'bloomWhite',hx+blossom*.63,
          9.06,outward(.44),.22,.22,.22);
    }else{
      // WACHHAUS: steinerne Laibung, blaues Bannerpaar und
      // klarer Torakzent ohne bedrohlichen, unpassenden Wachturm.
      for(const side of [-1,1]){
        add('stoneTrim',hx+side*.79,7.58,outward(.15),.24,1.95,.23);
        add('bannerBlue',hx+side*2.57,8.07,outward(.25),.39,.89,.07);
        add('sunGold',hx+side*2.57,8.28,outward(.32),.12,.36,.06);
      }
      add('stoneTrim',hx,8.70,outward(.16),1.94,.23,.25);
      add('sunGold',hx,8.92,outward(.19),.24,.17,.21);
    }

    // V21: pro house one intentional skyline, not four copies of the same ridge.
    if(i===1){
      // Observatory lantern atop the Kartenstube: slim cupola rim, very small
      // compared with the watch house's stone lookout. The solid roof is below.
      for(const side of [-1,1]){
        add('oak',hx+side*1.10,15.70,hz+1.00,.12,.45,.13);
      }
      add('sunGold',hx,16.12,hz+.5,.23,.24,.23);
      add('oak',hx,15.85,hz+.5,.10,.37,.10);
    }else if(i===2){
      // Narrow greenhouse skylight mullions follow the stepped glass roof.
      for(const rx of [-2,-1,1,2]){
        const beamY=sunRoofY(i,Math.abs(rx))+.59;
        add('oak',hx+rx,beamY,hz,.10,.10,5.00);
      }
      for(const rz of [-2.55,2.55])for(const rx of [-2,-1,1,2]){
        const beamY=sunRoofY(i,Math.abs(rx))+.59;
        add('oak',hx+rx,beamY,hz+rz,.83,.12,.09);
      }
    }else if(i===3){
      // A slim timber cornice softens the lookout's raw stone shaft.
      // The original roof cap remains a single shared block geometry.
      for(const side of [-1,1]){
        add('crossbeam',hx,16.51,hz+side*1.56,3.22,.12,.13);
        add('crossbeam',hx+side*1.56,16.51,hz,.13,.12,3.22);
      }
      // Kurzer Wimpel passend zur niedrigen Wachstube.
      add('iron',hx+.5,17.75,hz+.5,.10,.90,.10);
      add('bannerBlue',hx+.88,18.05,hz+.5,.63,.46,.08);
      add('sunGold',hx+1.18,18.05,hz+.56,.09,.33,.09);
    }
    // Ein kleiner Giebel-Akzent in Materialfarbe, statt vier identischer Dächer.
    add(i%2===0?'sunGold':'oak',hx+.5,13.98,hz+4.77,.32,.16,.26);
    // V16: Kleine, pro Handwerksrolle unterschiedliche Dach-Silhouetten.
    // Alles hängt oberhalb der begehbaren Ebene als rein visuelles Detail;
    // kein Türdurchgang wird geschlossen und kein Nutzerblock überschrieben.
    if(i===0){
      // Bäckerei: niedrige gemauerte Schornsteinkrone über dem Ofen.
      add('stoneTrim',hx+2.50,13.56,hz-1.48,1.04,.14,1.04);
      for(const sx of [-.42,.42])
        add('roofRed',hx+2.50+sx,13.68,hz-1.48,.16,.26,.83);
      for(const sz of [-.38,.38])
        add('roofRed',hx+2.50,13.68,hz-1.48+sz,.76,.26,.16);
    }else if(i===1){
      // Kartenstube: kleiner Sternengucker am Giebel, als klare Fernsilhouette.
      add('oak',hx+.5,14.77,hz+1.6,.12,1.34,.12);
      add('sunGold',hx+.5,15.53,hz+1.6,.52,.10,.11);
      add('sunGold',hx+.5,15.53,hz+1.6,.10,.52,.11);
      add('bannerBlue',hx+.82,14.91,hz+1.6,.62,.55,.075);
    }else if(i===2){
      // Gärtnerei: niedrige rankende Dachkante, ohne zusätzliche Kollision.
      for(let k=-2;k<=2;k++){
        add('forestLeaf',hx+k*.64,10.18,hz+4.82,.41,.21,.27);
        if(k%2===0)add('petalPink',hx+k*.64,10.43,hz+4.82,.20,.18,.18);
      }
    }else{
      // V21: flag is placed above the new tower earlier in this function.
    }
    // V17: Die Dachlinien haben nun kleine, klar gefasste Gauben. Sie sitzen
    // auf der Vorderkante der vorhandenen Dachschräge, sind rein visuell und
    // verdecken weder Eingang noch Fenster im Erdgeschoss.
    // Je Haus unterschiedliche Position/Materialfarbe – kein zweiter Kubus.
    const gaubeX=hx+(i%2===0?-2:2);
    const gaubeY=11.95,gaubeZ=hz+4.70;
    add('oak',gaubeX,gaubeY,gaubeZ,.78,.82,.22);
    add('windowGlow',gaubeX,gaubeY,gaubeZ+.128,.42,.50,.075);
    add('oak',gaubeX-.47,gaubeY,gaubeZ+.04,.13,.92,.24);
    add('oak',gaubeX+.47,gaubeY,gaubeZ+.04,.13,.92,.24);
    add('oak',gaubeX,gaubeY+.51,gaubeZ,.99,.15,.34);
    // Ein warmes Licht hinter dem ursprünglichen Fensterglas wird nachts
    // sichtbar; tagsüber bleibt es transparent und zurückhaltend.
    for(const fx of [-1,1])
      add('windowGlow',hx+fx,7.00,front+.115,.39,.46,.068);
    // Simple chimney cap and two drifting vapor squares, not solid obstacles.
    if(i===0){
      add('smoke',hx+2.5,14.12,hz-1.5,.38,.30,.39);
      add('smoke',hx+2.79,14.67,hz-1.30,.31,.26,.34);
    }
  }
  // Centerpiece: a stone well made to look intentionally built, not just a
  // collection of exposed cubes. Keep the outer footpath clear.
  for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++){
    if(Math.max(Math.abs(dx),Math.abs(dz))===2&&
      (dx===0||dz===0||Math.abs(dx)===2&&Math.abs(dz)===2)){
      add('stoneTrim',v.x+dx+.5,6.05,v.z+dz+.5,.78,.16,.78);
    }
  }
  for(const side of [-1,1]){
    add('oak',v.x+side*2.42+.5,7.45,v.z+.5,.14,2.15,.13);
    add('lamp',v.x+side*2.38+.5,8.56,v.z+.5,.22,.31,.22);
  }
  // V24: Nur EIN vollständiger Marktstand. V23 hatte direkt neben dem
  // Brunnen ein zweites gestreiftes Stoffdach, das die Mitte zustellte.
  // Der bestehende Marktstand aus dem Chunk-Renderer bleibt erhalten.
  {
    const mx=v.x-3,mz=v.z-5,base=6;
    add('oak',mx,base+.65,mz,.85,.21,1.82);
    for(let j=0;j<10;j++){
      const px=mx+((j%5)-2)*.21;
      const pz=mz+(j<5?-.36:.36);
      add(j%3===0?'fruitRed':j%3===1?'fruitGold':'fruitGreen',
          px,base+.86,pz,.20,.18,.19);
    }
    add('sign',mx,base+1.60,mz-1.11,1.25,.38,.09);
    add('lamp',mx,base+2.08,mz+.02,.30,.36,.30);
  }
  // Four flower borders, away from both house walls and foot traffic.
  for(const [ox,oz] of [[-6,3],[-6,-3],[6,3],[6,-3]]){
    for(let i=0;i<4;i++){
      const fx=v.x+ox+(i%2)*.60+.2,fz=v.z+oz+Math.floor(i/2)*.60;
      add('leaf',fx,5.28,fz,.36,.31,.38);
      add(i%2?'petalPink':'petalYellow',fx,5.60,fz,.23,.23,.22);
    }
  }
  // V14: Straßen- und Platzgestaltung. Die Pflasterfugen liegen als sehr
  // flache, nicht kollidierende Instanzen direkt auf dem bereits vorhandenen
  // Boden. Wege bleiben 2 Blöcke breit und für Kinder leicht passierbar.
  for(let ox=-13;ox<=13;ox++)for(let oz=-13;oz<=13;oz++){
    const onCross=Math.abs(ox)<=1||Math.abs(oz)<=1;
    const closeToWell=Math.abs(ox)<=3&&Math.abs(oz)<=3;
    if(!onCross||closeToWell)continue;
    const wx=v.x+ox,wz=v.z+oz;
    if(Math.abs(ox)>11&&Math.abs(oz)>11)continue;
    const top=terrainHeight(wx,wz);
    // Positionen auf einem Raster versetzt: kein wildes Steinchaos.
    if((Math.abs(ox*7+oz*11)%5)===0)
      add((ox+oz)%3===0?'cobbleWarm':'cobbleLight',wx+.5,top+.018,wz+.5,.34,.035,.43);
  }
  // V20: Die Kreuzung bekommt sichtbare Wegkanten. Dünne, niedrige
  // Pflastersteine markieren die Straßen, OHNE eine neue Kollision einzubauen.
  // Die Hauptstraße bleibt frei und wird nicht mit Deko zugestellt.
  for(let n=-13;n<=13;n+=2){
    if(Math.abs(n)<=3)continue; // Brunnen bleibt der ruhige Mittelpunkt.
    for(const side of [-1,1]){
      const xx=v.x+n, zz=v.z+side*1.46;
      const hA=terrainHeight(Math.floor(xx),Math.floor(zz));
      add(n%4?'cobbleWarm':'cobbleLight',xx+.50,hA+.035,zz,.62,.045,.16);
      const xx2=v.x+side*1.46,zz2=v.z+n;
      const hB=terrainHeight(Math.floor(xx2),Math.floor(zz2));
      add(n%4?'cobbleLight':'cobbleWarm',xx2,hB+.035,zz2+.50,.16,.045,.62);
    }
  }

  // Kuratierte, kleine Gärten an Gebäudeseiten und dem Südplatz.
  for(const [ox,oz] of [[-11,-4],[11,-4],[-12,5],[12,5],[-6,10],[5,-11]]){
    const bx=v.x+ox,bz=v.z+oz,th=terrainHeight(bx,bz);
    for(let k=0;k<3;k++){
      const px=bx+(k%2)*.38,pz=bz+Math.floor(k/2)*.44;
      add('moss',px,th+.17,pz,.44,.34,.47);
      add(k%3===0?'bloomWhite':k%3===1?'petalPink':'petalYellow',px,th+.50,pz,.22,.27,.24);
    }
  }
  // Ein weit abseits des Blickkorridors platzierter Blumenbogen statt des
  // schweren V13-Pavillons: offen, nicht kollidierend, visuell durchlässig.
  const archX=v.x-5,archZ=v.z+10;
  for(const sx of [-1,1]){
    add('oak',archX+sx*1.05,6.52,archZ,.18,2.85,.19);
    add('leaf',archX+sx*1.10,8.08,archZ,.70,.49,.55);
    add('petalPink',archX+sx*1.08,8.18,archZ+.30,.25,.22,.25);
  }
  add('oak',archX,8.11,archZ,.18,.13,.18);
  add('leaf',archX,8.08,archZ,.90,.43,.55);
  // V19: Der Brunnen soll WIRKLICH sichtbar sein. Bisher hielten vier
  // hohe Pfosten und zwei Querbalken das Bild aus der Straße zu. Nur auf der
  // Nordseite bleibt die niedrige Winde mit zwei schlanken Stützen stehen.
  // Alle Teile sind nicht kollidierende Dekoration; der Wasserblock bleibt.
  for(const sx of [-1.35,1.35]){
    add('oak',v.x+sx,6.80,v.z-1.62,.18,1.55,.18);
    add('iron',v.x+sx,7.58,v.z-1.62,.27,.09,.27);
  }
  add('oak',v.x,7.56,v.z-1.62,2.85,.15,.20);
  add('iron',v.x,7.14,v.z-1.62,.11,.72,.12);
  add('oak',v.x+.35,6.92,v.z-1.62,.28,.33,.27);
  add('iron',v.x+.35,6.92,v.z-1.88,.12,.11,.55);
  add('sunGold',v.x+.5,6.20,v.z+.5,.64,.035,.64);
  // Bänke werden durch kurze Wege und einen klaren Blick zum Brunnen ergänzt.
  for(const side of [-1,1]){
    add('lamp',v.x+side*6.6,6.49,v.z+2.75,.25,.35,.27);
    add('iron',v.x+side*6.6,6.75,v.z+2.75,.35,.07,.35);
  }
  // V18: A cozy dry herb drying rack in the gardener's side yard. All
  // details non-solid and away from the entrance, with subtle height variety.
  const garden=HOUSE_OFFSETS[2];
  const gx=v.x+garden[0]-4.25,gz=v.z+garden[1]-.5;
  for(const dx of [-.72,.72]){
    add('oak',gx+dx,6.38,gz,.12,1.57,.13);
    add('oak',gx+dx,7.24,gz,.22,.11,.22);
  }
  add('oak',gx,7.05,gz,1.64,.13,.15);
  for(let i=0;i<4;i++){
    add('forestLeaf',gx-.58+i*.39,6.74,gz+.045,.24,.43,.21);
    if(i%2===0)add('petalYellow',gx-.58+i*.39,6.50,gz+.045,.12,.15,.12);
  }
  // Floor-level lanterns frame the two side lanes, never the main crossroad.
  for(const [dx,dz] of [[-8,3],[8,-3]]){
    add('stoneTrim',v.x+dx+.5,5.36,v.z+dz+.5,.31,.18,.31);
    add('lamp',v.x+dx+.5,5.68,v.z+dz+.5,.22,.35,.22);
  }
  // V19: Bänke standen in V18 direkt auf der Ost-West-Sichtachse.
  // Jetzt sind sie in seitlichen Nischen, links/rechts der Hauptstraße.
  for(const side of [-1,1]){
    const bx=v.x+side*6.8,bz=v.z+side*3.7+.5;
    add('oak',bx,5.58,bz,.62,.15,1.60);
    add('oak',bx+side*.29,5.93,bz,.14,.69,1.62);
    for(const zOff of [-.53,.53])add('oak',bx,5.32,bz+zOff,.11,.50,.12);
  }
  // V15: Ein kleiner, bewusst komponierter Terrassenhang NÖRDLICH des
  // Sonnen-Dorfs. Die bisherigen Geländehöhen/Blöcke werden nicht verändert.
  // Gedämpfte Sträucher und Mauerbegrünung statt kahler, gleichförmiger Stufen.
  // Nur feste Koordinaten; Dekorationen entfallen im Bereich eigener Edits.
  let slopeProps=0;
  for(let dx=-20;dx<=20;dx++)for(let dz=-29;dz<=-16;dz++){
    const x=v.x+dx,z=v.z+dz;
    const hh=terrainHeight(x,z);
    if(hh<5||hh>27||inLegacy(x,z)||HOUSE_OFFSETS.some(([ox,oz])=>Math.abs(x-v.x-ox)<4.5&&Math.abs(z-v.z-oz)<4.5))continue;
    const distance=Math.hypot(dx,dz);
    if(distance<18||distance>33)continue;
    const r=pixelHash(x,z,2501);
    if(r>.79){
      const scale=.43+pixelHash(x,z,2502)*.39;
      add(r>.969?'bloomWhite':'forestLeaf',x+.52,hh+.12+scale*.28,z+.5,
        scale,scale*.65,scale);
      slopeProps++;
      if(r>.92)add('forestLeaf',x+.76,hh+.19,z+.29,.34,.29,.37);
    }else if(r<.031){
      add('stoneTrim',x+.5,hh+.09,z+.5,.43,.21,.43);
      slopeProps++;
    }
    // Nur auf tatsächlich sichtbaren südlichen Hangwänden Klettergrün.
    const southHeight=terrainHeight(x,z+1);
    if(hh-southHeight>=2&&pixelHash(x,z,2511)>.61){
      add('forestLeaf',x+.5,hh-.48,z+.94,.27,.88,.14);
      if(pixelHash(x,z,2512)>.70)
        add('petalPink',x+.5,hh-.21,z+1.04,.17,.18,.16);
      slopeProps++;
    }
  }
  return p;
}
const SUN_VILLAGE_DETAILS=makeSunVillageDetails();
// Original, self-contained pixel-art icon atlas: loaf, map, sprout, shield.
// Four quads share a single geometry, texture and draw call. Nothing is solid,
// mineable, or saved as a user block; the sign disappears where edited.
function makeSunVillageSignMesh(){
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;
  const ctx=canvas.getContext('2d');
  ctx.imageSmoothingEnabled=false;
  const icons=['bread','map','flower','shield'];
  for(let i=0;i<4;i++){
    const ox=i*64;
    ctx.fillStyle='#9c673d';ctx.fillRect(ox,0,64,64);
    ctx.fillStyle='#e4c392';ctx.fillRect(ox+4,4,56,56);
    ctx.fillStyle='#69472d';ctx.fillRect(ox+9,9,46,46);
    ctx.fillStyle='#f2dcae';ctx.fillRect(ox+11,11,42,42);
    if(icons[i]==='bread'){
      ctx.fillStyle='#a56832';ctx.fillRect(ox+16,31,32,12);
      ctx.fillStyle='#e6aa53';ctx.fillRect(ox+19,23,26,17);
      ctx.fillStyle='#fff2bd';for(const j of [24,32,40])ctx.fillRect(ox+j,25,3,7);
    }else if(icons[i]==='map'){
      ctx.fillStyle='#f6eee1';ctx.fillRect(ox+17,17,30,30);
      ctx.fillStyle='#8ab6a1';ctx.fillRect(ox+20,20,24,24);
      ctx.fillStyle='#bd7655';ctx.fillRect(ox+22,34,18,4);
      ctx.fillStyle='#ffefc6';ctx.fillRect(ox+33,22,5,18);
    }else if(icons[i]==='flower'){
      ctx.fillStyle='#4c7d43';ctx.fillRect(ox+30,26,5,22);
      ctx.fillRect(ox+24,36,7,5);ctx.fillRect(ox+35,32,7,5);
      ctx.fillStyle='#ce7f99';for(const [x,y] of [[23,23],[35,23],[29,17],[29,29]])ctx.fillRect(ox+x,y,9,8);
      ctx.fillStyle='#f9d479';ctx.fillRect(ox+31,25,5,5);
    }else{
      ctx.fillStyle='#527e99';ctx.fillRect(ox+20,18,24,24);
      ctx.fillRect(ox+24,42,16,5);ctx.fillRect(ox+28,47,8,4);
      ctx.fillStyle='#f9e3b0';ctx.fillRect(ox+30,23,4,19);ctx.fillRect(ox+23,30,18,4);
    }
  }
  const map=new THREE.CanvasTexture(canvas);
  map.colorSpace=THREE.SRGBColorSpace;
  map.magFilter=THREE.NearestFilter;
  map.minFilter=THREE.NearestMipmapNearestFilter;
  // One mesh with four icon quads. It is intentionally outside chunk meshes;
  // visibility is checked in updateSunVillageSigns against near edits/distance.
  const pos=[],uv=[],indices=[];
  for(let i=0;i<4;i++){
    const [ox,oz]=HOUSE_OFFSETS[i],hx=VILLAGES[0].x+ox,hz=VILLAGES[0].z+oz;
    const x=hx+2.92,y=7.86,z=i>=2?hz-3.80:hz+3.77,w=.56,h=.46;
    const n=pos.length/3;
    pos.push(x-w/2,y-h/2,z, x+w/2,y-h/2,z, x+w/2,y+h/2,z, x-w/2,y+h/2,z);
    const u0=i/4+.004,u1=(i+1)/4-.004;
    uv.push(u0,0,u1,0,u1,1,u0,1);
    indices.push(n,n+1,n+2,n,n+2,n+3);
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  geo.setIndex(indices);geo.computeVertexNormals();
  const material=new THREE.MeshBasicMaterial({map,side:THREE.DoubleSide,transparent:false});
  const mesh=new THREE.Mesh(geo,material);
  mesh.frustumCulled=true;
  scene.add(mesh);
  return mesh;
}
const sunVillageSignMesh=makeSunVillageSignMesh();
// Keep one GPU draw call for four signs, while retaining per-house edit safety.
// A custom block at ONE shop must never hide the signs at the other shops.
const originalSignVertices=Float32Array.from(sunVillageSignMesh.geometry.attributes.position.array);
let sunVillageSignMask=-1;
function updateSunVillageSignVisibility(isNear){
  sunVillageSignMesh.visible=isNear;
  if(!isNear)return;
  let newMask=0;
  for(let i=0;i<HOUSE_OFFSETS.length;i++){
    const [ox,oz]=HOUSE_OFFSETS[i],hx=VILLAGES[0].x+ox,hz=VILLAGES[0].z+oz;
    const centerZ=i>=2?hz-3:hz+3;
    let edited=false;
    for(let x=hx+1;x<=hx+3&&!edited;x++)
    for(let y=7;y<=9&&!edited;y++)
    for(let z=centerZ-1;z<=centerZ+1;z++)
      if(edits.has(key(x,y,z))){edited=true;break;}
    if(!edited)newMask|=1<<i;
  }
  if(newMask===sunVillageSignMask)return;
  sunVillageSignMask=newMask;
  const position=sunVillageSignMesh.geometry.attributes.position;
  for(let i=0;i<4;i++)for(let vertex=0;vertex<4;vertex++){
    const j=i*12+vertex*3;
    if(newMask&(1<<i))position.setXYZ(i*4+vertex,
      originalSignVertices[j],originalSignVertices[j+1],originalSignVertices[j+2]);
    // Collapse onto the sign's OWN first vertex, not world origin: this
    // prevents edited signs from inflating the mesh bounding sphere.
    else position.setXYZ(i*4+vertex,originalSignVertices[i*12],
      originalSignVertices[i*12+1],originalSignVertices[i*12+2]);
  }
  position.needsUpdate=true;
  sunVillageSignMesh.geometry.computeBoundingSphere();
}

function villageBlocks(x,z,y,chunkPut){
  for(const v of VILLAGES){
    if(Math.abs(x-v.x)>21||Math.abs(z-v.z)>21)continue;
    const crossX=Math.abs(x-v.x),crossZ=Math.abs(z-v.z);
    // Straßennetz, Dorfplatz und breite Eingänge auf Höhe des Geländes.
    if((crossX<15&&crossZ<=1)||(crossZ<15&&crossX<=1)||(crossX<=2&&crossZ<=2)){
      const h=terrainHeight(x,z);
      if(y===h-1)chunkPut(x,y,z,'path');
    }
    for(let i=0;i<HOUSE_OFFSETS.length;i++){
      const [dx,dz]=HOUSE_OFFSETS[i],hx=v.x+dx,hz=v.z+dz;
      const rx=x-hx,rz=z-hz,ax=Math.abs(rx),az=Math.abs(rz);
      // Das Sonnen-Dorf braucht einen gut begehbaren Vorplatz vor jedem Haus.
      // Der Kern der anderen Dörfer bleibt geometrisch exakt unangetastet.
      if(ax>5||az>(v===VILLAGES[0]?7:5))continue;
      const floor=5;
      // V16: Alle vier Hauszugänge besitzen einen drei Felder breiten
      // Zugangskorridor. Kleine Terrassen mit maximal einer Stufe je Feld
      // statt einer unerwarteten natürlichen Erdwand vor der Haustür.
      // Spieleränderungen werden durch generateChunkData() DANACH angewandt.
      if(v===VILLAGES[0]&&ax<=1&&rz>=5&&rz<=7){
        const pathY=floor+(rz-5);
        const natural=terrainHeight(x,z);
        if(y===pathY)chunkPut(x,y,z,'path');
        if(y<pathY&&y>=natural)chunkPut(x,y,z,'dirt');
        if(y>pathY)chunkPut(x,y,z,null);
      }
      // A stable foundation even when the surrounding hill dips below the house.
      if(ax<=3&&az<=3&&y>=terrainHeight(x,z)&&y<floor)chunkPut(x,y,z,'cobble');
      // Level and clear the actual walkable interior; natural hills must never
      // protrude invisibly through the rooms or block their front doorway.
      if(ax<=2&&az<=2&&y>=floor+1&&y<=floor+3)chunkPut(x,y,z,null);
      if(rx===0&&(rz===3||rz===4)&&y>=floor+1&&y<=floor+2)chunkPut(x,y,z,null);
      // Fundament und warmer Dielenboden.
      if(ax<=3&&az<=3&&y===floor)chunkPut(x,y,z,'planks');
      // A few small interior furnishings make buildings worth exploring.
      // The middle aisle, door and the 2-block-tall walking clearance stay open.
      if((rx===-2&&rz===-2||rx===2&&rz===-2)&&y===floor+1)chunkPut(x,y,z,i%2?'wood':'planks');
      if(rx===0&&rz===-2&&y===floor+3)chunkPut(x,y,z,'lantern');
      // Gerahmte Holzwände, lichte Fenster und eine offene zweiblockhohe Tür.
      if(ax<=3&&az<=3&&y>=floor+1&&y<=floor+3&&(ax===3||az===3)){
        const isDoor=rz===3&&rx===0&&y<=floor+2;
        if(!isDoor){
          const post=ax===3&&az===3;
          const window=(y===floor+2)&&((ax===3&&az===0)||(az===3&&ax===0));
          const block=y===floor+1?'cobble':post?'wood':window?'glass':'planks';
          chunkPut(x,y,z,block);
        }
      }
      // Individuelle Giebeldächer statt vier identischer Kubus-Häuser.
      const roofBlock=['bricks','planks','cobble','bricks'][i];
      if(az<=4&&ax<=4){
        const roofY=v===VILLAGES[0]?sunRoofY(i,ax):floor+4+(4-ax);
        if(y===roofY)chunkPut(x,y,z,
          v===VILLAGES[0]?sunRoofType(i,rx,rz,roofBlock):roofBlock);
        if(az===3&&ax<=2&&y>=floor+4&&y<roofY)chunkPut(x,y,z,'planks');
        if(az===4&&ax<=3&&y===floor+3)chunkPut(x,y,z,'wood');
        // Eaves project beyond the walls, but never close the front door.
        if(az===4&&ax<=4&&y===roofY)chunkPut(x,y,z,roofBlock);
        if(az===4&&ax===4&&y===floor+3)chunkPut(x,y,z,'wood');
      }
      // V21: genuine small rooftop extensions, not floating decoration meshes.
      // All new solids are ABOVE the existing second floor/door clearance.
      // Sky-facing shape changes affect only Sonnen-Dorf houses #1 and #3.
      if(v===VILLAGES[0]&&ax<=1&&az<=1){
        const roofTop=sunRoofY(i,ax);
        if(i===1){
          // V24: niedriger Karten-Ausguck statt eines freistehenden Turms.
          // Die zwei Fenster sitzen direkt über der Dachschräge.
          if(y>roofTop&&y<=14&&(ax===1||az===1))
            chunkPut(x,y,z,y===14&&((rx===0)!==(rz===0))?'glass':'planks');
          if(y===15)chunkPut(x,y,z,'planks');
        }
        if(i===3){
          // V24: kompakter Wach-Ausguck. Der ursprüngliche 19-Blöcke-Turm
          // überragte das Dorf auf dem iPhone unverhältnismäßig stark.
          // Ein niedriger Turmkopf mit Lichtschlitzen bleibt wiedererkennbar.
          if(y>roofTop&&y<=15&&(ax===1||az===1))
            chunkPut(x,y,z,y===14&&((rx===0)!==(rz===0))?'glass':'cobble');
          if(y===16)chunkPut(x,y,z,'planks');
          if(y===17&&ax===1&&az===1)chunkPut(x,y,z,'cobble');
        }
      }
      // Kleine Eingangsstufe und hölzerner Vorbau.
      if(rz===4&&rx===0&&y===floor)chunkPut(x,y,z,'path');
      if(rz===4&&ax===2&&y>=floor+1&&y<=floor+3)chunkPut(x,y,z,'wood');
      if(rz===4&&ax<=2&&y===floor+4)chunkPut(x,y,z,'planks');
      // Blumenfenster und eine Laterne, ohne den Weg zuzustellen.
      if(rz===-4&&rx===0&&y===floor+2)chunkPut(x,y,z,i===2?'leaves':'blossom');
      // Simple illuminated frames and short window sills, not giant block awnings.
      if((ax===3&&az===1||az===3&&ax===1)&&y===floor+2)chunkPut(x,y,z,'glass');
      if(rz===4&&rx===0&&y===floor+4)chunkPut(x,y,z,'lantern');
      // V19: Beide südlichen Häuser erhalten einen Platz-Eingang nach NORDEN.
      // Bis V18 lag die einzige Tür nach Süden, vom Dorfplatz weg. Den alten
      // Ausgang behalten wir als Gartenausgang; die Welt bleibt begehbar.
      // Nur diese zwei Sonnen-Dorf-Wände werden geöffnet; persönliche Edits
      // überlagern wie bisher die gesamte Standard-Weltgeneration.
      if(v===VILLAGES[0]&&i>=2&&rx===0&&rz===-3&&y>=floor+1&&y<=floor+2)
        chunkPut(x,y,z,null);
      // Nordseitiger, 3 Felder breiter Zugang auf Höhe des Hausfußbodens.
      // Der freie, anschließende Dorfweg liegt bereits auf Terrainhöhe 5.
      if(v===VILLAGES[0]&&i>=2&&ax<=1&&rz>=-7&&rz<=-4){
        const pathY=rz>=-5?floor:terrainHeight(x,z)-1;
        if(y===pathY)chunkPut(x,y,z,'path');
        if(y>pathY&&y<=pathY+3)chunkPut(x,y,z,null);
        if(y<pathY&&y>=terrainHeight(x,z))chunkPut(x,y,z,'dirt');
      }
      // Ein schmaler dekorativer Schornstein über dem Dachrand.
      if((v!==VILLAGES[0]||i===0)&&i%2===0&&rx===2&&rz===-2&&y>=floor+6&&y<=floor+8)chunkPut(x,y,z,'cobble');
    }
    // Beleuchtete Wege und kleine Gartenbeete.
    if((crossX===5&&crossZ===5)||(crossX===13&&crossZ===3)){
      if(y>=5&&y<=6)chunkPut(x,y,z,'wood');
      if(y===7)chunkPut(x,y,z,'lantern');
    }
    // V14: Den V13-Pavillon bewusst wieder ENTFERNT.
    // Auf Augenhöhe blockierte er die südliche Einfahrt und den Blick auf den
    // Brunnen. Das Sonnen-Dorf erhält stattdessen offene Gartendetails als
    // schlanke Instanzmeshes (siehe makeSunVillageDetails). Kein zusätzlicher
    // Kollisionsblock wird in die zentrale Straße geschrieben.
    // V13: Vier kleine Obst- und Blütenbäume rahmen das Sonnen-Dorf ein.
    // Sie wachsen ausschließlich an festen, handgeprüften Randpositionen;
    // Hauptwege, Häuser, Brunnen, Markt und Einstiegspunkte bleiben frei.
    if(v===VILLAGES[0]){
      const orchard=[[-14,-1,'blossom'],[14,-2,'leaves'],[-2,-16,'blossom'],[-4,16,'leaves']];
      for(const [ox,oz,leaf] of orchard){
        const tx=v.x+ox,tz=v.z+oz,dx=x-tx,dz=z-tz;
        if(Math.abs(dx)>2||Math.abs(dz)>2)continue;
        const gh=terrainHeight(tx,tz),dy=y-gh;
        if(dx===0&&dz===0&&dy>=0&&dy<=4)chunkPut(x,y,z,'wood');
        if(dy>=3&&dy<=7){
          const layer=dy-3;
          const r=[1,2,2,1,0][layer];
          if(Math.abs(dx)<=r&&Math.abs(dz)<=r&&
            (Math.abs(dx)+Math.abs(dz)<=r*2-((layer===0||layer===4)?0:1))&&
            !(dx===0&&dz===0&&dy<=4))chunkPut(x,y,z,leaf);
        }
      }
    }
    // Dorfbrunnen bleibt unverändert benutzbar und interaktiv.
    if(crossX<=2&&crossZ<=2){
      if(y===5&&(crossX===2||crossZ===2))chunkPut(x,y,z,'cobble');
      if(y===5&&crossX<2&&crossZ<2)chunkPut(x,y,z,'water');
      if(v===VILLAGES[0]){
        // V14: DAS BRUNNENDACH IST OFFEN. Der V13-Holzklotz verdeckte die
        // gesamte Dorfstraße vom echten Augenstandpunkt aus. Nur niedrige
        // Sockel bleiben massive Bauvoxels; dünne Stützen und Querbalken
        // kommen als ressourcenschonende sichtbare Dekoration hinzu.
        if(y===6&&crossX===2&&crossZ===2)chunkPut(x,y,z,'wood');
      }else{
        if(y>=6&&y<=8&&crossX===2&&crossZ===2)chunkPut(x,y,z,'wood');
        if(y===9&&crossX<=2&&crossZ<=2)chunkPut(x,y,z,'planks');
      }
    }
  }
}
const LOOKOUT={x:77,z:58,name:'Himmelswarte'};
const FALL={x:75,z:-45,name:'Kristallfall'};
const RUIN={x:-77,z:-73,name:'Schattenruine'};
const CAMP={x:-24,z:54,name:'Waldlager'};
const DISCOVERY_KEY='blockwelt-entdeckerbuch-v10';
const RELICS_KEY='blockwelt-relikte-v10';
const DISCOVERIES=[{id:'home',name:'Startwiese',x:0,z:6,emoji:'🌿'},{id:'sun',name:'Sonnen-Dorf',x:47,z:9,emoji:'🏘️'},{id:'birch',name:'Birken-Dorf',x:-53,z:-48,emoji:'🏡'},{id:'lookout',name:'Himmelswarte',x:77,z:58,emoji:'🏰'},{id:'falls',name:'Kristallfall',x:75,z:-45,emoji:'💦'},{id:'ruin',name:'Schattenruine',x:-77,z:-73,emoji:'🗝️'},{id:'camp',name:'Waldlager',x:CAMP.x,z:CAMP.z,emoji:'⛺'}];
const RELIC_PLACES=[{id:'lookout',name:'Sternenstein',x:LOOKOUT.x+7,z:LOOKOUT.z+5},{id:'falls',name:'Wassertropfen',x:FALL.x-7,z:FALL.z+5},{id:'ruin',name:'Mondsplitter',x:RUIN.x+2,z:RUIN.z+4}];
const lookoutTop=(()=>{
  let top=0;
  for(let x=LOOKOUT.x-5;x<=LOOKOUT.x+5;x++)for(let z=LOOKOUT.z-5;z<=LOOKOUT.z+5;z++)top=Math.max(top,terrainHeight(x,z));
  return Math.min(44,top+1);
})();
function addAdventureLandmarks(xmin,xmax,zmin,zmax){
  // Himmelswarte V9: Burgwarte mit Zinnen, Seitentürmen und Torbogen.
  // Alle Bauteile bleiben chunkübergreifend deterministisch.
  for(let x=Math.max(xmin,LOOKOUT.x-10);x<=Math.min(xmax,LOOKOUT.x+10);x++)
  for(let z=Math.max(zmin,LOOKOUT.z-9);z<=Math.min(zmax,LOOKOUT.z+9);z++){
    const dx=x-LOOKOUT.x,dz=z-LOOKOUT.z,ax=Math.abs(dx),az=Math.abs(dz);
    const ground=terrainHeight(x,z);
    if(ax<=4&&az<=4){
      for(let y=ground;y<=lookoutTop;y++)put(x,y,z,y===lookoutTop?'cobble':'stone');
    }
    // Main tower with a 2-block-high entrance, upper windows and battlements.
    if(ax<=3&&az<=3){
      for(let y=lookoutTop+1;y<=lookoutTop+12;y++){
        if(ax===3||az===3){
          if(dz===3&&dx===0&&y<=lookoutTop+3)continue;
          const window=(y===lookoutTop+7||y===lookoutTop+8)&&
            ((ax===3&&az===0)||(az===3&&ax===0));
          put(x,y,z,window?'glass':y%5===0?'cobble':'stone');
        }
      }
      if(lookoutTop+13<=MAX_Y)put(x,lookoutTop+13,z,'planks');
      if((ax===3||az===3)&&(ax+az)%2===1&&lookoutTop+14<=MAX_Y)put(x,lookoutTop+14,z,'cobble');
    }
    // Two asymmetric smaller defensive turrets, linked by a low stone wall.
    for(const [tx,tz,levels] of [[-8,-4,8],[8,-4,10]]){
      const ux=Math.abs(dx-tx),uz=Math.abs(dz-tz);
      if(ux<=2&&uz<=2){
        const base=lookoutTop;
        for(let y=ground;y<=Math.min(MAX_Y,base+levels);y++){
          if(y<=base||ux===2||uz===2){
            const isWindow=y===base+levels-3&&((ux===2&&uz===0)||(uz===2&&ux===0));
            put(x,y,z,isWindow?'glass':'cobble');
          }
        }
        if(ux<=2&&uz<=2&&base+levels+1<=MAX_Y)put(x,base+levels+1,z,'planks');
        if((ux===2||uz===2)&&((dx+dz)&1)&&base+levels+2<=MAX_Y)put(x,base+levels+2,z,'stone');
      }
    }
    // Low walls and simple crenellations create the silhouette of a hilltop castle.
    if(dz===-4&&ax<=8&&lookoutTop-1>=ground){
      for(let y=lookoutTop-1;y<=lookoutTop+1;y++)put(x,y,z,'cobble');
      if(dx%3===0)put(x,lookoutTop+2,z,'stone');
    }
    if(dx===0&&dz===-5&&lookoutTop+4<=MAX_Y)put(x,lookoutTop+4,z,'lantern');
  }
  // Kristallfall V9: breiter, unregelmäßiger Felsbogen statt schlankem Quader.
  // Der Fall liegt außerhalb der ursprünglichen 64×64-Bauwelt.
  const wx=FALL.x,wz=FALL.z;
  const fallX0=wx-6,fallX1=wx+11,fallZ0=wz-9,fallZ1=wz+9;
  const topFall=Math.min(30,terrainHeight(wx+5,wz)+12);
  for(let x=Math.max(xmin,fallX0);x<=Math.min(xmax,fallX1);x++)
  for(let z=Math.max(zmin,fallZ0);z<=Math.min(zmax,fallZ1);z++){
    const dx=x-wx,dz=z-wz;
    const centered=Math.abs(dz),behind=dx>=0;
    const raised=13.2-Math.abs(dx-4)*1.25-centered*1.1+
      (pixelHash(x,z,219)-.5)*3.1;
    const base=terrainHeight(x,z);
    const rockyTop=Math.min(37,Math.round(base+Math.max(0,raised)));
    // Front face is terraced stone rather than a solid rectangular wall.
    if(rockyTop>base+1){
      for(let y=base;y<=rockyTop;y++){
        const rocky= y>=rockyTop-1&&centered>5?'grass':y>=27&&centered>5?'snow':'stone';
        put(x,y,z,rocky);
      }
    }
    // Uneven stepped shelves at the foot of the rock face.
    if(dx<=-1&&dx>=-5&&centered<7&&base<=WATER_LEVEL+3){
      const stepHeight=Math.max(base,Math.round(6+(dx+5)*.65-(centered>4?1:0)));
      for(let y=base;y<=Math.min(12,stepHeight);y++)put(x,y,z,y===stepHeight?'cobble':'stone');
    }
    // A visible, two-block-wide waterfall follows the front rock edge.
    // From above it descends along staggered steps into the lower pool.
    if(centered<=1){
      if(dx===-1){
        for(let y=Math.max(WATER_LEVEL,base);y<=topFall;y++)put(x,y,z,'water');
      }
      if(dx===0){
        for(let y=Math.max(9,base);y<=topFall;y++)put(x,y,z,'water');
      }
      if(dx>=1&&dx<=3&&topFall>=base){
        const ledge=topFall-Math.max(0,3-dx);
        if(ledge>=base)put(x,ledge,z,'water');
      }
    }
  }
  // Schattenruine: eine begehbare, abseits der alten Welt gelegene Ruine.
  // Grundriss, Tordurchgang und Mauern werden ohne Zufall erzeugt.
  const rFloor=terrainHeight(RUIN.x,RUIN.z)+2;
  for(let x=Math.max(xmin,RUIN.x-10);x<=Math.min(xmax,RUIN.x+10);x++)
  for(let z=Math.max(zmin,RUIN.z-10);z<=Math.min(zmax,RUIN.z+10);z++){
    const dx=x-RUIN.x,dz=z-RUIN.z,ax=Math.abs(dx),az=Math.abs(dz);
    const earth=terrainHeight(x,z);
    if(ax<=7&&az<=7){
      // Begehbarer Innenhof: niedrige Stellen auffüllen, hohe Stellen abtragen.
      if(earth>rFloor){for(let y=rFloor;y<earth;y++)put(x,y,z,null);}
      else for(let y=earth;y<rFloor;y++)put(x,y,z,'stone');
      put(x,rFloor,z,(dx*3+dz*5)%7===0?'cobble':'path');
    }
    const outer=ax===7||az===7;
    const entrance=dz===7&&ax<=1;
    const broken=(pixelHash(x,z,785)>.75?1:0);
    const maxH=rFloor+3+broken+Math.floor(pixelHash(x,z,789)*3);
    if(outer&&ax<=7&&az<=7&&!entrance){
      for(let y=rFloor+1;y<=Math.min(maxH,MAX_Y);y++)put(x,y,z,(x+z+y)%5===0?'cobble':'stone');
    }
    if(dz===7&&ax<=1&&dx!==0){
      for(let y=rFloor+4;y<=rFloor+6;y++)put(x,y,z,'cobble');
    }
    // Vorhof-Torbogen, mittlerer Durchgang: zwei Blöcke breit und drei hoch.
    if(dz===9&&ax<=3){
      if(ax===3)for(let y=rFloor+1;y<=rFloor+6;y++)put(x,y,z,'stone');
      if(rFloor+6<=MAX_Y)put(x,rFloor+6,z,'cobble');
    }
    if(ax===0&&az===0)put(x,rFloor+1,z,'gold');
    if((ax===5&&az===4)||(ax===4&&az===5))put(x,rFloor+1,z,'lantern');
    if(ax===9&&az<=2&&pixelHash(x,z,792)>.6)put(x,earth,z,'cobble');
  }
  // Shallow irregular lagoon, edges and river outlet make the waterfall feel connected.
  for(let x=Math.max(xmin,wx-9);x<=Math.min(xmax,wx-2);x++)
  for(let z=Math.max(zmin,wz-7);z<=Math.min(zmax,wz+7);z++){
    const d=((x-(wx-5))/5)**2+((z-wz)/6.2)**2;
    if(d>1.15)continue;
    const floor=terrainHeight(x,z);
    if(d<.90){
      if(floor<=WATER_LEVEL+1)for(let y=floor;y<=WATER_LEVEL+1;y++)put(x,y,z,'water');
      else if(floor<=WATER_LEVEL+3)put(x,floor,z,'water');
    }else if(floor<=WATER_LEVEL+2)put(x,floor,z,'cobble');
  }
}
// New V11 destination. A low-impact woodland campsite built from the game's
// existing block palette. Blocks are regenerated deterministically per chunk.
function addForestCamp(xmin,xmax,zmin,zmax){
  const cx=CAMP.x,cz=CAMP.z;
  if(cx+7<xmin||cx-7>xmax||cz+7<zmin||cz-7>zmax)return;
  // If an existing world already contains a build here, preserve it in full.
  // Do not place a landmark through somebody's house or childhood creation.
  for(const [x,,z] of edits.values()){
    if(Math.abs(x-cx)<=8&&Math.abs(z-cz)<=8)return;
  }
  const floor=terrainHeight(cx,cz);
  for(let x=Math.max(xmin,cx-7);x<=Math.min(xmax,cx+7);x++)
  for(let z=Math.max(zmin,cz-7);z<=Math.min(zmax,cz+7);z++){
    const dx=x-cx,dz=z-cz,r=Math.hypot(dx,dz);
    if(r>6.4)continue;
    const ground=terrainHeight(x,z);
    // Level a small clearing; existing user edits are applied afterwards.
    if(r<=5.3){
      for(let y=Math.min(ground,floor);y<floor;y++)put(x,y,z,'dirt');
      for(let y=floor+1;y<=Math.min(MAX_Y,Math.max(floor+9,ground+10));y++)put(x,y,z,null);
      put(x,floor,z,r<2.5?'cobble':pixelHash(x,z,1221)>.60?'path':'grass');
    }
    // Two small seats and a fire pit (a lantern, NOT a damaging fire).
    if(Math.abs(dx)<=1&&Math.abs(dz)<=1&&r>=1&&r<=1.6&&floor+1<=MAX_Y){
      put(x,floor+1,z,'cobble');
    }
    if(dx===0&&dz===0)put(x,floor+1,z,'lantern');
    if((dx===-4||dx===4)&&Math.abs(dz)<=1)put(x,floor+1,z,'planks');
    // An open A-frame shelter at the rear of the clearing.
    if(dx>=-2&&dx<=2&&dz>=-5&&dz<=-2){
      const ax=Math.abs(dx);
      if(floor+1<=MAX_Y)put(x,floor+1,z,'planks');
      const roofY=floor+4-ax;
      if(roofY<=MAX_Y)put(x,roofY,z,'wood');
      if(dz===-5&&dx!==0&&floor+2<=MAX_Y)put(x,floor+2,z,'planks');
      if(dz===-5&&dx===0&&floor+3<=MAX_Y)put(x,floor+3,z,'lantern');
    }
    // Trail marker at the clearing entrance.
    if(dx===0&&dz===5){
      put(x,floor+1,z,'wood');put(x,floor+2,z,'wood');
      put(x,floor+3,z,'lantern');
    }
  }
}
function generatedTreeAt(ax,az){
  if(inLegacy(ax,az)||inVillage(ax,az)||lakeDistance(ax,az)<10||Math.hypot(ax-RUIN.x,az-RUIN.z)<15)return false;
  if(Math.abs(ax)>=HALF-4||Math.abs(az)>=HALF-4)return false;
  const b=biomeAt(ax,az),h=terrainHeight(ax,az);
  if(b==='wueste'||b==='see'||h>20)return false;
  return pixelHash(ax,az,40) > (b==='nadelwald'?.27:.48);
}
function decorateChunkTree(ax,az,xmin,xmax,zmin,zmax){
  if(!generatedTreeAt(ax,az))return;
  const h=terrainHeight(ax,az),conifer=biomeAt(ax,az)==='nadelwald';
  const tall=pixelHash(ax,az,122)>.68;
  const high=conifer?(tall?9:7):(tall?7:5);
  const blossom=!conifer&&pixelHash(ax,az,92)>.82;
  function setIfInside(x,y,z,type){
    if(x<xmin||x>xmax||z<zmin||z>zmax||inLegacy(x,z))return;
    if(y<terrainHeight(x,z)||y>MAX_Y)return;
    if(!get(x,y,z))put(x,y,z,type);
  }
  // Stämme wachsen versetzt zu unterschiedlich hohen Baumkronen.
  for(let dy=0;dy<high;dy++)setIfInside(ax,h+dy,az,'wood');
  if(conifer){
    // Drei gestaffelte Tannenebenen statt einer perfekten quadratischen Krone.
    for(let dy=2;dy<high+3;dy++){
      const radius=(dy%3===2&&dy<high)?2:dy>=high+1?0:1;
      for(let dx=-radius;dx<=radius;dx++)for(let dz=-radius;dz<=radius;dz++){
        if(radius===2&&Math.abs(dx)===2&&Math.abs(dz)===2)continue;
        setIfInside(ax+dx,h+dy,az+dz,'leaves');
      }
    }
  }else{
    // Eichen & Blütenbäume: lockere, abgestufte Kronen mit sichtbaren Ästen.
    const leaf=blossom?'blossom':'leaves';
    const crownBase=high-2;
    const layers=[2,3,3,2,1];
    for(let layer=0;layer<layers.length;layer++){
      const dy=crownBase+layer;
      const radius=layers[layer]-(tall?0:layer===1?1:0);
      for(let dx=-radius;dx<=radius;dx++)for(let dz=-radius;dz<=radius;dz++){
        const roundness=(dx*dx+dz*dz)/(radius*radius||1);
        if(roundness>1.58)continue;
        if(roundness>1.2&&pixelHash(ax+dx,az+dz,dy+677)>.35)continue;
        setIfInside(ax+dx,h+dy,az+dz,leaf);
      }
    }
    for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
      if(pixelHash(ax+dx,az+dz,211)>.38)setIfInside(ax+dx,h+high-2,az+dz,'wood');
    }
  }
}
function isLegacyChunk(cx,cz){return !isMeadow()&&cx>=-2&&cx<=1&&cz>=-2&&cz<=1;}
function generateChunkData(cx,cz){
  if(isLegacyChunk(cx,cz)||generatedChunks.has(chunkKey(cx,cz)))return;
  if(isMeadow()){
    // No adventuring terrain, trees, ruins, water, flowers, animals or houses.
    // Chunks contain only grass / dirt / bedrock-like stone; saved builds win.
    for(let x=cx*CHUNK;x<(cx+1)*CHUNK;x++)for(let z=cz*CHUNK;z<(cz+1)*CHUNK;z++){
      for(let y=0;y<MEADOW_HEIGHT;y++)
        put(x,y,z,y===MEADOW_HEIGHT-1?'grass':y>=MEADOW_HEIGHT-3?'dirt':'stone');
    }
    // Erzeugte Festungsblöcke zuerst, persönliche Änderungen zuletzt.
    addNetherChunk(cx,cz);
    const xmin=cx*CHUNK,zmin=cz*CHUNK;
    for(const edit of edits.values()){
      const [x,y,z,type]=edit;
      if(x>=xmin&&x<xmin+CHUNK&&z>=zmin&&z<zmin+CHUNK)put(x,y,z,type);
    }
    generatedChunks.add(chunkKey(cx,cz));
    return;
  }
  const xmin=cx*CHUNK,xmax=xmin+CHUNK-1,zmin=cz*CHUNK,zmax=zmin+CHUNK-1;
  for(let x=xmin;x<=xmax;x++)for(let z=zmin;z<=zmax;z++){
    const h=terrainHeight(x,z),biome=biomeAt(x,z);
    for(let y=0;y<h;y++){
      let type=y===h-1?'grass':y>=h-4?'dirt':'stone';
      if(biome==='wueste'||biome==='see')type=y>=h-3?'sand':'stone';
      if(biome==='berge'&&y>=h-3)type='stone';
      if(biome==='berge'&&h>=27&&y===h-1)type='snow';
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
      for(let y=3;y<=(village===VILLAGES[0]?24:15);y++)villageBlocks(x,z,y,put);
    }
  }
  // Two adventure landmarks outside the original V3 64×64 region.
  addAdventureLandmarks(xmin,xmax,zmin,zmax);
  addForestCamp(xmin,xmax,zmin,zmax);
  // Persist the player's builds on top of deterministic terrain.
  for(const edit of edits.values()){
    const [x,y,z,type]=edit;
    if(x>=xmin&&x<=xmax&&z>=zmin&&z<=zmax)put(x,y,z,type);
  }
  generatedChunks.add(chunkKey(cx,cz));
}
function disposeChunkMesh(id){
  for(const mesh of chunkMeshes.get(id)||[]){
    scene.remove(mesh);
    if(mesh.isInstancedMesh)mesh.dispose();
    else mesh.geometry.dispose();
  }
  chunkMeshes.delete(id);
  for(const mesh of decorativeMeshes.get(id)||[]){scene.remove(mesh);mesh.dispose();}
  decorativeMeshes.delete(id);
}
function unloadChunkData(cx,cz){
  if(isLegacyChunk(cx,cz))return;
  const id=chunkKey(cx,cz);
  if(!generatedChunks.delete(id))return;
  for(let x=cx*CHUNK;x<(cx+1)*CHUNK;x++)for(let z=cz*CHUNK;z<(cz+1)*CHUNK;z++){
    for(let y=BUNKER_FLOOR;y<=MAX_Y+7;y++)blocks.delete(key(x,y,z));
  }
}
// Fernansicht als ein einziges, billiges Farbgitter. Nur nicht-geladene Chunks:
// Dadurch bleiben Turmsilhouetten sichtbar, ohne 30 weitere Echt-Chunks zu laden.
let netherFarMesh=null;
const netherFarMaterial=new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide,fog:true});
// A single mipmapped atlas keeps the same stone pattern across chunk boundaries.
const farAtlas=document.createElement('canvas');
farAtlas.width=farAtlas.height=512;
const farContext=farAtlas.getContext('2d');
const farTiles=new Map();
for(const [i,type] of Object.keys(reliefColors).filter(type=>type!=='grass').entries()){
  const x=(i%4)*128,y=Math.floor(i/4)*128;
  farContext.drawImage(materialByType[type][0].map.image,x,y,128,128);
  farTiles.set(type,[x,y]);
}
farContext.fillStyle='#fff';
farContext.fillRect(0,384,128,128);
const farMap=new THREE.CanvasTexture(farAtlas);
farMap.colorSpace=THREE.SRGBColorSpace;
netherFarMaterial.map=farMap;
const netherFarPalette={
  netherBrick:'#794f5e',netherDeep:'#45425a',netherTrim:'#b57483',
  netherGold:'#e3ac57',lavaGlow:'#ff842c',lantern:'#ffd079',
  grass:'#5e8c4b',dirt:'#73583b',stone:'#7d8285',
  wood:'#8c6849',leaves:'#538650',blossom:'#d988af',cobble:'#85948b',path:'#bda077'
};
function rebuildNetherFarView(cx,cz,radius){
  if(netherFarMesh){scene.remove(netherFarMesh);netherFarMesh.geometry.dispose();netherFarMesh=null;}
  if(!isMeadow())return;
  const plan=makeNetherPlan();
  const all=netherPlanVoxels;
  const vertices=[],colors=[],uvs=[];
  const faceTable=[
    {d:[1,0,0],shade:.81,v:[[1,0,0],[1,1,0],[1,1,1],[1,0,1]]},
    {d:[-1,0,0],shade:.70,v:[[0,0,1],[0,1,1],[0,1,0],[0,0,0]]},
    {d:[0,1,0],shade:1.13,v:[[0,1,0],[0,1,1],[1,1,1],[1,1,0]]},
    {d:[0,-1,0],shade:.58,v:[[0,0,1],[0,0,0],[1,0,0],[1,0,1]]},
    {d:[0,0,1],shade:.89,v:[[1,0,1],[1,1,1],[0,1,1],[0,0,1]]},
    {d:[0,0,-1],shade:.76,v:[[0,0,0],[0,1,0],[1,1,0],[1,0,0]]}
  ];
  const colorObjects={};
  const getTone=type=>colorObjects[type]||(colorObjects[type]=new THREE.Color(netherFarPalette[type]||'#7b737b'));
  const order=[0,1,2,0,2,3];
  for(const [id,list] of plan){
    const [pcx,pcz]=id.split(',').map(Number);
    if(Math.abs(pcx-cx)<=radius&&Math.abs(pcz-cz)<=radius)continue;
    for(const [x,y,z,baseType] of list){
      const k=key(x,y,z);
      const type=edits.has(k)?edits.get(k)[3]:baseType;
      if(!type)continue;
      const tile=farTiles.get(type);
      const base=tile?null:getTone(type);
      for(const face of faceTable){
        const nx=x+face.d[0],ny=y+face.d[1],nz=z+face.d[2];
        const nk=key(nx,ny,nz),neighbor=edits.has(nk)?edits.get(nk)[3]:all.get(nk);
        if(neighbor)continue;
        const c=tile?new THREE.Color().setScalar(face.shade*.92):base.clone().multiplyScalar(face.shade);
        const [tx,ty]=tile??[0,384];
        for(const j of order){
          const v=face.v[j];vertices.push(x+v[0],y+v[1],z+v[2]);
          colors.push(c.r,c.g,c.b);
          const u=j>=2?125:3;
          const height=face.d[1]===0?v[1]:(j===1||j===2?1:0);
          uvs.push((tx+u)/512,1-(ty+(height?3:125))/512);
        }
      }
    }
  }
  if(!vertices.length)return;
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  geometry.computeVertexNormals();geometry.computeBoundingSphere();
  netherFarMesh=new THREE.Mesh(geometry,netherFarMaterial);
  netherFarMesh.renderOrder=-1;
  scene.add(netherFarMesh);
}

function updateWorldStream(force=false){
  const cx=Math.floor(player.x/CHUNK),cz=Math.floor(player.z/CHUNK);
  const radius=STREAM_RADIUS;
  const id=chunkKey(cx,cz)+'/'+radius;
  if(!force&&id===lastStreamCenter)return;
  lastStreamCenter=id;
  const desired=new Set();
  // Generate data in a one-chunk halo to avoid incorrect open edges.
  for(let dx=-radius-1;dx<=radius+1;dx++)for(let dz=-radius-1;dz<=radius+1;dz++){
    const x=cx+dx,z=cz+dz;
    if(x<-chunksPerSide||x>=chunksPerSide||z<-chunksPerSide||z>=chunksPerSide)continue;
    generateChunkData(x,z);
  }
  for(let dx=-radius;dx<=radius;dx++)for(let dz=-radius;dz<=radius;dz++){
    const x=cx+dx,z=cz+dz;
    if(x<-chunksPerSide||x>=chunksPerSide||z<-chunksPerSide||z>=chunksPerSide)continue;
    const key=chunkKey(x,z);desired.add(key);
    if(!chunkMeshes.has(key))rebuildChunk(x,z);
  }
  for(const id of [...chunkMeshes.keys()])if(!desired.has(id))disposeChunkMesh(id);
  for(const id of [...generatedChunks]){
    const [x,z]=id.split(',').map(Number);
    if(Math.max(Math.abs(cx-x),Math.abs(cz-z))>radius+1)unloadChunkData(x,z);
  }
  // Vereinfachte Berg-, Wald- und See-Silhouetten weit hinter den echten Baublöcken.
  rebuildDistantLandscape(cx,cz);
  rebuildNetherFarView(cx,cz,radius);
}
// V7 FERNLANDSCHAFT: Ein zusammengefasstes Geometrieobjekt statt hunderter echter Chunks.
// Diese Meshes sind KEINE Baublöcke, keine Kollisionskörper und nicht anvisierbar.
const lodMaterial = new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide,fog:true});
const lodTreeTrunkMat = new THREE.MeshLambertMaterial({color:'#896e4d',fog:true});
const lodTreeLeafMat = new THREE.MeshLambertMaterial({color:'#699c62',fog:true});
const lodTreeTrunkGeo = new THREE.BoxGeometry(.7,3.4,.7);
const lodTreeLeafGeo = new THREE.BoxGeometry(3.3,3.3,3.3);
const lodPalette={
  grass:new THREE.Color('#78b95c'),grass2:new THREE.Color('#6cae61'),
  sand:new THREE.Color('#dbc68f'),stone:new THREE.Color('#8e9c9a'),
  snow:new THREE.Color('#e6f1f3'),water:new THREE.Color('#64b8d3'),
  forest:new THREE.Color('#649f57'),village:new THREE.Color('#93b975')
};
let distantTerrain=null,distantTreeTrunks=null,distantTreeCrowns=null;
function clearDistantLandscape(){
  if(distantTerrain){scene.remove(distantTerrain);distantTerrain.geometry.dispose();distantTerrain=null;}
  if(distantTreeTrunks){scene.remove(distantTreeTrunks);distantTreeTrunks.dispose();distantTreeTrunks=null;}
  if(distantTreeCrowns){scene.remove(distantTreeCrowns);distantTreeCrowns.dispose();distantTreeCrowns=null;}
}
function rebuildDistantLandscape(cx,cz){
  clearDistantLandscape();
  const radius=STREAM_RADIUS;
  const ring=farView?(MOBILE?6:7):4;
  const positions=[],colors=[];
  const step=2,trees=[];
  const addTri=(a,b,c,col,shade=1)=>{
    positions.push(...a,...b,...c);
    for(let i=0;i<3;i++)colors.push(col.r*shade,col.g*shade,col.b*shade);
  };
  const quad=(a,b,c,d,col,shade=1)=>{addTri(a,b,c,col,shade);addTri(a,c,d,col,shade);};
  const elevation=(x,z)=>{
    if(x<-HALF||x>=HALF||z<-HALF||z>=HALF)return 0;
    const h=terrainHeight(x,z);
    return !isMeadow()&&lakeDistance(x,z)<0&&h<=WATER_LEVEL ? WATER_LEVEL+.07 : h-.035;
  };
  for(let ox=-ring;ox<=ring;ox++)for(let oz=-ring;oz<=ring;oz++){
    if(Math.max(Math.abs(ox),Math.abs(oz))<=radius)continue;
    const ccx=cx+ox,ccz=cz+oz;
    if(ccx<-chunksPerSide||ccx>=chunksPerSide||ccz<-chunksPerSide||ccz>=chunksPerSide)continue;
    const xmin=ccx*CHUNK,zmin=ccz*CHUNK;
    for(let x=xmin;x<xmin+CHUNK;x+=step)for(let z=zmin;z<zmin+CHUNK;z+=step){
      const midX=x+1,midZ=z+1;
      const h=terrainHeight(midX,midZ),biome=biomeAt(midX,midZ);
      const water=!isMeadow()&&lakeDistance(midX,midZ)<0&&h<=WATER_LEVEL;
      const y=water?WATER_LEVEL+.07:h-.035;
      const col=water?lodPalette.water:h>=27&&biome==='berge'?lodPalette.snow:
        biome==='berge'||biome==='fels'?lodPalette.stone:
        biome==='wueste'||biome==='sand'||biome==='see'?lodPalette.sand:
        biome==='dorf'?lodPalette.village:
        biome==='nadelwald'?lodPalette.forest:
        (pixelHash(x,z,77)>.54?lodPalette.grass:lodPalette.grass2);
      const shade=.94+pixelHash(x,z,91)*.10;
      quad([x,y,z],[x,y,z+step],[x+step,y,z+step],[x+step,y,z],col,shade);
      // Four closed sides avoid the thin hovering wireframe appearance of V7/V8.
      // Subtract a tiny overlap to prevent cracks caused by different height samples.
      const neighbors=[
        {nx:x-1,nz:midZ,side:'w'}, {nx:x+step+1,nz:midZ,side:'e'},
        {nx:midX,nz:z-1,side:'n'}, {nx:midX,nz:z+step+1,side:'s'}
      ];
      for(const n of neighbors){
        const outside=n.nx<-HALF||n.nx>=HALF||n.nz<-HALF||n.nz>=HALF;
        // At the world boundary, close the ground down toward the beach horizon.
        const other=outside?Math.max(0,y-6):elevation(n.nx,n.nz);
        if(y-other<.48)continue;
        const down=Math.max(other-.09,y-36);
        const rock=water?lodPalette.water:col===lodPalette.snow?lodPalette.stone:lodPalette.stone;
        if(n.side==='w')quad([x,y,z],[x,down,z],[x,down,z+step],[x,y,z+step],rock,.72);
        if(n.side==='e')quad([x+step,y,z+step],[x+step,down,z+step],[x+step,down,z],[x+step,y,z],rock,.80);
        if(n.side==='n')quad([x+step,y,z],[x+step,down,z],[x,down,z],[x,y,z],rock,.70);
        if(n.side==='s')quad([x,y,z+step],[x,down,z+step],[x+step,down,z+step],[x+step,y,z+step],rock,.80);
      }
    }
    for(let gx=Math.floor((xmin-6)/8)*8;gx<xmin+CHUNK+6;gx+=8)
    for(let gz=Math.floor((zmin-6)/8)*8;gz<zmin+CHUNK+6;gz+=8){
      const ax=gx+Math.floor(pixelHash(gx,gz,51)*3)-1;
      const az=gz+Math.floor(pixelHash(gx,gz,52)*3)-1;
      if(Math.floor(ax/CHUNK)!==ccx||Math.floor(az/CHUNK)!==ccz)continue;
      if(!isMeadow()&&generatedTreeAt(ax,az)&&trees.length<320)trees.push([ax,terrainHeight(ax,az),az]);
    }
  }
  if(positions.length){
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    geo.computeVertexNormals();geo.computeBoundingSphere();
    distantTerrain=new THREE.Mesh(geo,lodMaterial);
    distantTerrain.frustumCulled=true;distantTerrain.renderOrder=-2;
    scene.add(distantTerrain);
  }
  if(trees.length){
    distantTreeTrunks=new THREE.InstancedMesh(lodTreeTrunkGeo,lodTreeTrunkMat,trees.length);
    distantTreeCrowns=new THREE.InstancedMesh(lodTreeLeafGeo,lodTreeLeafMat,trees.length);
    for(let i=0;i<trees.length;i++){
      const [x,y,z]=trees[i], conifer=biomeAt(x,z)==='nadelwald';
      const tall=conifer?1.14:.95;
      dummy.position.set(x+.5,y+1.7*tall,z+.5);dummy.rotation.set(0,0,0);
      dummy.scale.set(1,tall,1);dummy.updateMatrix();distantTreeTrunks.setMatrixAt(i,dummy.matrix);
      dummy.position.set(x+.5,y+4.65*tall,z+.5);
      dummy.scale.set(conifer?.78:1,conifer?1.36:.93,conifer?.78:1);
      dummy.updateMatrix();distantTreeCrowns.setMatrixAt(i,dummy.matrix);
      distantTreeCrowns.setColorAt(i,new THREE.Color(pixelHash(x,z,88)>.5?'#568c50':'#7bad62'));
    }
    distantTreeTrunks.instanceMatrix.needsUpdate=true;distantTreeCrowns.instanceMatrix.needsUpdate=true;
    distantTreeCrowns.instanceColor.needsUpdate=true;
    distantTreeTrunks.computeBoundingSphere();distantTreeCrowns.computeBoundingSphere();
    scene.add(distantTreeTrunks,distantTreeCrowns);
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
  if(isMeadow())return; // Stream the entire flat meadow, including central chunks.
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
    const arr=JSON.parse(localStorage.getItem(currentSaveKey())||'[]');
    if(!Array.isArray(arr))return;
    const repairBunker=isMeadow()&&localStorage.getItem('blockwelt-bunker-passage-v87')!=='1';
    for(const item of arr){
      if(!Array.isArray(item)||item.length!==4)continue;
      const [x,y,z,type]=item;
      if(![x,y,z].every(Number.isInteger)||x< -HALF||x>=HALF||z< -HALF||z>=HALF||y<BUNKER_FLOOR||y>MAX_Y)continue;
      if(type!==null&&!BLOCK_TYPES.includes(type))continue;
      // Restore the walking lane and the bottom landing from the generated plan.
      if(repairBunker&&x>=18&&x<=20&&z>=-12&&z<=1&&
        y>=Math.max(-6,3+z)&&y<=Math.max(4,5+z))continue;
      if(!isMeadow()&&inLegacy(x,z))put(x,y,z,type);edits.set(key(x,y,z),item);
    }
    if(repairBunker){
      localStorage.setItem(currentSaveKey(),JSON.stringify([...edits.values()]));
      localStorage.setItem('blockwelt-bunker-passage-v87','1');
    }
  }catch(e){console.warn('Spielstand konnte nicht geladen werden',e);}
}
function saveEdits(){
  castleLightCell=null;
  tuftRegion='';
  try{localStorage.setItem(currentSaveKey(),JSON.stringify([...edits.values()]));}
  catch(e){toast('Speichern ist auf diesem Gerät nicht möglich');}
}
// Chunked instanced rendering avoids reconstructing the entire world after each tap.
const dummy=new THREE.Object3D();
const chunkKey=(cx,cz)=>`${cx},${cz}`;
function rebuildChunk(cx,cz){
  if(cx<-HALF/CHUNK||cx>=HALF/CHUNK||cz<-HALF/CHUNK||cz>=HALF/CHUNK)return;
  const id=chunkKey(cx,cz);
  disposeChunkMesh(id);
  const surfaces=new Map();
  const waterFaces={top:[],left:[],right:[],front:[],back:[]};
  for(let x=cx*CHUNK;x<(cx+1)*CHUNK;x++)for(let z=cz*CHUNK;z<(cz+1)*CHUNK;z++){
    for(let y=BUNKER_FLOOR;y<=MAX_Y+8;y++){
      const type=get(x,y,z);
      if(!type)continue;
      if(type==='water'){
        const air=(a,b,c)=>!get(a,b,c);
        // Nur Oberflächen und äußere Seiten; kein Würfelgitter im Seeinneren.
        if(air(x,y+1,z))waterFaces.top.push([x,y,z]);
        if(air(x-1,y,z))waterFaces.left.push([x,y,z]);
        if(air(x+1,y,z))waterFaces.right.push([x,y,z]);
        if(air(x,y,z-1))waterFaces.front.push([x,y,z]);
        if(air(x,y,z+1))waterFaces.back.push([x,y,z]);
        continue;
      }

      // Cheap voxel AO: shadow the base of walls and sheltered nooks without GPU shadow maps.
      // This is evaluated only when a chunk is built, not every render frame.
      let faceMask=0;
      for(let face=0;face<6;face++){
        const [dx,dy,dz]=blockFaceOffsets[face];
        const neighbor=get(x+dx,y+dy,z+dz);
        if(!neighbor||neighbor==='water'||(neighbor==='glass'&&type!=='glass'))
          faceMask|=1<<face;
      }
      if(!faceMask)continue;
      const fortressStone=type.startsWith('nether');
      const variation=.95+pixelHash(x,z,y+811)*.10;
      const overhead=!!get(x,y+1,z);
      const closeWalls=Number(!!get(x-1,y,z))+Number(!!get(x+1,y,z))+
        Number(!!get(x,y,z-1))+Number(!!get(x,y,z+1));
      const shade=fortressStone
        ? Math.max(.88,variation*(overhead?.98:1)*(1-Math.min(3,closeWalls)*.017))
        : Math.max(.67,variation*(overhead?.88:1)*(1-Math.min(3,closeWalls)*.037));
      for(let face=0;face<6;face++){
        const [dx,dy,dz]=blockFaceOffsets[face];
        if(!(faceMask&(1<<face)))continue;
        const material=materialByType[type][face];
        let surface=surfaces.get(material);
        if(!surface){
          surface={positions:[],normals:[],uvs:[],colors:[],indices:[],glass:type==='glass'};
          surfaces.set(material,surface);
        }
        const base=surface.positions.length/3;
        const position=blockGeo.attributes.position;
        const uv=blockGeo.attributes.uv;
        for(let vertex=face*4;vertex<face*4+4;vertex++){
          surface.positions.push(x+.5+position.getX(vertex),y+.5+position.getY(vertex),z+.5+position.getZ(vertex));
          surface.normals.push(dx,dy,dz);
          surface.uvs.push(uv.getX(vertex),uv.getY(vertex));
          surface.colors.push(shade,shade,shade);
        }
        for(let index=face*6;index<face*6+6;index++)
          surface.indices.push(base+blockGeo.index.getX(index)-face*4);
      }
    }
  }
  const chunk=[];
  for(const [material,surface] of surfaces){
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(surface.positions,3));
    geometry.setAttribute('normal',new THREE.Float32BufferAttribute(surface.normals,3));
    geometry.setAttribute('uv',new THREE.Float32BufferAttribute(surface.uvs,2));
    geometry.setAttribute('color',new THREE.Float32BufferAttribute(surface.colors,3));
    geometry.setIndex(surface.indices);
    if(!chunkSurfaceMaterials.has(material)){
      const shaded=material.clone();
      shaded.vertexColors=true;
      chunkSurfaceMaterials.set(material,shaded);
    }
    const mesh=new THREE.Mesh(geometry,chunkSurfaceMaterials.get(material));
    if(surface.glass)mesh.renderOrder=2;
    scene.add(mesh);
    chunk.push(mesh);
  }
  function waterSurface(positions,geometry,material,side){
    if(!positions.length)return;
    const mesh=new THREE.InstancedMesh(geometry,material,positions.length);
    mesh.userData.positions=positions;
    for(let i=0;i<positions.length;i++){
      const [x,y,z]=positions[i];
      const ox=side==='left'?.025:side==='right'?.975:.5;
      const oy=side==='top'?.96:.5;
      const oz=side==='front'?.025:side==='back'?.975:.5;
      dummy.position.set(x+ox,y+oy,z+oz);
      dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);dummy.updateMatrix();
      mesh.setMatrixAt(i,dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate=true;
    mesh.computeBoundingSphere();mesh.renderOrder=3;
    scene.add(mesh);chunk.push(mesh);
  }
  waterSurface(waterFaces.top,waterTopGeometry,waterTopMaterial,'top');
  for(const face of ['left','right'])waterSurface(waterFaces[face],waterWallXGeometry,waterWallMaterial,face);
  for(const face of ['front','back'])waterSurface(waterFaces[face],waterWallZGeometry,waterWallMaterial,face);
  chunkMeshes.set(id,chunk);
  rebuildDecoration(cx,cz);
}
// Flowers and little grass tufts add colour without becoming solid blocks.
// All three meshes are instanced. They never participate in mining or collision.
const floralStemGeometry=new THREE.BoxGeometry(.08,.34,.08);
const floralPetalGeometry=new THREE.BoxGeometry(.26,.20,.26);
const floralGrassGeometry=new THREE.BoxGeometry(.10,.39,.10);
const farmCropGeometry=new THREE.BoxGeometry(.12,.68,.12);
const farmCropMaterial=new THREE.MeshLambertMaterial({color:'#e5b74c'});
const farmFenceMaterial=new THREE.MeshLambertMaterial({color:'#ae7848'});
const farmFenceGeometry=new THREE.BoxGeometry(1,1,1);
const floralGreenMaterial=new THREE.MeshLambertMaterial({color:'#70a957'});
const floralPetalMaterial=new THREE.MeshLambertMaterial({color:'#ffffff'});
const floralLeafMaterial=new THREE.MeshLambertMaterial({color:'#80b95b'});
const floralPalette=['#f6df56','#f37c85','#f0a4d3','#e6f4fd','#e8bb72'];
const trimMaterial=new THREE.MeshLambertMaterial({color:'#926039'});
const shutterMaterial=new THREE.MeshLambertMaterial({color:'#568a77'});
const flowerBoxMaterial=new THREE.MeshLambertMaterial({color:'#cf8f51'});
const roofAccentMaterial=new THREE.MeshLambertMaterial({color:'#e0b376'});
const marketRedMaterial=new THREE.MeshLambertMaterial({color:'#b95246'});
const marketWhiteMaterial=new THREE.MeshLambertMaterial({color:'#fff1d3'});
const marketGoldMaterial=new THREE.MeshLambertMaterial({color:'#f2bd58'});
const ruinGlowMaterial=new THREE.MeshBasicMaterial({color:'#caa0ff',transparent:true,opacity:.83,depthWrite:false});
const sparkleMaterial=new THREE.MeshBasicMaterial({color:'#e1fbff',transparent:true,opacity:.48,depthWrite:false,side:THREE.DoubleSide});
const sparkleGeometry=new THREE.PlaneGeometry(.64,.09);
// Light-catching particles are instanced, decorative and have no collision or mining hitbox.
const fireflyGeo=new THREE.BoxGeometry(.12,.12,.12);
const fireflyGold=new THREE.MeshBasicMaterial({color:'#fff4ac',transparent:true,opacity:.88,depthWrite:false});
const fireflyViolet=new THREE.MeshBasicMaterial({color:'#d6aaff',transparent:true,opacity:.83,depthWrite:false});
const mushroomStemMaterial=new THREE.MeshLambertMaterial({color:'#d6c8af'});
const mushroomCapMaterial=new THREE.MeshLambertMaterial({color:'#7a639c'});
// V12: Original pixel-art ground plants. Alpha-tested crossed cards are much
// cheaper than hundreds of individually modelled leaves; they also keep the
// whimsical voxel silhouette when seen from a distance.
function makeFoliageTexture(){
  const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;
  const ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,64,64);ctx.fillStyle='#ffffff';
  // Non-symmetric leaves, deliberately kept chunky and readable on a phone.
  for(const [x,tip,wide] of [[8,35,7],[17,14,9],[28,26,7],[37,7,10],[48,27,7],[55,35,5]]){
    const base=30;
    const half=wide/2;
    ctx.beginPath();ctx.moveTo(base,62);ctx.lineTo(x-half,tip+12);
    ctx.lineTo(x,tip);ctx.lineTo(x+half,tip+12);ctx.lineTo(base+4,62);
    ctx.closePath();ctx.fill();
  }
  ctx.fillRect(25,40,13,23);
  const map=new THREE.CanvasTexture(canvas);
  map.colorSpace=THREE.SRGBColorSpace;
  map.magFilter=THREE.NearestFilter;
  map.minFilter=THREE.NearestMipmapNearestFilter;
  return map;
}
const foliageGeometry=new THREE.PlaneGeometry(.85,1);
const foliageMaterial=new THREE.MeshLambertMaterial({
  map:makeFoliageTexture(),transparent:true,alphaTest:.48,
  side:THREE.DoubleSide,depthWrite:true
});
const scatterRockGeometry=new THREE.DodecahedronGeometry(.46,0);
const scatterRockMaterial=new THREE.MeshLambertMaterial({color:'#ffffff',flatShading:true});
// V13: one white instanced material per ordinary color palette (via per-instance
// tint), plus separate emissive and translucent passes. This avoids up to
// 16 additional draw calls per village chunk on an iPhone.
const sunDetailColors={
  roofRed:'#ad6650',roofWarm:'#c19c66',roofGrey:'#87938b',roofRidge:'#79553d',
  roofRedLight:'#bc7356',roofRedDark:'#935241',roofWarmLight:'#d1ab7a',roofWarmDark:'#a78354',
  roofGreyLight:'#9caa9c',roofGreyDark:'#6e7d74',
  oak:'#8e643b',crossbeam:'#9a653a',iron:'#3e4849',sign:'#d2ab70',flowerpot:'#b56b4b',window:'#9bd7e4',bannerBlue:'#466889',bannerGreen:'#477764',sunGold:'#efd28b',
  petalPink:'#ee98b5',petalYellow:'#f3d57b',bloomWhite:'#f4dfcd',moss:'#619254',cobbleWarm:'#b6a187',cobbleLight:'#d6c4a0',
  stoneTrim:'#c3b8a0',clothCream:'#f8e2c2',
  bread:'#dbac69',mapPaper:'#e5d8b4',bookSpine:'#617d89',forestLeaf:'#598e57',
  fruitRed:'#d66b51',fruitGold:'#f4c956',fruitGreen:'#7cad65',leaf:'#69a45e'
};
// V16: Die V15-Dorfdetails waren alle einfarbig. Die bestehenden ORIGINALEN
// Pixeltexturen des Spieles werden hier ohne neue Canvas/Downloads wiederverwendet.
// Nur drei Instanzgruppen pro Chunk (Ziegel, Holz, Naturstein) plus die bisherige
// Farbgruppe: die Kosten wachsen nicht mit der Zahl der Dachziegel.
const sunTextureFamilies={
  masonry:new THREE.MeshLambertMaterial({map:materialByType.bricks[0].map,color:'#ffffff'}),
  timber:new THREE.MeshLambertMaterial({map:materialByType.planks[0].map,color:'#ffffff'}),
  stone:new THREE.MeshLambertMaterial({map:materialByType.cobble[0].map,color:'#ffffff'})
};
// Per-Instance-Tints sind bewusst hell: Pixeltexturen dürfen nicht doppelt
// abgedunkelt werden. Auf diese Weise bleibt die originale Textur erkennbar.
const sunTexturedDetailTypes={
  roofRed:['masonry','#ffffff'],roofRedLight:['masonry','#fff0e6'],roofRedDark:['masonry','#dfd4c9'],
  roofWarm:['timber','#fff0df'],roofWarmLight:['timber','#ffffff'],roofWarmDark:['timber','#ded2bd'],
  roofGrey:['stone','#ffffff'],roofGreyLight:['stone','#f2f5f0'],roofGreyDark:['stone','#d8e0d8'],
  roofRidge:['timber','#c8b59e'],oak:['timber','#ffffff'],crossbeam:['timber','#ebd7bd'],
  stoneTrim:['stone','#fff4df']
};
// Shared emissive pane pass: two normal windows and one small dormer per house.
// No extra per-window point lights or shadow maps. Day/night switch reuses
// the very same material; no chunk mesh has to be rebuilt.
const sunWindowGlowMaterial=new THREE.MeshLambertMaterial({
  color:'#ffe6b7',emissive:'#ffa95a',emissiveIntensity:.08,
  transparent:true,opacity:.07,depthWrite:false
});
const sunOpaqueMaterial=new THREE.MeshLambertMaterial({color:'#ffffff'});
const sunLampMaterial=new THREE.MeshLambertMaterial({color:'#fff2aa',emissive:'#ffb948',emissiveIntensity:.70});
const sunSmokeMaterial=new THREE.MeshLambertMaterial({color:'#f1efdc',transparent:true,opacity:.54,depthWrite:false});
const stonePalette=['#87948a','#a2aa9b','#b9b6a5','#91877c'];
const forestPlantPalette=['#6da34b','#8abd63','#629c56','#a3b66c'];
const shadowPlantPalette=['#788872','#9276a4','#608677','#ab8b9a'];
function farmPatch(x,z){
  return VILLAGES.some(v=>x>=v.x+12&&x<=v.x+17&&z>=v.z-6&&z<=v.z-1);
}
function rebuildDecoration(cx,cz){
  if(isMeadow())return; // Intentionally empty. User-built blocks still render.
  const id=chunkKey(cx,cz);
  for(const mesh of decorativeMeshes.get(id)||[]){scene.remove(mesh);mesh.dispose();}
  const stems=[],blooms=[],tufts=[],crops=[],fencePosts=[],fenceRails=[];
  const trimBlocks=[],shutters=[],flowerBoxes=[],roofBands=[],sparkles=[];
  const marketPosts=[],marketReds=[],marketWhites=[],marketCrates=[],marketLanterns=[],runeCrystals=[];
  const villageFireflies=[],forestFireflies=[],mushroomStems=[],mushroomCaps=[];
  const groundFoliage=[],rockScatter=[];
  const specialMaterials=Object.fromEntries([...Object.keys(sunDetailColors),'lamp','smoke','windowGlow'].map(k=>[k,[]]));
  // Coordinates are stable across chunk boundaries; owner edits are applied
  // above default scenery. Decorative extras disappear locally around an edit,
  // so an old custom building is not visually covered by new props.
  for(const [kind,x,y,z,w,h,d] of SUN_VILLAGE_DETAILS){
    if(Math.floor(x/CHUNK)!==cx||Math.floor(z/CHUNK)!==cz)continue;
    let edited=false;
    for(let ix=Math.floor(x-w/2);ix<=Math.floor(x+w/2)&&!edited;ix++)
    for(let iy=Math.floor(y-h/2);iy<=Math.floor(y+h/2)&&!edited;iy++)
    for(let iz=Math.floor(z-d/2);iz<=Math.floor(z+d/2);iz++){
      if(edits.has(key(ix,iy,iz))){edited=true;break;}
    }
    // Für Tür- und Fensterdetails reicht unmittelbare Kollision aus, während
    // neue Bodendekorationen auch bei Nachbar-Edits ausgeblendet werden.
    if(!edited&&(kind==='cobbleWarm'||kind==='cobbleLight'||kind==='moss')){
      for(let ix=Math.floor(x)-1;ix<=Math.floor(x)+1&&!edited;ix++)
      for(let iz=Math.floor(z)-1;iz<=Math.floor(z)+1&&!edited;iz++)
      for(let iy=Math.floor(y)-1;iy<=Math.floor(y)+1;iy++)
        if(edits.has(key(ix,iy,iz))){edited=true;break;}
    }
    if(!edited)specialMaterials[kind].push([x,y,z,w,h,d]);
  }
  for(let x=cx*CHUNK;x<(cx+1)*CHUNK;x++)for(let z=cz*CHUNK;z<(cz+1)*CHUNK;z++){
    const h=terrainHeight(x,z);
    // Small-scale terrain variation with no solid voxel edits. Keep homes,
    // paths, discoveries and already-built places clear. Every item is fixed by
    // world coordinates: visiting/reloading cannot change its placement.
    const topBlock=get(x,h-1,z);
    const surfaceFree=!get(x,h,z)&&!isInsideHouse(x+.5,z+.5);
    if(surfaceFree&&topBlock&&(topBlock==='grass'||topBlock==='sand'||topBlock==='stone')){
      const b=biomeAt(x,z),insideVillage=!!inVillage(x,z);
      const r=pixelHash(x,z,1401);
      if(topBlock==='grass'&&!insideVillage&&r>.873){
        const scale=.65+pixelHash(x,z,1402)*.47;
        groundFoliage.push([x+.24+pixelHash(x,z,1403)*.52,h+.36*scale,
          z+.24+pixelHash(x,z,1404)*.52,scale,b==='schattenwald',pixelHash(x,z,1405)]);
      }else if(!insideVillage&&r>(topBlock==='sand'?.938:.963)){
        const size=.38+pixelHash(x,z,1406)*.66;
        rockScatter.push([x+.22+pixelHash(x,z,1407)*.53,h+.16*size,
          z+.22+pixelHash(x,z,1408)*.53,size,false,pixelHash(x,z,1409)]);
      }
    }
    // Fireflies guide discovery: golden near farms, lavender near the shadow ruins.
    // Sparse deterministic placement ensures the same scene after every reload.
    if(get(x,h-1,z)==='grass'&&!get(x,h,z)&&!isInsideHouse(x+.5,z+.5)){
      const forest=biomeAt(x,z)==='schattenwald';
      const nearSafeVillage=!!inVillage(x,z);
      const scatter=pixelHash(x,z,901);
      if(forest&&scatter>.969){
        forestFireflies.push([x+.22+pixelHash(x,z,903)*.60,h+.75+pixelHash(x,z,904)*1.5,z+.22+pixelHash(x,z,905)*.60]);
      }else if(nearSafeVillage&&scatter>.989){
        villageFireflies.push([x+.5,h+.7+pixelHash(x,z,906),z+.5]);
      }
      // Mushroom clusters are original scenery, never solid obstacles.
      if(forest&&pixelHash(x,z,911)>.981){
        const mx=x+.3+pixelHash(x,z,913)*.4,mz=z+.3+pixelHash(x,z,914)*.4;
        mushroomStems.push([mx,h+.13,mz,.12,.25,.12]);
        mushroomCaps.push([mx,h+.29,mz,.33,.14,.33]);
      }
    }
    // A few reflected highlights along the shores. No particles across the whole lake.
    if(get(x,h,z)==='water'&&lakeDistance(x+.5,z+.5)<-2&&
       pixelHash(x,z,712)>.985){sparkles.push([x+.5,WATER_LEVEL+1.03,z+.5]);}
    if(get(x,h-1,z)!=='grass'||get(x,h,z)||isInsideHouse(x+.5,z+.5))continue;
    if(farmPatch(x,z)){
      // Erntefeld mit drei goldenen Getreidehalmen je Feld, plus niedriger Holzeinfassung.
      for(let j=0;j<3;j++)crops.push([x+.24+j*.26,h+.30+(pixelHash(x+j,z,209)-.5)*.10,z+.35+(j%2)*.30]);
      for(const v of VILLAGES){
        const rx=x-v.x,rz=z-v.z;
        if(rx<12||rx>17||rz< -6||rz> -1)continue;
        const borderX=rx===12||rx===17,borderZ=rz===-6||rz===-1;
        if(borderX||borderZ){
          fencePosts.push([x+.5,h+.46,z+.5,.16,.93,.16]);
          if(borderX&&!borderZ)fenceRails.push([x+.5,h+.55,z+.5,.13,.13,1.06]);
          if(borderZ&&!borderX)fenceRails.push([x+.5,h+.55,z+.5,1.06,.13,.13]);
        }
      }
      continue;
    }
    const r=pixelHash(x,z,172);
    // Keep entrances and roads clear.
    if(inVillage(x,z)&&Math.abs(x-inVillage(x,z).x)<=2&&Math.abs(z-inVillage(x,z).z)<=2)continue;
    if(r>.88){
      const px=x+.5+(pixelHash(x,z,173)-.5)*.46;
      const pz=z+.5+(pixelHash(x,z,174)-.5)*.46;
      stems.push([px,h+.18,pz]);
      blooms.push([px,h+.42,pz,pixelHash(x,z,176)]);
    }else if(r>.68){
      tufts.push([x+.5,h+.19,z+.5]);
    }
  }
  // Wooden details are cheap instanced meshes; houses do not become bulky new blocks.
  const belongs=(x,z)=>Math.floor(x/CHUNK)===cx&&Math.floor(z/CHUNK)===cz;
  for(const v of VILLAGES)for(const [i,[ox,oz]] of HOUSE_OFFSETS.entries()){
    const hx=v.x+ox,hz=v.z+oz;
    if(belongs(hx,hz+3.51)){
      // Door lintel, tiny lantern and flower box on the front facade.
      trimBlocks.push([hx,8.52,hz+3.62,1.15,.16,.13]);
      flowerBoxes.push([hx+1.55,7.0,hz+3.62,.87,.21,.35]);
      roofBands.push([hx,10.05,hz+4.55,7.25,.12,.18]);
    }
    if(belongs(hx-3.62,hz)){
      shutters.push([hx-3.62,7.5,hz-.85,.15,1.02,.22]);
      shutters.push([hx-3.62,7.5,hz+.85,.15,1.02,.22]);
    }
    if(belongs(hx+3.62,hz)){
      shutters.push([hx+3.62,7.5,hz-.85,.15,1.02,.22]);
      shutters.push([hx+3.62,7.5,hz+.85,.15,1.02,.22]);
    }
    if(belongs(hx,hz-3.62)){
      flowerBoxes.push([hx,7.10,hz-3.62,1.0,.21,.31]);
    }
  }
  // Kleiner Marktstand: ein fester Platz und durchlaufende Wege statt Häuser zuzustellen.
  for(const v of VILLAGES){
    const mx=v.x-3,mz=v.z-5;
    if(Math.floor(mx/CHUNK)!==cx||Math.floor(mz/CHUNK)!==cz)continue;
    const floor=Math.max(6,terrainHeight(mx,mz));
    for(const sx of [-1,1])for(const sz of [-1,1]){
      marketPosts.push([mx+sx*1.55,floor+1.25,mz+sz*.95,.15,2.5,.15]);
      marketCrates.push([mx+sx*.6,floor+.35,mz+sz*.65,.6,.68,.63]);
    }
    for(let i=0;i<8;i++){
      const x=mx-1.55+i*.44;
      (i%2?marketWhites:marketReds).push([x,floor+2.55,mz, .43,.12,2.6]);
    }
    marketLanterns.push([mx,floor+2.17,mz, .26,.30,.26]);
  }
  // Drei farbige Kristalle sind sichtbare Orientierungspunkte beim Erkunden.
  for(const target of RELIC_PLACES){
    if(collectedRelics.has(target.id))continue;
    const x=Math.floor(target.x),z=Math.floor(target.z);
    if(Math.floor(x/CHUNK)!==cx||Math.floor(z/CHUNK)!==cz)continue;
    const floor=target.id==='ruin'?terrainHeight(RUIN.x,RUIN.z)+2:terrainHeight(x,z);
    runeCrystals.push([x+.5,floor+1.23,z+.5,.34,.53,.34]);
  }
  const meshes=[];
  function spawn(geometry,material,items,isBloom){
    if(!items.length)return;
    const mesh=new THREE.InstancedMesh(geometry,material,items.length);
    for(let i=0;i<items.length;i++){
      const p=items[i];dummy.position.set(p[0],p[1],p[2]);
      dummy.rotation.set(0,(pixelHash(cx*37+i,cz,59)-.5)*2,0);
      const scale=isBloom?1:1;dummy.scale.set(scale,scale,scale);dummy.updateMatrix();
      mesh.setMatrixAt(i,dummy.matrix);
      if(isBloom)mesh.setColorAt(i,new THREE.Color(floralPalette[Math.min(4,Math.floor(p[3]*5))]));
    }
    mesh.instanceMatrix.needsUpdate=true;
    if(isBloom)mesh.instanceColor.needsUpdate=true;
    mesh.computeBoundingSphere();scene.add(mesh);meshes.push(mesh);
  }
  spawn(floralStemGeometry,floralGreenMaterial,stems,false);
  spawn(floralPetalGeometry,floralPetalMaterial,blooms,true);
  spawn(floralGrassGeometry,floralLeafMaterial,tufts,false);
  if(crops.length)spawn(farmCropGeometry,farmCropMaterial,crops,false);
  // Zäune bestehen aus skalierten Instanzen – eine Materialgruppe, wenige Drawcalls.
  function addScaled(items){
    if(!items.length)return;
    const mesh=new THREE.InstancedMesh(farmFenceGeometry,farmFenceMaterial,items.length);
    for(let i=0;i<items.length;i++){
      const [x,y,z,w,h,d]=items[i];
      dummy.position.set(x,y,z);dummy.rotation.set(0,0,0);dummy.scale.set(w,h,d);dummy.updateMatrix();
      mesh.setMatrixAt(i,dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();scene.add(mesh);meshes.push(mesh);
  }
  addScaled(fencePosts);addScaled(fenceRails);
  function addTrim(items,material){
    if(!items.length)return;
    const mesh=new THREE.InstancedMesh(farmFenceGeometry,material,items.length);
    for(let i=0;i<items.length;i++){
      const [x,y,z,w,h,d]=items[i];dummy.position.set(x,y,z);
      dummy.rotation.set(0,0,0);dummy.scale.set(w,h,d);dummy.updateMatrix();
      mesh.setMatrixAt(i,dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate=true;
    if(material===sunWindowGlowMaterial)mesh.renderOrder=3;
    mesh.computeBoundingSphere();scene.add(mesh);meshes.push(mesh);
  }
  addTrim(trimBlocks,trimMaterial);addTrim(shutters,shutterMaterial);
  addTrim(flowerBoxes,flowerBoxMaterial);addTrim(roofBands,roofAccentMaterial);
  addTrim(marketPosts,trimMaterial);addTrim(marketReds,marketRedMaterial);
  addTrim(marketWhites,marketWhiteMaterial);addTrim(marketCrates,flowerBoxMaterial);
  addTrim(marketLanterns,marketGoldMaterial);addTrim(runeCrystals,ruinGlowMaterial);
  // Texture reuse: three stable families. Ordinary flowers, banners, small
  // metal details and other colors stay in one cheap color-instanced batch.
  const villageBatches={plain:[],masonry:[],timber:[],stone:[]};
  for(const kind of Object.keys(sunDetailColors)){
    const family=sunTexturedDetailTypes[kind]?.[0]||'plain';
    for(const item of specialMaterials[kind])villageBatches[family].push([kind,item]);
  }
  for(const family of ['plain','masonry','timber','stone']){
    const items=villageBatches[family];
    if(!items.length)continue;
    const mat=family==='plain'?sunOpaqueMaterial:sunTextureFamilies[family];
    const mesh=new THREE.InstancedMesh(farmFenceGeometry,mat,items.length);
    for(let i=0;i<items.length;i++){
      const [kind,[x,y,z,w,h,d]]=items[i];
      dummy.position.set(x,y,z);dummy.rotation.set(0,0,0);
      dummy.scale.set(w,h,d);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
      const tint=family==='plain'?sunDetailColors[kind]:sunTexturedDetailTypes[kind][1];
      mesh.setColorAt(i,new THREE.Color(tint));
    }
    mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;
    mesh.computeBoundingSphere();scene.add(mesh);meshes.push(mesh);
  }
  addTrim(specialMaterials.lamp,sunLampMaterial);
  addTrim(specialMaterials.smoke,sunSmokeMaterial);
  addTrim(specialMaterials.windowGlow,sunWindowGlowMaterial);
  addTrim(mushroomStems,mushroomStemMaterial);addTrim(mushroomCaps,mushroomCapMaterial);
  spawn(fireflyGeo,fireflyGold,villageFireflies,false);
  spawn(fireflyGeo,fireflyViolet,forestFireflies,false);
  // Two crossed foliage sheets and a single small-stone mesh per chunk.
  // All foliage is non-solid and excluded from block mining / collisions.
  function addGroundDetails(items,geometry,material,angles,asRock=false){
    if(!items.length)return;
    for(const angle of angles){
      const mesh=new THREE.InstancedMesh(geometry,material,items.length);
      for(let i=0;i<items.length;i++){
        const [x,y,z,scale,tint,variant]=items[i];
        dummy.position.set(x,y,z);
        dummy.rotation.set(0,angle+(asRock?variant*6.28:0),0);
        if(asRock)dummy.scale.set(scale,scale*.57,scale*.83);
        else dummy.scale.set(scale,scale,scale);
        dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
        const pal=asRock?stonePalette:(tint?shadowPlantPalette:forestPlantPalette);
        mesh.setColorAt(i,new THREE.Color(pal[Math.min(pal.length-1,Math.floor(variant*pal.length))]));
      }
      mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;
      mesh.userData.natureDetail=true;
      mesh.visible=graphicMode==='schoen';
      mesh.computeBoundingSphere();scene.add(mesh);meshes.push(mesh);
    }
  }
  addGroundDetails(groundFoliage,foliageGeometry,foliageMaterial,[Math.PI/4,-Math.PI/4]);
  addGroundDetails(rockScatter,scatterRockGeometry,scatterRockMaterial,[0],true);
  if(sparkles.length){
    const mesh=new THREE.InstancedMesh(sparkleGeometry,sparkleMaterial,sparkles.length);
    for(let i=0;i<sparkles.length;i++){
      dummy.position.set(...sparkles[i]);dummy.rotation.set(-Math.PI/2,0,0);
      dummy.scale.set(1,1,1);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();scene.add(mesh);meshes.push(mesh);
  }
  decorativeMeshes.set(id,meshes);
}
function rebuild(){
  castleLightCell=null;
  tuftRegion='';
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
// Grid-based voxel ray traversal (3D DDA) – a fixed number of map lookups,
// rather than thousands of instanced-box triangle intersections per tap.
// The returned normal points outward from the face entered by the ray.
function traceVoxel(origin,direction,maxDistance=5.6){
  const dx=direction.x,dy=direction.y,dz=direction.z;
  const magnitude=Math.hypot(dx,dy,dz);
  if(!Number.isFinite(magnitude)||magnitude<1e-8||maxDistance<=0)return null;
  const ux=dx/magnitude,uy=dy/magnitude,uz=dz/magnitude;
  let x=Math.floor(origin.x),y=Math.floor(origin.y),z=Math.floor(origin.z);
  const sx=Math.sign(ux),sy=Math.sign(uy),sz=Math.sign(uz);
  const tx=sx?(sx>0?x+1-origin.x:origin.x-x)/Math.abs(ux):Infinity;
  const ty=sy?(sy>0?y+1-origin.y:origin.y-y)/Math.abs(uy):Infinity;
  const tz=sz?(sz>0?z+1-origin.z:origin.z-z)/Math.abs(uz):Infinity;
  let nextX=tx,nextY=ty,nextZ=tz;
  const stepX=sx?1/Math.abs(ux):Infinity;
  const stepY=sy?1/Math.abs(uy):Infinity;
  const stepZ=sz?1/Math.abs(uz):Infinity;
  for(let i=0;i<Math.ceil(maxDistance*3)+3;i++){
    let travel,normal;
    if(nextX<=nextY&&nextX<=nextZ){
      travel=nextX;nextX+=stepX;x+=sx;normal={x:-sx,y:0,z:0};
    }else if(nextY<=nextZ){
      travel=nextY;nextY+=stepY;y+=sy;normal={x:0,y:-sy,z:0};
    }else{
      travel=nextZ;nextZ+=stepZ;z+=sz;normal={x:0,y:0,z:-sz};
    }
    if(travel>maxDistance+1e-6||!Number.isFinite(travel))break;
    if(x< -HALF||x>=HALF||z< -HALF||z>=HALF||y<BUNKER_FLOOR||y>MAX_Y+8)continue;
    const type=get(x,y,z);
    if(type)return {x,y,z,type,normal,distance:travel};
  }
  return null;
}

// Generate a seamless sky once per lighting preset, outside the frame loop.
function skyGradient(zenith,horizon,ground,cloudColor,cloudStrength){
  const canvas=document.createElement('canvas');
  canvas.width=MOBILE?512:1024;
  canvas.height=MOBILE?256:512;
  const ctx=canvas.getContext('2d');
  const gradient=ctx.createLinearGradient(0,0,0,canvas.height);
  gradient.addColorStop(0,zenith);
  gradient.addColorStop(.50,horizon);
  gradient.addColorStop(.67,ground);
  gradient.addColorStop(1,ground);
  ctx.fillStyle=gradient;
  ctx.fillRect(0,0,canvas.width,canvas.height);
  const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);
  function noise(u,v,frequency){
    const x=u*frequency,y=v*frequency;
    const ix=Math.floor(x),iy=Math.floor(y);
    const fx=x-ix,fy=y-iy;
    const sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);
    const at=(dx,dy)=>pixelHash((ix+dx)%frequency,iy+dy,67);
    const lo=at(0,0)*(1-sx)+at(1,0)*sx;
    const hi=at(0,1)*(1-sx)+at(1,1)*sx;
    return lo*(1-sy)+hi*sy;
  }
  for(let y=Math.ceil(canvas.height*.055);y<canvas.height*.486;y++)for(let x=0;x<canvas.width;x++){
    const u=x/canvas.width,v=y/canvas.height;
    const density=(a,b)=>.59*noise(a,b,12)+.26*noise(a,b,28)
      +.10*noise(a,b,56)+.05*noise(a,b,112);
    const cloud=density(u,v);
    const alpha=Math.min(1,Math.max(0,(cloud-.49)*6))
      *Math.sin((v-.055)*Math.PI/.433)**.65*cloudStrength;
    const shade=(cloud-density(u,v-.007))*230;
    const k=(y*canvas.width+x)*4;
    for(let channel=0;channel<3;channel++)
      pixels.data[k+channel]=pixels.data[k+channel]*(1-alpha)+(cloudColor[channel]+shade)*alpha;
  }
  ctx.putImageData(pixels,0,0);
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=THREE.RepeatWrapping;
  return texture;
}
const skyTextures=[
  skyGradient('#326eac','#d4e8ee','#becfd2',[249,250,246],.94),
  skyGradient('#354964','#f4b284','#b99384',[235,177,156],.76),
  skyGradient('#081326','#394c65','#536471',[66,80,103],.57)
];
const skyDome=new THREE.Mesh(
  new THREE.SphereGeometry(80,24,12),
  new THREE.MeshBasicMaterial({map:skyTextures[0],side:THREE.BackSide,depthWrite:false,fog:false,toneMapped:false})
);
skyDome.frustumCulled=false;skyDome.renderOrder=-1000;scene.add(skyDome);

// Warm sun and moon are lightweight, unlit sprites rather than expensive post-processing.
function skyDisk(day){
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
  const c=canvas.getContext('2d');const g=c.createRadialGradient(64,64,8,64,64,64);
  g.addColorStop(0,day?'#fff9cd':'#f6f9ff');
  g.addColorStop(.20,day?'#fffcdf':'#d4e2ff');
  g.addColorStop(.24,day?'#ffeab080':'#a3b6e388');
  g.addColorStop(.54,day?'#ffdb8b88':'#a3b6e355');
  g.addColorStop(1,'#ffffff00');
  c.fillStyle=g;c.fillRect(0,0,128,128);
  const t=new THREE.CanvasTexture(canvas);
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthWrite:false,depthTest:true,transparent:true,fog:false}));
  sprite.scale.set(day?9:7,day?9:7,1);sprite.renderOrder=-4;scene.add(sprite);return sprite;
}
const sunSprite=skyDisk(true),moonSprite=skyDisk(false);
moonSprite.visible=false;
const villageGlow=new THREE.PointLight('#ffc375',0,14,2);
scene.add(villageGlow);
// Sonnen-Dorf: two localized, low-cost fill lights near the busy facades.
// Other villages and the rest of the world keep their existing illumination.
const sunnyVillageLights=[
  new THREE.PointLight('#ffbb71',0,12,2),
  new THREE.PointLight('#ffd28c',0,12,2)
];
sunnyVillageLights[0].position.set(VILLAGES[0].x-8,8.5,VILLAGES[0].z-4.5);
sunnyVillageLights[1].position.set(VILLAGES[0].x+8,8.5,VILLAGES[0].z+5.5);
for(const l of sunnyVillageLights)scene.add(l);
const shadowGlow=new THREE.PointLight('#ae80ff',0,19,2);
scene.add(shadowGlow);
// Only visible when a developer explicitly opens the page with ?debug=1.
const perfEnabled=new URLSearchParams(location.search).has('debug');
const perfEl=perfEnabled?document.createElement('output'):null;
if(perfEl){
  perfEl.setAttribute('aria-label','Entwicklungsdiagnose');perfEl.id='bwPerf';
  Object.assign(perfEl.style,{position:'fixed',left:'8px',bottom:'166px',zIndex:'30',
    font:'11px monospace',color:'#f5ffef',background:'#14281ad9',padding:'8px',
    borderRadius:'8px',pointerEvents:'none'});
  document.body.appendChild(perfEl);
}
let perfTime=performance.now(),perfFrames=0;
const shadowFogColor=new THREE.Color('#80799c');
const player={x:.5,y:terrainHeight(0,6)+.02,z:6.5,vy:0,grounded:false};
let yaw=.08,pitch=-.22;
const PLAYER_R=.25,PLAYER_H=1.73,GRAVITY=19.5,JUMP=7.0;
function treadIsSupported(tread){
  const {x,y,z,dx,dz,lower,upper}=tread;
  return Boolean(lower)&&get(x,y-1,z)===lower&&
    get(x+dx,y,z+dz)===upper&&!get(x,y,z);
}
function blocked(x,y,z){
  if(Math.abs(x-26.89)<PLAYER_R+.065&&Math.abs(z+62)<.99+PLAYER_R
    &&y<8.36&&y+PLAYER_H>5&&Math.abs(wardrobeLeaves[0].hinge.rotation.y)<1.25)return true;
  if(Math.abs(x-29.12)<PLAYER_R+.055&&Math.abs(z+62)<1+PLAYER_R&&
     y+PLAYER_H>5+wardrobeBack.position.y&&y<8+wardrobeBack.position.y)return true;
  if(leverDoors.some(d=>isMeadow()&&(!d.open||d.door.position.y<y+PLAYER_H)&&insideDoor(d,x,y,z)))return true;
  if(isMeadow()&&!bunkerHatchOpen&&overBunkerHatch(x,z)&&y+.04<5&&y+PLAYER_H-.04>4.65)return true;
  const minX=Math.floor(x-PLAYER_R+.005),maxX=Math.floor(x+PLAYER_R-.005);
  const minZ=Math.floor(z-PLAYER_R+.005),maxZ=Math.floor(z+PLAYER_R-.005);
  const minY=Math.floor(y+.04),maxY=Math.floor(y+PLAYER_H-.04);
  for(let ix=minX;ix<=maxX;ix++)for(let iz=minZ;iz<=maxZ;iz++)for(let iy=minY;iy<=maxY;iy++){
    const type=get(ix,iy,iz);
    if(type&&type!=='water')return true;
    const tread=stairTreads.get(key(ix,iy,iz));
    if(tread&&y+.04<iy+.5&&treadIsSupported(tread)&&
      (x-ix-.5)*tread.dx+(z-iz-.5)*tread.dz> -PLAYER_R+.005)return true;
  }
  return false;
}
function groundedAt(x,y,z){return blocked(x,y-.07,z);}
function horizontal(axis,amount){
  if(!amount)return;
  const proposed=player[axis]+amount;
  if(proposed< -HALF+.3||proposed>HALF-.3)return;
  const nx=axis==='x'?proposed:player.x,nz=axis==='z'?proposed:player.z;
  if(!blocked(nx,player.y,nz)){player[axis]=proposed;return;}
  // Prefer the smaller rise on stair treads and keep legacy full-block stepping.
  if(player.grounded)for(const rise of [.51,1.02]){
    if(!blocked(nx,player.y+rise,nz)&&blocked(nx,player.y+rise-.09,nz)){
      player.y+=rise;player[axis]=proposed;player.vy=0;return;
    }
  }
}
function updateMovement(dt){
  if(!gameRunning)return;
  updateWorldStream();
  const keyboardX=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));
  const keyboardF=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'));
  let x=keyboardX+stick.x,f=keyboardF-stick.y;
  const magnitude=Math.hypot(x,f);if(magnitude>1){x/=magnitude;f/=magnitude;}
  if(flying&&isMeadow()&&bunkerHatchOpen&&overBunkerHatch(player.x,player.z)&&player.y<5.2)
    setFlying(false);
  const speed=(flying?6.6:4.75)*dt;
  const dx=(Math.cos(yaw)*x-Math.sin(yaw)*f)*speed;
  const dz=(-Math.sin(yaw)*x-Math.cos(yaw)*f)*speed;
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.12));
  for(let i=0;i<steps;i++){
    const previousZ=player.z;
    horizontal('x',dx/steps);
    horizontal('z',dz/steps);
    // Follow the next tread before forward momentum reaches the low roof.
    if(!flying&&isMeadow()&&player.grounded&&player.vy<=0&&player.z<previousZ&&
      player.x>=18.25&&player.x<=20.75&&player.z>=-10&&player.z<1&&
      player.y<=5.08&&(bunkerHatchOpen||player.z<=-3.25)){
      for(let drop=0;drop<.60&&!blocked(player.x,player.y-.04,player.z);drop+=.04)
        player.y-=.04;
      player.grounded=groundedAt(player.x,player.y,player.z);
    }
  }
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
  // Safe swimming: water does not trap the player below its surface.
  // A gentle automatic buoyancy keeps exploration child-friendly.
  const feetX=Math.floor(player.x),feetZ=Math.floor(player.z);
  const wFeet=get(feetX,Math.floor(player.y+.16),feetZ)==='water';
  const wChest=get(feetX,Math.floor(player.y+.95),feetZ)==='water';
  if(wFeet||wChest){
    player.vy=Math.min(3.2,player.vy+14*dt);
    if(jumpHeld||keys.has('Space'))player.vy=4.0;
  }else player.vy-=GRAVITY*dt;
  const dy=player.vy*dt;
  const vsteps=Math.max(1,Math.ceil(Math.abs(dy)/.09));
  for(let i=0;i<vsteps;i++){
    const nextY=player.y+dy/vsteps;
    if(!blocked(player.x,nextY,player.z))player.y=nextY;
    else{player.vy=0;break;}
  }
  player.grounded=groundedAt(player.x,player.y,player.z);
  if(player.grounded&&player.vy<0)player.vy=0;
  if(player.y<BUNKER_FLOOR-4){respawn();toast('Wieder sicher auf der Wiese!');}
}
function respawn(){player.x=.5;player.z=isMeadow()?-.5:6.5;player.y=isMeadow()?MEADOW_HEIGHT+.08:terrainHeight(0,6)+.08;player.vy=0;player.grounded=false;}
function jump(){if(!gameRunning||flying)return;const inWater=get(Math.floor(player.x),Math.floor(player.y+.25),Math.floor(player.z))==='water';if(player.grounded||inWater){player.vy=inWater?4.5:JUMP;player.grounded=false;}}
let thirdPerson=true;
try{thirdPerson=localStorage.getItem('blockwelt-kamera')!=='ego';}catch(_){}
const eye=new THREE.Vector3(),cameraOffset=new THREE.Vector3(),viewDirection=new THREE.Vector3();
const cameraProbe=new THREE.Vector3(),probeOffset=new THREE.Vector3();
const orbitRotation=new THREE.Euler(0,0,0,'YXZ');
const cameraCorners=[[0,0],[-.15,-.12],[-.15,.12],[.15,-.12],[.15,.12]];
let cameraDistance=0;
let clearCameraTime=0;
function updateCamera(dt=0){
  eye.set(player.x,player.y+1.55,player.z);
  camera.rotation.set(pitch,yaw,0);
  camera.position.copy(eye);
  if(thirdPerson){
    const portrait=camera.aspect<.85;
    // Looking up must not drive the trailing camera down into the ground.
    orbitRotation.set(Math.max(-.52,Math.min(.18,pitch)),yaw,0);
    cameraOffset.set(portrait?.32:.62,.48,portrait?4.15:3.75).applyEuler(orbitRotation);
    const length=cameraOffset.length();
    cameraOffset.multiplyScalar(1/length);
    let clearDistance=length;
    for(const [x,y] of cameraCorners){
      cameraProbe.copy(eye).add(probeOffset.set(x,y,0).applyQuaternion(camera.quaternion));
      const obstruction=traceVoxel(cameraProbe,cameraOffset,length);
      if(obstruction)clearDistance=Math.min(clearDistance,Math.max(0,obstruction.distance-.22));
    }
    // Keep the full orbit distance. Use the eye position when that view is blocked.
    clearCameraTime=clearDistance===length?clearCameraTime+dt:0;
    cameraDistance=clearDistance===length&&(cameraDistance>0||!dt||clearCameraTime>=.22)?length:0;
    if(!cameraDistance){
      guardian.visible=false;
      return;
    }
    camera.position.addScaledVector(cameraOffset,cameraDistance);
    // Keep the crosshair aligned with the same aim point as in first person.
    viewDirection.set(0,0,-1).applyQuaternion(camera.quaternion);
    cameraProbe.copy(eye).addScaledVector(viewDirection,12);
    camera.lookAt(cameraProbe);
  }else{cameraDistance=0;clearCameraTime=0;}
  guardian.visible=thirdPerson&&cameraDistance>1.18;
}

const highlight=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.015,1.015,1.015)),new THREE.LineBasicMaterial({color:'#fffce2',depthTest:false,transparent:true,opacity:.96}));
highlight.visible=false;highlight.renderOrder=15;scene.add(highlight);
let pointed=null;
function updateTarget(){
  camera.getWorldDirection(viewDirection);
  let hit=traceVoxel(camera.position,viewDirection,5.6+cameraDistance);
  if(hit&&cameraDistance){
    const target={
      x:camera.position.x+viewDirection.x*(hit.distance+.012)-eye.x,
      y:camera.position.y+viewDirection.y*(hit.distance+.012)-eye.y,
      z:camera.position.z+viewDirection.z*(hit.distance+.012)-eye.z
    };
    const reachable=traceVoxel(eye,target,Math.min(5.6,Math.hypot(target.x,target.y,target.z)));
    if(!reachable||reachable.x!==hit.x||reachable.y!==hit.y||reachable.z!==hit.z)hit=null;
    else hit=reachable;
  }
  pointed=hit?{x:hit.x,y:hit.y,z:hit.z,type:hit.type,face:hit.normal}:null;
  highlight.visible=!!pointed;
  if(pointed){
    highlight.position.set(pointed.x+.5,pointed.y+.5,pointed.z+.5);
    $('targetLabel').textContent=LABELS[pointed.type]||'';
  }else $('targetLabel').textContent=(isMeadow()||Math.hypot(player.x-VILLAGES[0].x,player.z-VILLAGES[0].z)<27?'':'Schau einen Block an');
}
function intersectsPlayer(x,y,z){
  return Math.abs((x+.5)-player.x)<PLAYER_R+.5&&Math.abs((z+.5)-player.z)<PLAYER_R+.5&&y<player.y+PLAYER_H&&y+1>player.y;
}
function modifyWorld(place,quiet=false){
  castleLightCell=null;
  tuftRegion='';
  if(!gameRunning)return;
  updateTarget();
  if(!pointed){toast('Schau zuerst einen Block an');return;}
  let {x,y,z}=pointed;
  if(place){x+=Math.round(pointed.face.x);y+=Math.round(pointed.face.y);z+=Math.round(pointed.face.z);}
  if(x< -HALF||x>=HALF||z< -HALF||z>=HALF||y<BUNKER_FLOOR||y>MAX_Y){toast('Hier endet deine kleine Welt');return;}
  if(place&&(get(x,y,z)||intersectsPlayer(x,y,z))){toast('Hier ist schon etwas');return;}
  if(!place&&(y===0||y===BUNKER_FLOOR)){toast('Der Boden bleibt sicher stehen');return;}
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
  castleLightCell=null;
  tuftRegion='';
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
  // Adventure backups keep the old v7 format. Meadow backups are v8 with
  // an explicit world ID, so users cannot import blocks into the wrong world.
  const data={format:'blockwelt',version:isMeadow()?8:7,savedAt:new Date().toISOString(),
    edits:[...edits.values()],...(isMeadow()?{world:'wiese'}:{workshops:[...workshopProgress]})};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');link.href=url;link.download=isMeadow()?'Blockwelt-Grosse-Wiese.json':'Blockwelt-Abenteuerwelt.json';
  document.body.appendChild(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),3000);
  toast('Deine Welt wurde als Datei gesichert');
}
async function importWorld(file){
  if(!file)return;
  if(file.size>2_000_000){toast('Diese Datei ist zu groß');return;}
  try{
    const data=JSON.parse(await file.text());
    if(data?.format!=='blockwelt'||![2,3,5,6,7,8].includes(data.version)||!Array.isArray(data.edits)||data.edits.length>20000)throw new Error('format');
    if(data.version===8&&data.world!=='wiese')throw new Error('world');
    const sourceWorld=data.version===8&&data.world==='wiese'?'wiese':'abenteuer';
    if(sourceWorld!==activeWorld){
      toast('Diese Sicherung gehört zur anderen Welt. Bitte zuerst wechseln.');
      return;
    }
    const incoming=new Map();
    for(const edit of data.edits){
      if(!Array.isArray(edit)||edit.length!==4)throw new Error('entry');
      const [x,y,z,type]=edit;
      if(![x,y,z].every(Number.isInteger)||x< -HALF||x>=HALF||z< -HALF||z>=HALF||y<BUNKER_FLOOR||y>MAX_Y||(type!==null&&!BLOCK_TYPES.includes(type)))throw new Error('entry');
      incoming.set(key(x,y,z),[x,y,z,type]);
    }
    if(!confirm('Die bisherige Welt durch diese Sicherung ersetzen?'))return;
    baseWorld();edits.clear();undoStack.length=0;
    for(const [k,edit] of incoming){const [x,y,z,type]=edit;if(!isMeadow()&&inLegacy(x,z))put(x,y,z,type);edits.set(k,edit);}
    // Legacy world backups have no workshop section: do not erase their
    // independently stored stamps. V23 backups can restore stamps as well.
    if(!isMeadow()&&Array.isArray(data.workshops)){
      const valid=new Set(SUN_WORKSHOPS.map(place=>place.id));
      workshopProgress.clear();
      for(const id of data.workshops)if(valid.has(id))workshopProgress.add(id);
      workshopSteps.clear();saveSet(SUN_WORKSHOP_KEY,workshopProgress);updateBook();
    }
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
// V25: Fünf kleine, original gestaltete Handwerks-Requisiten.
// Bewusst keine Texturdownloads, Partikeleffekte oder zusätzlichen Lichter.
const sunnyTradeMaterials={
  wood:new THREE.MeshLambertMaterial({color:'#956b43'}),
  paper:new THREE.MeshLambertMaterial({color:'#f4e8c8'}),
  leaf:new THREE.MeshLambertMaterial({color:'#659a4c'}),
  flower:new THREE.MeshLambertMaterial({color:'#e5a4b6'}),
  bread:new THREE.MeshLambertMaterial({color:'#dba761'}),
  blue:new THREE.MeshLambertMaterial({color:'#6289a6'}),
  brass:new THREE.MeshLambertMaterial({color:'#e3c781'})
};
// Requisiten sind am Unterarm befestigt: sie folgen der tatsächlichen Bewegung.
// Nur die fünf Sonnen-Dorf-Bewohner bekommen ein Berufswerkzeug.
function equipSunnyTradeItem(resident,index){
  const arm=resident.rightArm, m=sunnyTradeMaterials;
  const a=(w,h,d,material,x,y,z)=>part(arm,w,h,d,material,x,y,z);
  if(index===0){ // Händlerin – kleines Warenkörbchen
    a(.39,.09,.33,m.wood,0,-.46,-.25);
    a(.23,.15,.24,m.bread,0,-.36,-.25);
    a(.07,.23,.07,m.brass,0,-.27,-.25);
  }else if(index===1){ // Gärtner – Blumenstängel
    a(.07,.31,.07,m.leaf,0,-.51,-.28);
    a(.21,.14,.21,m.flower,0,-.70,-.28);
    a(.15,.07,.12,m.leaf,-.09,-.48,-.28);
  }else if(index===2){ // Forscher – kleines, geschlossenes Kartenbuch
    a(.39,.08,.27,m.blue,0,-.45,-.29);
    a(.32,.035,.21,m.paper,0,-.40,-.29);
  }else if(index===3){ // Bäckerin – Brot auf einer Holzplatte
    a(.44,.07,.31,m.wood,0,-.48,-.24);
    a(.30,.16,.25,m.bread,0,-.36,-.24);
  }else if(index===4){ // Wächterin – kleines Schild, keine Waffe
    a(.33,.37,.09,m.blue,0,-.48,-.23);
    a(.10,.23,.10,m.brass,0,-.48,-.29);
    a(.22,.07,.10,m.brass,0,-.48,-.29);
  }
}
// Materials and geometry are shared: villagers remain inexpensive on phones.
const personStyles=[
  {role:'Bäckerin',coat:'#bd8555',hat:'#e9c58b',accent:'#f7e5c4',line:'Die Brötchen sind gerade fertig! Sieh dich auf dem Marktplatz um.'},
  {role:'Gärtner',coat:'#62865d',hat:'#9ab976',accent:'#d1dba1',line:'Im Birkenwald wachsen manchmal besonders schöne Blumen.'},
  {role:'Wächterin',coat:'#587d9b',hat:'#506577',accent:'#b1cee4',line:'Hinter der alten Burg beginnt ein geheimnisvoller Weg.'},
  {role:'Händlerin',coat:'#9b6380',hat:'#aa7d99',accent:'#efd3d8',line:'Auf dem Dorfplatz findest du einen kleinen Markt.'},
  {role:'Forscher',coat:'#b99255',hat:'#725537',accent:'#d5b373',line:'Am Kristallfall wartet ein funkelndes Geheimnis.'},
  {role:'Abenteurerin',coat:'#8c7658',hat:'#694f39',accent:'#ebc56a',line:'In der Schattenruine leuchtet nachts ein alter Stein.'}
];
const geometryCache=new Map();
function part(parent,w,h,d,material,x,y,z){
  const name=`${w}/${h}/${d}`;
  let geometry=geometryCache.get(name);
  if(!geometry){geometry=new THREE.BoxGeometry(w,h,d);geometryCache.set(name,geometry);}
  const mesh=new THREE.Mesh(geometry,material);
  mesh.position.set(x,y,z);parent.add(mesh);return mesh;
}
// The rider is rendered independently of the building grid.
const guardian=new THREE.Group();
scene.add(guardian);
const armor=new THREE.MeshStandardMaterial({color:'#647183',metalness:.43,roughness:.44});
const leather=new THREE.MeshStandardMaterial({color:'#423029',roughness:.92});
const cloak=new THREE.MeshStandardMaterial({color:'#492631',roughness:.94,side:THREE.DoubleSide});
const brass=new THREE.MeshStandardMaterial({color:'#b58951',metalness:.4,roughness:.52});
const ovalGeometry=new THREE.SphereGeometry(1,16,10);
function oval(parent,material,x,y,z,width,height,depth){
  const mesh=new THREE.Mesh(ovalGeometry,material);
  mesh.position.set(x,y,z);
  mesh.scale.set(width,height,depth);
  parent.add(mesh);
  return mesh;
}
oval(guardian,armor,0,1.08,0,.245,.31,.155);
oval(guardian,leather,0,.79,0,.18,.15,.13);
oval(guardian,armor,0,1.51,0,.158,.207,.155);
oval(guardian,leather,0,1.49,-.128,.12,.048,.034);
oval(guardian,brass,0,1.57,0,.027,.153,.157);
const mantle=new THREE.Group();
mantle.position.set(0,1.28,.13);
guardian.add(mantle);
const clothVertices=[],clothIndices=[];
for(let row=0;row<=12;row++)for(let col=0;col<=16;col++){
  const t=row/12,u=col/8-1;
  clothVertices.push(u*(.18+.095*t),-t*(.84-.1*Math.abs(u)),.075+.105*t-.078*u*u+Math.cos(u*15)*(.012+t*.025));
  const i=row*17+col;
  if(row&&col)clothIndices.push(i-18,i-17,i,i-18,i,i-1);
}
const clothGeometry=new THREE.BufferGeometry();
clothGeometry.setAttribute('position',new THREE.Float32BufferAttribute(clothVertices,3));
clothGeometry.setIndex(clothIndices);
clothGeometry.computeVertexNormals();
mantle.add(new THREE.Mesh(clothGeometry,cloak));
const clasp=oval(mantle,brass,0,-.16,.126,.067,.077,.019);
clasp.rotation.z=.3;
const guardianLimbs=[];
for(const side of [-1,1]){
  const arm=new THREE.Group(),leg=new THREE.Group();
  arm.position.set(side*.23,1.22,0);
  leg.position.set(side*.111,.77,0);
  guardian.add(arm,leg);
  oval(arm,armor,side*.023,0,0,.117,.104,.126);
  oval(arm,leather,side*.031,-.18,0,.072,.183,.075);
  oval(arm,armor,side*.045,-.29,0,.073,.12,.077);
  oval(arm,leather,side*.048,-.411,0,.061,.075,.066);
  oval(leg,leather,0,-.18,0,.096,.21,.093);
  oval(leg,armor,0,-.34,-.028,.082,.10,.091);
  oval(leg,leather,0,-.56,0,.078,.19,.079);
  oval(leg,armor,0,-.696,-.052,.087,.073,.139);
  guardianLimbs.push({arm,leg,side});
}
let stride=0;
function animateGuardian(dt,moved){
  guardian.position.set(player.x,player.y,player.z);
  guardian.rotation.y=yaw;
  stride+=moved*10;
  const swing=Math.sin(stride)*Math.min(.64,moved/Math.max(.001,dt)*.14);
  for(const {arm,leg,side} of guardianLimbs){
    arm.rotation.x=side*swing;
    leg.rotation.x=-side*swing;
  }
  mantle.rotation.x=.06+Math.abs(swing)*.28;
  mantle.rotation.z=Math.sin(stride)*Math.abs(swing)*.05;
}
function makeCreature(kind,x,z,number,homeX=x,homeZ=z){
  const group=new THREE.Group();
  let leftLeg,rightLeg,leftArm,rightArm,head;
  const style=personStyles[number%personStyles.length];
  if(kind==='villager'){
    const robe=new THREE.MeshLambertMaterial({color:style.coat});
    const hat=new THREE.MeshLambertMaterial({color:style.hat});
    const accent=new THREE.MeshLambertMaterial({color:style.accent});
    const cheeks=new THREE.MeshLambertMaterial({color:'#d39a8d'});
    const hair=new THREE.MeshLambertMaterial({color: number%3===0?'#634b34':number%3===1?'#785f47':'#49372f'});
    // Body and boots; hands are visible and clothing has small role-specific details.
    part(group,.75,.83,.48,robe,0,1.08,0);
    part(group,.66,.26,.49,accent,0,.59,-.015);
    part(group,.54,.10,.50,npcDark,0,.80,0);
    part(group,.22,.24,.08,accent,0,1.22,-.30); // Shirt or apron emblem
    leftLeg=part(group,.26,.57,.32,npcDark,-.20,.29,0);
    rightLeg=part(group,.26,.57,.32,npcDark,.20,.29,0);
    leftArm=part(group,.21,.70,.27,robe,-.48,1.08,0);
    rightArm=part(group,.21,.70,.27,robe,.48,1.08,0);
    part(leftArm,.20,.14,.26,npcSkin,0,-.40,0);
    part(rightArm,.20,.14,.26,npcSkin,0,-.40,0);
    // Head pivot is the one parent of EVERY face part and every hat component.
    // In V9, the eyes and hat were attached to group, so they failed to turn.
    head=new THREE.Group();head.position.set(0,1.76,0);group.add(head);
    part(head,.78,.72,.67,npcSkin,0,.01,0);
    part(head,.65,.13,.69,hair,0,.37,.00);
    for(const sign of [-1,1]){
      part(head,.115,.125,.045,npcWhite,sign*.21,.08,-.36);
      part(head,.063,.098,.050,npcDark,sign*.21,.08,-.398);
      part(head,.13,.075,.042,hair,sign*.21,.22,-.38);
      part(head,.10,.075,.03,cheeks,sign*.30,-.13,-.353);
    }
    part(head,.135,.16,.17,npcSkin,0,-.03,-.415);
    part(head,.23,.034,.039,npcDark,0,-.23,-.37);
    // Hats have different silhouettes for the six villagers.
    part(head,.84,.09,.80,hat,0,.42,.03);
    if(number%3===0){part(head,.68,.19,.68,hat,0,.54,.02);part(head,.17,.065,.70,accent,0,.48,-.02);}
    if(number%3===1){part(head,.62,.27,.62,hat,0,.56,.02);part(head,.22,.12,.06,accent,.15,.62,-.30);}
    if(number%3===2){part(head,.66,.23,.62,hat,0,.52,.02);part(head,.74,.08,.65,accent,0,.43,.02);}
    // Distinctive original silhouettes and clothing for six professions.
    // Small shared boxes remain cheaper than external skeletal models on iPhone.
    switch(number%personStyles.length){
      case 0: // Bäckerin: light apron, pocket and baker's scarf.
        part(group,.49,.48,.055,accent,0,1.04,-.27);
        part(group,.28,.15,.07,hat,0,.91,-.31);
        part(head,.45,.10,.08,accent,0,-.29,-.37);
        break;
      case 1: // Gärtner: moss-green shoulder cape and sprig on the hat.
        part(group,.96,.14,.55,hat,0,1.46,.01);
        part(head,.12,.23,.13,accent,.23,.71,-.08);
        part(head,.28,.07,.16,accent,.20,.78,-.08);
        break;
      case 2: // Wächterin: sturdy shoulder armor and a bright chest badge.
        for(const side of [-1,1])part(group,.29,.18,.48,hat,side*.45,1.41,.0);
        part(group,.16,.24,.09,accent,0,1.19,-.34);
        break;
      case 3: // Händlerin: shoulder bag and embroidered belt buckle.
        part(group,.33,.33,.30,hat,.43,.91,.13);
        part(group,.14,.16,.11,accent,0,.79,-.31);
        break;
      case 4: // Forscher: tablet and a pocket on the working coat.
        part(group,.34,.42,.06,hat,-.14,1.05,-.30);
        part(group,.17,.22,.07,accent,.25,1.18,-.29);
        break;
      default: // Abenteurerin: backpack, sash and buckle.
        part(group,.53,.58,.22,hat,0,1.13,.34);
        part(group,.13,.72,.07,accent,.19,1.05,-.31);
        part(group,.26,.14,.08,hat,0,.78,-.31);
    }
  }else{
    const skin=new THREE.MeshLambertMaterial({color:'#6db45f'});
    const darkGreen=new THREE.MeshLambertMaterial({color:'#326b48'});
    const lively=new THREE.MeshLambertMaterial({color:'#8ad774'});
    part(group,.73,1.03,.60,skin,0,.90,0);
    head=new THREE.Group();head.position.set(0,1.74,0);group.add(head);
    part(head,.86,.78,.75,lively,0,.02,0);
    for(const sign of [-1,1])part(head,.18,.21,.059,npcDark,sign*.22,.10,-.403);
    part(head,.27,.16,.08,darkGreen,0,-.15,-.41);
    part(head,.14,.16,.09,npcDark,0,-.24,-.42);
    leftLeg=part(group,.24,.43,.26,darkGreen,-.23,.24,-.16);
    rightLeg=part(group,.24,.43,.26,darkGreen,.23,.24,-.16);
    leftArm=part(group,.24,.43,.26,skin,-.23,.24,.17);
    rightArm=part(group,.24,.43,.26,skin,.23,.24,.17);
  }
  // Soft contact shadow makes the character less weightless.
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(.45,10),new THREE.MeshBasicMaterial({color:'#1d3021',transparent:true,opacity:.20,depthWrite:false}));
  shadow.rotation.x=-Math.PI/2;shadow.position.y=.027;group.add(shadow);
  scene.add(group);
  const entity={kind,role:kind==='villager'?style.role:'Schleicher',dialogue:kind==='villager'?style.line:'Im Schattenwald gibt es noch mehr zu entdecken!',group,head,leftLeg,rightLeg,leftArm,rightArm,x,z,homeX,homeZ,angle:number*2.32,turnTimer:number*.9,walkTimer:number,number};
  creatures.push(entity);
  return entity;
}
// A gentle greeter near the starting area and villages with roaming residents.
makeCreature('villager',-3,8,0,-3,8);
const campGuide=makeCreature('villager',CAMP.x+5,CAMP.z-2,4,CAMP.x+5,CAMP.z-2);
campGuide.role='Waldhüterin';
campGuide.dialogue='Willkommen im Waldlager! Folge dem Kompass zu geheimen Orten – und schau auch bei der Himmelswarte vorbei.';
for(const [vi,v] of VILLAGES.entries()){
  for(let i=0;i<v.people;i++){
    const angle=i*Math.PI*2/v.people;
    // Im Sonnen-Dorf passende Persönlichkeiten statt zufälliger Berufe:
    // Händler am Osten, Gärtner südlich, Forscher am Brunnen, Bäckerin
    // auf der Marktseite und Wächterin nahe der nördlichen Dorfstraße.
    const sunnyRoles=[3,1,4,0,2];
    const number=vi===0?sunnyRoles[i%sunnyRoles.length]:i+1+vi*7;
    // Die Sonnen-Dorf-Bewohner sind ihren Handwerksorten zugeordnet.
    // Dadurch begegnet man der Bäckerin bei der Bäckerei und nicht zufällig
    // vor dem Brunnen. Das Birken-Dorf behält das frühere Bewegungsmuster.
    // V24: Alle fünf Ankunftspunkte liegen auf geprüftem, ebenem Pflaster.
    // In V23 standen Forscher und Bäckerin auf 3 Blöcke hohen Zugangsstufen;
    // auf einem iPhone wirkten sie wie Figuren auf Podesten.
    const sunnyHomes=[
      [v.x-3,v.z-4],  // Händlerin am einzigen Marktstand
      [v.x-9,v.z+1],  // Gärtner am Westweg
      [v.x+6,v.z+1],  // Forscher auf der Dorfstraße
      [v.x-6,v.z+1],  // Bäckerin auf dem Weg, nicht auf der Terrasse
      [v.x+9,v.z+2]  // Wächterin am Ostweg
    ];
    const [px,pz]=vi===0?sunnyHomes[i]:[v.x+Math.cos(angle)*5,v.z+Math.sin(angle)*5];
    const resident=makeCreature('villager',px,pz,number,vi===0?px:v.x,vi===0?pz:v.z);
    if(vi===0){
      resident.sunVillageRole=true;
      resident.sunTradeIndex=i;
      equipSunnyTradeItem(resident,i);
      const names=['Händlerin Tilda','Gärtner Bo','Forscher Emil','Bäckerin Leni','Wächterin Mia'];
      const greetings=[
        'Willkommen im Sonnen-Dorf! Auf unserem Markt gibt es immer etwas Neues zu entdecken.',
        'Siehst du die Blütenbäume? Hinter den Häusern liegt unser kleiner Garten.',
        'Im Brunnen glitzert das Wasser. Vielleicht findest du auch ein Geheimnis an der Himmelswarte!',
        'Schön, dass du da bist! Meine Backstube liegt gleich am Dorfplatz.',
        'Hier im Dorf bist du sicher. Wenn du ein Abenteuer möchtest, folge später dem Entdecker-Kompass.'
      ];
      resident.role=names[i];resident.dialogue=greetings[i];
    }
  }
  // Das freundliche Sonnen-Dorf ist kein Monster-Spawn. Schleicher bleiben
  // in anderen Wildnisgebieten und kündigen ein sanftes Abenteuer an.
  if(vi!==0)for(let i=0;i<2;i++)makeCreature('sneaker',v.x+13+i*3,v.z+13-i*3,i+vi*2,v.x+13,v.z+12);
}
makeCreature('sneaker',11,14,5,11,14);
makeCreature('sneaker',-19,6,6,-19,6);
function makeAnimal(kind,x,z,index,homeX=x,homeZ=z){
  const group=new THREE.Group();
  const animalColor=new THREE.MeshLambertMaterial({color:kind==='cow'?'#b99474':'#f0eee1'});
  const snoutColor=new THREE.MeshLambertMaterial({color:kind==='cow'?'#e9b3a8':'#dbc5b8'});
  const hoofColor=new THREE.MeshLambertMaterial({color:'#4c514e'});
  part(group,1.16,.76,.66,animalColor,0,.95,0);
  const head=part(group,.60,.58,.56,animalColor,0,1.1,-.58);
  part(group,.49,.24,.22,snoutColor,0,.92,-.91);
  part(group,.08,.09,.05,npcDark,-.18,1.24,-.87);
  part(group,.08,.09,.05,npcDark,.18,1.24,-.87);
  for(const sign of [-1,1])part(group,.20,.19,.16,animalColor,sign*.35,1.4,-.6);
  if(kind==='cow'){
    const patch=new THREE.MeshLambertMaterial({color:'#f8e8cf'});
    part(group,.45,.43,.02,patch,-.26,1.07,-.341);
    part(group,.2,.28,.16,patch,.44,1.14,.0);
  }
  const legs=[];
  for(const sx of [-1,1])for(const sz of [-1,1])legs.push(part(group,.22,.52,.23,hoofColor,sx*.39,.35,sz*.22));
  scene.add(group);
  creatures.push({kind,group,head,leftLeg:legs[0],rightLeg:legs[1],leftArm:legs[2],rightArm:legs[3],
    x,z,homeX,homeZ,angle:index*2.9,turnTimer:index*.7,walkTimer:index,number:index+22,isAnimal:true});
}
for(const [vi,v] of VILLAGES.entries()){
  makeAnimal('cow',v.x+11,v.z-2,vi*2+1,v.x+10,v.z-2);
  makeAnimal('sheep',v.x-12,v.z+4,vi*2+2,v.x-12,v.z+4);
}
makeAnimal('sheep',12,13,11,12,13);
const npcTargetBtn=$('npcBtn');
let selectedNpc=null,selectedWorkshop=null,lastNpcTargetCheck=0;
const workshopSteps=new Map();
function npcSurface(x,z){
  const ix=Math.floor(x),iz=Math.floor(z),h=terrainHeight(ix,iz);
  // In der Sonnen-Dorf-Werkstatt sind einige Hauszugänge bewusst terrassiert.
  // Vor V16 benutzten Bewohner ausschließlich die natürliche Geländehöhe und
  // konnten dadurch bis zur Hüfte in der neuen Zugangsstufe stecken.
  if(!inVillage(ix,iz)||Math.hypot(ix-VILLAGES[0].x,iz-VILLAGES[0].z)>22)return h;
  for(let y=Math.min(MAX_Y,h+3);y>=Math.max(0,h-4);y--){
    const type=get(ix,y,iz);
    if(type&&!['water','glass','leaves','blossom','lantern'].includes(type))return y+1;
  }
  return h;
}
function canNpcEnter(x,z,previousX,previousZ){
  const floor=npcSurface(x,z),oldFloor=npcSurface(previousX,previousZ);
  if(Math.abs(floor-oldFloor)>1)return false;
  for(const ox of [-.25,.25])for(const oz of [-.25,.25]){
    const bx=Math.floor(x+ox),bz=Math.floor(z+oz);
    for(let y=Math.floor(floor);y<=Math.floor(floor+1);y++){
      const type=get(bx,y,bz);
      if(type&&type!=='water')return false;
    }
  }
  return true;
}
// V24: Bewohner dürfen auch nach eigenen Bauänderungen nicht auf plötzlich
// erhöhten Säulen stehen oder mit den Füßen in einem neuen Block stecken.
// Die Figur weicht auf einen freien Platz nahe ihres eigenen Arbeitsplatzes aus.
// Wenn dort alles verbaut ist, wird sie vorübergehend ausgeblendet statt durch
// Spielerbauwerke zu teleportieren. Andere Orte bleiben unverändert.
function safeSunnyResidentSpot(x,z){
  const height=npcSurface(x,z);
  return height>=4.8&&height<=6.1&&!isInsideHouse(x,z)&&canNpcEnter(x,z,x,z);
}
// V25: Bewohner teilen keine Standfläche miteinander. Bei einer Blockänderung
// wird ein neuer sicherer Standort gesucht, statt Figuren übereinanderzusetzen.
function residentHasSpace(npc,x,z,space=.70){
  for(const other of creatures){
    if(other!==npc&&other.sunVillageRole&&
       Math.hypot(other.x-x,other.z-z)<space)return false;
  }
  return true;
}
function residentGiveWay(npc,px,pz,enabled){
  const dx=npc.x-px,dz=npc.z-pz,dist=Math.hypot(dx,dz);
  if(!enabled||!npc.sunVillageRole||dist>=1.55)return null;
  // Sanft seitlich ausweichen statt direkt in die Kamera zu laufen.
  const angle=Math.atan2(dz,dx)+(npc.number%2===0?.38:-.38);
  return {angle,speed:.76};
}
function restoreSunnyResidentSpot(npc){
  if(safeSunnyResidentSpot(npc.x,npc.z)&&residentHasSpace(npc,npc.x,npc.z))return true;
  for(const [dx,dz] of [[0,0],[.5,.5],[-.5,.5],[.5,-.5],[-.5,-.5],
    [1.25,0],[-1.25,0],[0,1.25],[0,-1.25],
    [1.75,.75],[-1.75,.75],[1.75,-.75],[-1.75,-.75]]){
    const x=npc.homeX+dx,z=npc.homeZ+dz;
    if(safeSunnyResidentSpot(x,z)&&residentHasSpace(npc,x,z)&&
       Math.hypot(player.x-x,player.z-z)>.9){
      npc.x=x;npc.z=z;npc.angle+=.7;return true;
    }
  }
  return false;
}

// V28 FESTUNGSWESEN: Originale Voxelmodelle aus gemeinsamen Würfelgeometrien.
// Alle Figuren sind dekorative, bewegliche Meshes: keine fremden Modelldateien,
// keine zerstörerischen Creeper-Explosionen und keine Änderung am Spielstand.
function creatureMaterial(palette){
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=32;
  const ctx=canvas.getContext('2d');
  for(let y=0;y<32;y+=2)for(let x=0;x<32;x+=2){
    const value=pixelHash(x,y,407);
    ctx.fillStyle=palette[value<.63?0:value<.84?1:2];
    ctx.fillRect(x,y,2,2);
  }
  const map=new THREE.CanvasTexture(canvas);
  map.colorSpace=THREE.SRGBColorSpace;
  map.magFilter=THREE.NearestFilter;
  map.minFilter=THREE.NearestMipmapNearestFilter;
  return new THREE.MeshLambertMaterial({map});
}
const netherCreatureMaterials={
  zombieSkin:creatureMaterial(['#73a95a', '#5e8e4e', '#95bd69']),
  zombieShade:new THREE.MeshLambertMaterial({color:'#456c44'}),
  zombieShirt:creatureMaterial(['#45828a', '#346873', '#68a1a0']),
  zombiePants:creatureMaterial(['#58476d', '#483852', '#786384']),
  creeperGreen:creatureMaterial(['#73a747', '#4e823b', '#9aba5e']),
  creeperLight:creatureMaterial(['#8db858', '#64994c', '#abc773']),
  creeperDark:new THREE.MeshLambertMaterial({color:'#2b5634'}),
  black:new THREE.MeshLambertMaterial({color:'#171c20'}),
  purple:new THREE.MeshLambertMaterial({color:'#654076',emissive:'#321648',emissiveIntensity:.23}),
  dragon:new THREE.MeshLambertMaterial({color:'#494257',emissive:'#36223e',emissiveIntensity:.24}),
  dragonEdge:new THREE.MeshLambertMaterial({color:'#74617c'}),
  dragonWing:new THREE.MeshLambertMaterial({color:'#754b86',emissive:'#402450',emissiveIntensity:.20,side:THREE.DoubleSide}),
  dragonEye:new THREE.MeshBasicMaterial({color:'#ed83ff'}),
  dragonSpine:new THREE.MeshLambertMaterial({color:'#8751ac',emissive:'#46216f',emissiveIntensity:.36})
};
const netherCreatureList=[];
function netherBlockAt(x,y,z){
  const ix=Math.floor(x),iz=Math.floor(z),k=key(ix,y,iz);
  if(edits.has(k))return edits.get(k)[3]||null;
  if(generatedChunks.has(chunkKey(Math.floor(ix/CHUNK),Math.floor(iz/CHUNK))))return get(ix,y,iz)||null;
  return makeNetherPlan()&&netherPlanVoxels.get(k)||
    (y===MEADOW_HEIGHT-1?'grass':y>=0&&y<MEADOW_HEIGHT?'dirt':null);
}
// Select an actual, unoccupied voxel floor on the nominated level.
// Using the full fortress plan also works when the player is still far away.
function netherWalkable(x,z,feetY){
  for(const ox of [-.23,.23])for(const oz of [-.23,.23]){
    const xx=x+ox,zz=z+oz;
    const base=netherBlockAt(xx,feetY-1,zz);
    if(!base||base==='water')return false;
    if(netherBlockAt(xx,feetY,zz)||netherBlockAt(xx,feetY+1,zz))return false;
  }
  return true;
}
function makeNetherEnemy(type,x,z,feetY,idx){
  const group=new THREE.Group(),m=netherCreatureMaterials;
  const body=part(group,type==='creeper'?.66:.77,type==='creeper'?1.15:.85,.55,
    type==='creeper'?m.creeperGreen:m.zombieShirt,0,type==='creeper'?.96:1.04,0);
  const head=new THREE.Group();head.position.y=type==='creeper'?1.86:1.75;group.add(head);
  part(head,type==='creeper'?.80:.75,.75,.71,type==='creeper'?m.creeperLight:m.zombieSkin,0,0,0);
  // Eigene Pixel-Gesichter; Augen und Mund bleiben beim Drehen am Kopf.
  if(type==='creeper'){
    for(const side of [-1,1])part(head,.14,.15,.05,m.creeperDark,side*.21,.12,-.38);
    part(head,.18,.28,.055,m.creeperDark,0,-.16,-.38);
    for(const side of [-1,1])part(head,.13,.14,.06,m.creeperDark,side*.14,-.23,-.38);
    part(group,.19,.12,.58,m.creeperDark,0,.73,-.03);
  }else{
    for(const side of [-1,1])part(head,.14,.14,.055,m.black,side*.20,.08,-.39);
    part(head,.24,.045,.06,m.zombieShade,0,-.22,-.38);
    part(head,.12,.08,.055,m.zombieShade,.24,-.13,-.38);
    part(group,.15,.18,.05,m.zombieShade,.20,.83,-.29);
  }
  const leftLeg=new THREE.Group(),rightLeg=new THREE.Group();
  let arms=[];
  if(type==='creeper'){
    for(const sx of [-1,1])for(const sz of [-1,1]){
      const leg=new THREE.Group();leg.position.set(sx*.22,.43,sz*.25);group.add(leg);
      part(leg,.25,.43,.25,m.creeperGreen,0,-.20,0);arms.push(leg);
    }
  }else{
    for(const side of [-1,1]){
      const leg=side<0?leftLeg:rightLeg;leg.position.set(side*.23,.56,0);group.add(leg);
      part(leg,.29,.56,.36,m.zombiePants,0,-.27,0);
      const arm=new THREE.Group();arm.position.set(side*.49,1.37,-.06);group.add(arm);
      part(arm,.24,.70,.29,m.zombieSkin,0,-.27,0);arms.push(arm);
    }
  }
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(.47,10),
    new THREE.MeshBasicMaterial({color:'#121d1a',transparent:true,opacity:.2,depthWrite:false}));
  shadow.rotation.x=-Math.PI/2;shadow.position.y=.025;group.add(shadow);
  group.visible=false;scene.add(group);
  netherCreatureList.push({type,group,head,body,leftLeg,rightLeg,arms,
    x:x+.5,z:z+.5,homeX:x+.5,homeZ:z+.5,y:feetY,
    bearing:idx*.73,speed:type==='creeper'?.44:.32,seed:idx,phase:idx*1.9});
}
// Vor dem Tor, am Treppenaufgang, im Innenhof und auf zwei Wehrgängen.
// Gezielt ausgesuchte begehbare Standflächen; weit entfernt werden alle Meshes verborgen.
for(const [type,x,z,y] of [
  ['zombie',-9,-30,5],['creeper',11,-31,5],
  ['zombie',-13,-51,5],['creeper',15,-51,5],
  ['zombie',-8,-69,5],['creeper',9,-73,5],
  ['zombie',23,-73,5],['creeper',-24,-72,5]
])makeNetherEnemy(type,x,z,y,netherCreatureList.length);

// Dragon: zusammenhängendes, animiertes 3D-Wesen, keine Kulisse am Himmel.
// Die Bewegung ist langsam und deterministisch, damit Kinder die Flugbahn
// verstehen können. Keine Explosionen, kein Feuerschaden, keine Save-Schreibzugriffe.
const netherDragon=new THREE.Group();scene.add(netherDragon);
const dm=netherCreatureMaterials;
part(netherDragon,2.9,2.4,5.2,dm.dragon,0,.1,0);
part(netherDragon,2.35,1.7,3,dm.dragonEdge,0,.12,-2.1);
part(netherDragon,1.95,1.55,2.15,dm.dragon,0,.10,-4.04);
part(netherDragon,1.70,.55,1.4,dm.dragonEdge,0,-.56,-4.62); // Unterkiefer
for(const side of [-1,1]){
  part(netherDragon,.30,.28,.16,dm.dragonEye,side*.74,.42,-4.83);
  part(netherDragon,.32,.25,.32,dm.dragonSpine,side*.55,.95,-3.78);
  part(netherDragon,.6,1.4,.65,dm.dragon,side*.88,-1.32,1.45);
  part(netherDragon,.45,.7,.55,dm.dragonEdge,side*.9,-2.08,1.30);
}
// Rückenstacheln und lange, segmentierte Schwanzsilhouette.
for(let i=0;i<7;i++)part(netherDragon,.43,.45,.58,dm.dragonSpine,0,1.5-i*.12,-2.0+i*1.03);
for(let i=0;i<7;i++){
  const scale=1-i*.11;
  part(netherDragon,1.1*scale,.87*scale,1.18,dm.dragon,0,.05-i*.08,3.0+i*1.12);
}
const netherWings=[];
for(const side of [-1,1]){
  const wing=new THREE.Group();wing.position.set(side*1.45,.8,.15);netherDragon.add(wing);
  // Kräftige tragende Flügelstreben und dreifach gestaffelte violette Membran.
  part(wing,5.5,.20,.44,dm.dragonEdge,side*2.65,.06,0);
  part(wing,4.7,.17,.35,dm.dragonEdge,side*5.15,-.02,1.3);
  part(wing,5.1,.13,2.8,dm.dragonWing,side*3.9,-.12,.96);
  part(wing,3.2,.13,3.2,dm.purple,side*6.7,-.12,1.30);
  part(wing,1.2,.30,.30,dm.dragonSpine,side*7.6,.04,1.05);
  netherWings.push({wing,side});
}
// Sanfte violette Partikel vor dem Drachenmaul – nur in der schönen Grafik.
// Ein einziges InstancedMesh statt separater Partikel-Objekte.
const netherBreath=new THREE.InstancedMesh(new THREE.BoxGeometry(.22,.22,.22),
  new THREE.MeshBasicMaterial({color:'#d37cff',transparent:true,opacity:.73,depthWrite:false}),12);
const netherBreathTransform=new THREE.Object3D();
netherDragon.add(netherBreath);
netherDragon.scale.setScalar(1.13);
netherDragon.visible=false;

// Banner und Feuerbecken: kleine, gemeinsam instanzierte Dekorationen;
// die ursprünglichen V27-Mauern bleiben unverändert und abbaubar.
const fortressAccentGroup=new THREE.Group();scene.add(fortressAccentGroup);
const flagMat=new THREE.MeshLambertMaterial({color:'#ad4c56',emissive:'#783044',emissiveIntensity:.23,side:THREE.DoubleSide});
const crestMat=new THREE.MeshLambertMaterial({color:'#e5a851'});
for(const x of [-9,9]){
  const banner=new THREE.Group();
  banner.position.set(x+.5,10,-33.84);
  part(banner,1.22,3.85,.055,flagMat,0,0,0);
  part(banner,.82,1,.05,crestMat,0,-.3,.09);
  part(banner,1.58,.15,.18,flagMat,0,2.35,0);
  fortressAccentGroup.add(banner);
}
fortressAccentGroup.visible=false;

const castleLampSites=[...interiorLampSites];
for(const x of [-8,8])for(const z of [-60,-51,-32,-24,-16])
  castleLampSites.push([x,6,z,'lantern']);

const fixedLanterns=castleLampSites.map((site,index)=>{
  const [x,y,z,,dx=0,dz=0]=site;
  const inside=index<interiorLampSites.length;
  const light=new THREE.PointLight(inside?'#ffd1a0':'#ffc284',0,inside?10:13,2);
  light.position.set(x+.5-dx*.22,y+.52,z+.5-dz*.22);
  scene.add(light);
  return {site,light,power:inside?36:52};
});
const fixedLanternKeys=new Set(castleLampSites.map(([x,y,z])=>key(x,y,z)));
const editLanterns=Array.from({length:3},()=>new THREE.PointLight('#ffc284',0,10,2));
scene.add(...editLanterns);
const mistMaterial=new THREE.ShaderMaterial({
  transparent:true,depthWrite:false,side:THREE.DoubleSide,
  vertexShader:`varying vec2 p;
    void main(){p=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`varying vec2 p;
    void main(){
      float edge=1.-smoothstep(.20,.50,length(p-.5));
      float streak=.54+.18*sin(p.x*24.+p.y*17.)+.11*sin(p.x*51.-p.y*30.);
      gl_FragColor=vec4(.45,.52,.70,edge*streak*.28);
    }`
});
const castleMist=new THREE.Group();
const mistPlane=new THREE.PlaneGeometry(1,1);
for(const [x,z,width] of [[-48,-53,40],[48,-50,38],[-33,-25,30],[33,-23,28],[-22,-87,40],[29,-86,36]]){
  const sheet=new THREE.Mesh(mistPlane,mistMaterial);
  sheet.position.set(x,5.4,z);
  sheet.scale.set(width,2.8,1);
  castleMist.add(sheet);
}
scene.add(castleMist);
// Ironwork is attached to the actual light block, never to a fixed overlay.
const lanternIron=new THREE.MeshStandardMaterial({color:'#352b29',roughness:.68,metalness:.42});
const lanternFrames=new THREE.Group();
for(const [x,y,z,type,dx=0,dz=0] of castleLampSites){
  if(type!=='lantern')continue;
  const frame=new THREE.Group();
  frame.position.set(x+.5,y+.5,z+.5);
  for(const cornerX of [-.51,.51])for(const cornerZ of [-.51,.51])
    part(frame,.075,1.08,.075,lanternIron,cornerX,0,cornerZ);
  for(const dy of [-.5,.5])part(frame,1.08,.08,1.08,lanternIron,0,dy,0);
  if(dx||dz){
    part(frame,dx?.12:.38,.72,dz?.12:.38,lanternIron,dx*.54,-.54,dz*.54);
    part(frame,dx?.61:.17,.12,dz?.61:.17,lanternIron,dx*.29,-.55,dz*.29);
    frame.userData.wall=[x+dx,y-1,z+dz];
  }
  frame.userData.site=[x,y,z,type];
  lanternFrames.add(frame);
}
scene.add(lanternFrames);

// Render distant ridges as silhouettes beyond the playable grid.
const ridgeGeometry=new THREE.BufferGeometry();
const ridgeVertices=[],ridgeColors=[];
for(let layer=0;layer<3;layer++){
  const radius=142+layer*23;
  const tone=new THREE.Color(['#233b42','#344857','#485971'][layer]);
  const height=i=>6+layer*7+Math.sin(i*.25+layer)*6+pixelHash(i%120,layer,91)*2.7;
  for(let i=0;i<120;i++){
    const a=i*Math.PI/60,b=(i+1)*Math.PI/60;
    const ax=Math.cos(a)*radius,az=Math.sin(a)*radius-28;
    const bx=Math.cos(b)*radius,bz=Math.sin(b)*radius-28;
    ridgeVertices.push(ax,-4,az,bx,-4,bz,bx,height(i+1),bz,ax,-4,az,bx,height(i+1),bz,ax,height(i),az);
    for(let j=0;j<6;j++)ridgeColors.push(tone.r,tone.g,tone.b);
  }
}
ridgeGeometry.setAttribute('position',new THREE.Float32BufferAttribute(ridgeVertices,3));
ridgeGeometry.setAttribute('color',new THREE.Float32BufferAttribute(ridgeColors,3));
const castleRidges=new THREE.Mesh(ridgeGeometry,new THREE.MeshBasicMaterial({
  vertexColors:true,side:THREE.DoubleSide,fog:false
}));
scene.add(castleRidges);

// Rolling ground outside the editable square meets the flat build area at its edge.
const foothillsGeometry=new THREE.PlaneGeometry(420,420,140,140);
foothillsGeometry.rotateX(-Math.PI/2);
const hillPositions=foothillsGeometry.attributes.position;
const hillColors=[];
const hillColor=new THREE.Color();
for(let i=0;i<hillPositions.count;i++){
  const x=hillPositions.getX(i),z=hillPositions.getZ(i);
  const edge=Math.max(Math.abs(x),Math.abs(z))-HALF;
  const blend=THREE.MathUtils.smoothstep(edge,0,40);
  const rolls=5+4*Math.sin(x*.039+Math.sin(z*.03))+3*Math.cos(z*.053-x*.019);
  hillPositions.setY(i,MEADOW_HEIGHT-.16+blend*rolls);
  hillColor.setHSL(.24+Math.sin(x*.051+z*.041)*.025,.21,.19+Math.cos(x*.055-z*.041)*.027);
  hillColors.push(hillColor.r,hillColor.g,hillColor.b);
}
// Drop triangles within the build area, so digging reveals the real ground.
const hillIndices=[];
const originalIndices=foothillsGeometry.index.array;
for(let i=0;i<originalIndices.length;i+=3){
  const a=originalIndices[i],b=originalIndices[i+1],c=originalIndices[i+2];
  const x=(hillPositions.getX(a)+hillPositions.getX(b)+hillPositions.getX(c))/3;
  const z=(hillPositions.getZ(a)+hillPositions.getZ(b)+hillPositions.getZ(c))/3;
  if(Math.max(Math.abs(x),Math.abs(z))>=HALF)hillIndices.push(a,b,c);
}
foothillsGeometry.setIndex(hillIndices);
foothillsGeometry.setAttribute('color',new THREE.Float32BufferAttribute(hillColors,3));
foothillsGeometry.computeVertexNormals();
scene.add(new THREE.Mesh(foothillsGeometry,new THREE.MeshLambertMaterial({vertexColors:true})));

// The valley beyond the building grid uses three instanced tree silhouettes.
const valleyTreeCount=570;
const valleyTrees=new THREE.InstancedMesh(
  new THREE.ConeGeometry(1,1,7),
  new THREE.MeshBasicMaterial({fog:false}),
  valleyTreeCount*3
);
const valleyTreeTransform=new THREE.Object3D();
const valleyTreeColor=new THREE.Color();
for(let i=0;i<valleyTreeCount;i++){
  const angle=i*2.399963;
  const radius=154+pixelHash(i,0,43)*25;
  const x=Math.cos(angle)*radius,z=Math.sin(angle)*radius-28;
  const treeHeight=3+pixelHash(i,2,71)*5.8;
  const width=treeHeight*(.19+pixelHash(i,3,71)*.10);
  const edge=Math.max(Math.abs(x),Math.abs(z))-HALF;
  const base=MEADOW_HEIGHT-.16+THREE.MathUtils.smoothstep(edge,0,40)*
    (5+4*Math.sin(x*.039+Math.sin(z*.03))+3*Math.cos(z*.053-x*.019));
  for(let tier=0;tier<3;tier++){
    valleyTreeTransform.position.set(x,base+treeHeight*(.33+tier*.23),z);
    valleyTreeTransform.rotation.y=angle;
    valleyTreeTransform.scale.set(width*(1-tier*.23),treeHeight*.59,width*(1-tier*.23));
    valleyTreeTransform.updateMatrix();
    const index=i*3+tier;
    valleyTrees.setMatrixAt(index,valleyTreeTransform.matrix);
    valleyTreeColor.set(radius<151?'#263c42':'#3a4b56').multiplyScalar(.85+tier*.11+pixelHash(i,5,43)*.24);
    valleyTrees.setColorAt(index,valleyTreeColor);
  }
}
scene.add(valleyTrees);

const gateStone=materialByType.netherTrim[0];
const gateMolding=new THREE.Group();
const roofStone=materialByType.netherDeep[0];
function facadePart(site,type,w,h,d,material,x,y,z){
  const mesh=part(gateMolding,w,h,d,material,x,y,z);
  mesh.userData.site=site;
  mesh.userData.type=type;
  return mesh;
}

// The portal moulding frames the existing clear passage and lever mounts.
for(const side of [-1,1]){
  const x=side<0?-4:4;
  for(let y=5;y<11;y++){
    facadePart([x,y,-34],'netherBrick',.68,.96,.36,gateStone,x+.5,y+.5,-33.87);
  }
}
const archCenter=.5;
const archSpring=10.98;
for(let i=0;i<17;i++){
  const shape=new THREE.Shape();
  const start=i*Math.PI/17+.006,end=(i+1)*Math.PI/17-.006;
  const point=(angle,width,height)=>[archCenter+width*Math.cos(angle),archSpring+height*Math.sin(angle)];
  shape.moveTo(...point(start,3.50,1.12));
  shape.lineTo(...point(end,3.50,1.12));
  shape.lineTo(...point(end,3.92,1.78));
  shape.lineTo(...point(start,3.92,1.78));
  shape.closePath();
  const geometry=new THREE.ExtrudeGeometry(shape,{depth:.45,bevelEnabled:true,
    bevelSize:.026,bevelThickness:.024,bevelSegments:1,steps:1});
  const stone=new THREE.Mesh(geometry,gateStone);
  stone.position.z=-34.02+(i===8?.09:0);
  stone.userData.site=[Math.floor(point((start+end)/2,3.5,1.12)[0]),11,-35];
  stone.userData.type='netherBrick';
  gateMolding.add(stone);
}

// Sloped masonry caps cast a distinct edge above the front buttresses.
for(const x of [-33,-26,-19,19,26,33]){
  for(const [y,z,depth] of [[8.03,-32.52,1.06],[11.03,-33.51,1.03]]){
    const cap=facadePart([x,Math.floor(y)-1,Math.floor(z)],'netherBrick',
      3.13,.15,depth,gateStone,x+.5,y,z);
    cap.rotation.x=.16;
  }
}
for(const x of towerWindows){
  const site=[x,11,-35];
  for(const y of [10.7,11.65,12.55])
    facadePart(site,'glass',.98,.058,.105,roofStone,x+.5,y,-34.82);
}

// Each roof strip follows the slope above the matching editable roof course.
for(const [a,b] of [[-12,-4],[4,12]]){
  const center=(a+b+1)/2;
  for(let inset=0;inset<4;inset++){
    for(const side of [-1,1]){
      const x=center+side*(4-inset);
      const anchorX=side<0?a+inset:b-inset;
      const roof=facadePart([anchorX,16+inset,-38],'netherDeep',
        Math.SQRT2+.05,.16,9.32,roofStone,x,17.55+inset,-37.5);
      roof.rotation.z=-side*Math.PI/4;
    }
  }
  facadePart([Math.floor(center),20,-38],'netherDeep',1.12,.26,9.4,roofStone,center,21.17,-37.5);
}
// Continuous slate strips cover the stepped roofs of both wings and the hall.
for(const [left,right,zMin,zMax,base,count] of [
  [-35,-19,-75,-44,14,7], [19,34,-75,-44,14,7], [-17,17,-81,-63,19,13]
]){
  for(let course=0;course<count;course++)for(const side of [-1,1]){
    const x=side<0?left+course:right-course;
    for(let z=zMin;z<=zMax;z+=4){
      const length=Math.min(4,zMax-z+1);
      const strip=facadePart([x,base+course,z],'netherDeep',
        Math.SQRT2+.016,.12,length,roofStone,x+.5,base+course+1.54,z+length/2);
      strip.rotation.z=-side*Math.PI/4;
    }
  }
}
// Recessed tower glazing sits behind the face of the masonry.
for(const x of towerWindows){
  const site=[x,11,-35];
  for(const side of [-1,1])
    facadePart(site,'glass',.19,3,.32,gateStone,x+.5+side*.58,11.5,-33.98);
  facadePart(site,'glass',1.43,.22,.59,gateStone,x+.5,9.98,-33.91);
  facadePart(site,'glass',1.36,.29,.38,gateStone,x+.5,13.05,-33.96);
  facadePart(site,'glass',.065,2.94,.065,roofStone,x+.5,11.5,-34.84);
}
for(const [left,right] of [[-12,-4],[4,12]]){
  for(let x=left;x<=right;x++){
    facadePart([x,15,-34],'netherBrick',1,.24,.47,gateStone,x+.5,15.79,-33.94);
    facadePart([x,5,-34],'netherBrick',1,.46,.36,roofStone,x+.5,5.24,-33.95);
  }
  for(const x of [left,right])for(let y=6;y<15;y++){
    facadePart([x,y,-34],'netherBrick',y%2?.69:.87,.91,.21,gateStone,x+.5,y+.5,-33.96);
  }
}
// Corbelled stone turrets project above the corner of the curtain wall.
const turretCourses=[
  [0.66,1.56,1.65,11.85,gateStone],
  [1.56,1.56,3.40,14.37,materialByType.netherBrick[0]],
  [1.67,1.58,.28,16.2,gateStone],
  [0.12,1.76,3.65,18.15,roofStone]
];
for(const x of [-37,36])for(const z of [-34.5,-81.5]){
  for(const [upper,lower,height,y,material] of turretCourses){
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(upper,lower,height,16),material);
    mesh.position.set(x+.5,y,z);
    mesh.userData.site=[x,12,Math.floor(z)];
    mesh.userData.type='netherBrick';
    gateMolding.add(mesh);
  }
}
// Coping and recessed horizontal courses emphasize the thickness of the wall.
for(const [start,end] of [[-38,-13],[13,37]]){
  for(let x=start;x<=end;x++){
    facadePart([x,12,-35],'netherBrick',1,.20,.43,gateStone,x+.5,12.75,-34.03);
    facadePart([x,5,-35],'netherBrick',1,.38,.19,roofStone,x+.5,5.22,-33.98);
    if((x+38)%3===0)
      facadePart([x,13,-35],'netherTrim',1.04,.17,1.14,gateStone,x+.5,14,-34.5);
  }
}
// Projecting oak beams and stone brackets give the tower eaves a visible underside.
for(const [left,right] of [[-12,-4],[4,12]]){
  for(let x=left+1;x<right;x+=2){
    facadePart([x,15,-34],'netherBrick',.34,.31,.58,roofStone,x+.5,15.33,-33.86);
  }
}
// Crown the side and rear curtain walls with projecting stone caps.
for(const x of [-38,37])for(let z=-80;z<=-39;z+=3){
  facadePart([x,13,z],'netherBrick',1.28,.24,3,gateStone,x+.5,14,z+1.5);
}
for(let x=-37;x<=34;x+=3){
  facadePart([x,13,-82],'netherBrick',3,.24,1.27,gateStone,x+1.5,14,-81.5);
}

// Carved window surrounds on the courtyard face of the great hall.
for(const x of [-10,-6,6,10]){
  const site=[x,9,-64];
  for(const side of [-1,1]){
    facadePart(site,'glass',.25,4.04,.37,gateStone,x+.5+side*1.61,10,-62.95);
    facadePart(site,'glass',.086,3.94,.14,roofStone,x+.5+side*.50,10,-62.94);
  }
  facadePart(site,'glass',3.64,.27,.56,gateStone,x+.5,7.98,-62.91);
  facadePart(site,'glass',3.55,.32,.44,gateStone,x+.5,12.12,-62.93);
  facadePart(site,'glass',3,.11,.14,roofStone,x+.5,10.15,-62.93);
}

// Oak ceiling members and angled braces sit overhead in the two side wings.
const ceilingOak=materialByType.planks[0];
for(const [left,right] of [[-35,-19],[19,34]]){
  for(const z of [-71,-68,-61,-58,-51,-48]){
    const center=(left+right+1)/2;
    const site=[Math.floor(center),13,z];
    facadePart(site,'netherTrim',right-left-.82,.39,.41,ceilingOak,center,12.78,z+.5);
    for(const side of [-1,1]){
      const x=side<0?left+1.48:right-.48;
      const brace=facadePart(site,'netherTrim',1.18,.24,.29,ceilingOak,x,12.27,z+.5);
      brace.rotation.z=-side*Math.PI/4;
    }
  }
}

// Stone benches sit beside the courtyard paths and face the central walk.
for(const x of [-12,12])for(const z of [-58,-47]){
  facadePart([x,6,z],'netherTrim',.72,.19,2.45,gateStone,x+.5,6.2,z+.5);
}
// Reuse the editable gable glazing as the anchor for the carved rose.
const roseSite=[0,24,-63];
const roseGlass=new THREE.MeshStandardMaterial({color:'#405a70',
  emissive:'#df9251',emissiveIntensity:.36,roughness:.35});
const roseDisk=new THREE.Mesh(new THREE.CircleGeometry(1.86,48),roseGlass);
roseDisk.position.set(.5,24.5,-62.87);
roseDisk.userData={site:roseSite,type:'glass'};
gateMolding.add(roseDisk);
const roseRing=new THREE.Mesh(new THREE.TorusGeometry(1.87,.18,10,48),gateStone);
roseRing.position.copy(roseDisk.position);
roseRing.position.z=-62.75;
roseRing.userData={site:roseSite,type:'glass'};
gateMolding.add(roseRing);
const petalGeometry=new THREE.TorusGeometry(.45,.063,8,24);
for(let i=0;i<8;i++){
  const angle=i*Math.PI/4;
  const petal=new THREE.Mesh(petalGeometry,gateStone);
  petal.position.set(.5+1.16*Math.cos(angle),24.5+1.16*Math.sin(angle),-62.62);
  petal.userData={site:roseSite,type:'glass'};
  gateMolding.add(petal);
}
facadePart(roseSite,'glass',.45,.45,.24,gateStone,.5,24.5,-62.62).rotation.z=Math.PI/4;

// Pilasters frame the hall entrance while leaving the public routes open.
for(const x of [-14,14]){
  for(let y=5;y<=16;y++)
    facadePart([x,y,-64],'netherBrick',.72,.98,.42,gateStone,x+.5,y+.5,-62.96);
  for(const y of [5.26,16.78])
    facadePart([x,Math.floor(y),-64],'netherBrick',1.26,.40,.65,gateStone,x+.5,y,-62.84);
}
// Stone ribs follow the ceiling of the central nave.
for(const z of [-77,-73,-69]){
  for(let i=0;i<15;i++){
    const angle=(i+.5)*Math.PI/15;
    const x=.5+9.4*Math.cos(angle);
    const y=11.7+3.97*Math.sin(angle);
    const rib=facadePart([Math.floor(x),16,z],'netherTrim',
      1.98,.34,.47,gateStone,x,y,z+.5);
    rib.rotation.z=Math.atan2(3.97*Math.cos(angle),-9.4*Math.sin(angle));
  }
  for(const x of [-9,9]){
    facadePart([x,4,z],'cobble',.84,7.15,.86,gateStone,x+.5,8.575,z+.5);
    for(const y of [5.23,12.04])
      facadePart([x,4,z],'cobble',1.16,.34,1.12,gateStone,x+.5,y,z+.5);
  }
}

// External buttresses divide the wing walls into window bays.
for(const x of [-35,34])for(const z of [-74,-65,-55,-44]){
  const outward=x<0?-1:1;
  for(const [height,y,depth] of [[3.6,6.8,.92],[3.1,10.09,.63]]){
    facadePart([x,Math.floor(y),z],'netherBrick',
      depth,height,.83,gateStone,x+.5+outward*.73,y,z+.5);
  }
  const cap=facadePart([x,12,z],'netherBrick',.79,.23,1.02,gateStone,
    x+.5+outward*.71,11.78,z+.5);
  cap.rotation.z=-outward*.22;
}

// Ridge tiles finish the three main roofs.
for(const [x,minZ,maxZ,y] of [[-27,-75,-44,22],[26,-75,-44,22],[0,-81,-63,33]]){
  for(let z=minZ;z<=maxZ;z++){
    const ridge=facadePart([x,y-1,z],'netherDeep',.70,.23,.99,roofStone,x+.5,y+.10,z+.5);
    ridge.rotation.z=Math.PI/4;
  }
}
// Three masonry ribs articulate the passage behind the lifting gate.
for(const z of [-42,-40,-37]){
  const anchor=[0,12,z];
  for(let segment=0;segment<15;segment++){
    const start=segment*Math.PI/15+.004;
    const end=(segment+1)*Math.PI/15-.004;
    const shape=new THREE.Shape();
    const point=(angle,radius,rise)=>[.5+radius*Math.cos(angle),9.62+rise*Math.sin(angle)];
    shape.moveTo(...point(start,3.50,2.03));
    shape.lineTo(...point(end,3.50,2.03));
    shape.lineTo(...point(end,3.83,2.47));
    shape.lineTo(...point(start,3.83,2.47));
    shape.closePath();
    const stone=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{
      depth:.34,bevelEnabled:true,bevelSize:.018,bevelThickness:.018,bevelSegments:1
    }),gateStone);
    stone.position.z=z+.29;
    stone.userData={site:anchor,type:'netherBrick'};
    gateMolding.add(stone);
  }
  for(const x of [-4,4]){
    const inward=-Math.sign(x);
    facadePart([x,9,z],'netherBrick',.44,.29,.75,gateStone,
      x+.5+inward*.49,9.52,z+.46);
  }
}
scene.add(gateMolding);

// Oak leaves stand open against the reveals. Each leaf is attached to its hinge block.
const castleDoors=new THREE.Group();
const oakDoor=materialByType.planks[0];
const doorIron=new THREE.MeshStandardMaterial({color:'#393733',roughness:.58,metalness:.53});
const ringGeometry=new THREE.TorusGeometry(.13,.034,8,16);
for(const [half,z,height] of [[7,-35,7.6],[5,-59,6.1]]){
  for(const side of [-1,1]){
    const hinge=side*(half+.5)+.5;
    const door=new THREE.Group();
    door.position.set(hinge,5,z+.66);
    door.rotation.y=side*Math.PI*.49;
    const width=half+.4;
    door.userData.site=[side*(half+1),5,z];
    door.userData.type=netherBlockAt(...door.userData.site);
    for(let plank=0;plank<10;plank++){
      const x=-side*width*(plank+.5)/10;
      part(door,width/10-.015,height,.17,oakDoor,x,height/2,0);
    }
    for(const y of [.55,height*.49,height-.54]){
      part(door,width,.19,.08,doorIron,-side*width/2,y,.106);
      for(let stud=0;stud<6;stud++){
        const rivet=new THREE.Mesh(ringGeometry,doorIron);
        rivet.scale.setScalar(.27);
        rivet.position.set(-side*width*(stud+.5)/6,y,.166);
        door.add(rivet);
      }
    }
    const handle=new THREE.Mesh(ringGeometry,doorIron);
    handle.position.set(-side*(width-.42),2.0,.155);
    door.add(handle);
    castleDoors.add(door);
  }
}


// Deep exterior window surrounds are attached to their glazing blocks.
const wingWindowDetails=new THREE.Group();
for(const [x,z] of wingWindows){
  const window=new THREE.Group();
  const face=x<0?-1:1;
  window.userData.site=[x,8,z];
  window.position.set(x+.5,8,z);
  for(const edge of [-1,1])
    part(window,.36,3,.23,gateStone,face*.52,1.5,edge*1.08);
  part(window,.57,.19,2.55,gateStone,face*.56,0,0);
  part(window,.39,.28,2.37,gateStone,face*.51,3.1,0);
  part(window,.06,2.95,.084,doorIron,face*.51,1.5,0);
  for(const y of [1,2])part(window,.06,.065,2,doorIron,face*.51,y,0);
  wingWindowDetails.add(window);
}
scene.add(wingWindowDetails);

// Interior details are attached to editable masonry, outside the walking clearance.
const hallDetails=new THREE.Group();
const hallAnchors=[];
function anchorHallDetail(mesh,x,y,z){
  hallAnchors.push({mesh,x,y,z,type:netherBlockAt(x,y,z)});
}
for(let z=-79;z<=-62;z+=4){
  // Individual beam sections allow removal of the corresponding ceiling block.
  for(let x=-10;x<=10;x++){
    const beam=part(hallDetails,1,.42,.36,oakDoor,x+.5,19.8,z+.5);
    anchorHallDetail(beam,x,20,z);
  }
  for(const side of [-1,1]){
    const x=side*16;
    const inside=x+.5-side*.54;
    const sill=part(hallDetails,.67,.19,1.42,gateStone,inside,9,z+.5);
    anchorHallDetail(sill,x,8,z);
    for(const offset of [-1,1]){
      const reveal=part(hallDetails,.55,6,.22,gateStone,inside,12,z+.5+offset*.54);
      anchorHallDetail(reveal,x,11,z+offset);
    }
  }
}
// Corbels under the hall beams and individual purlins along the nave.
for(let z=-79;z<=-62;z+=4){
  for(const side of [-1,1]){
    const x=side*12;
    const corbel=part(hallDetails,1.24,.44,.79,gateStone,x+.5,14.8,z+.5);
    anchorHallDetail(corbel,x,14,z);
  }
}
for(const x of [-6,6])for(let z=-80;z<=-60;z++){
  const purlin=part(hallDetails,.24,.34,1,oakDoor,x+.5,19.63,z+.5);
  anchorHallDetail(purlin,x,20,z);
}


makeNetherPlan();
const stairMesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),
  materialByType.netherTrim[0],stairTreads.size);
stairMesh.count=0;
stairMesh.frustumCulled=false;
scene.add(stairMesh);
const stairTransform=new THREE.Object3D();
function refreshStairTreads(){
  let count=0;
  for(const tread of stairTreads.values()){
    if(!treadIsSupported(tread))continue;
    const {x,y,z,dx,dz}=tread;
    stairTransform.position.set(x+.5+dx*.25,y+.25,z+.5+dz*.25);
    stairTransform.scale.set(dx?.5:1,.5,dz?.5:1);
    stairTransform.updateMatrix();
    stairMesh.setMatrixAt(count++,stairTransform.matrix);
  }
  stairMesh.count=count;
  stairMesh.instanceMatrix.needsUpdate=true;
}
const bunkerFurnishings=new THREE.Group();
const bunkerCloth=new THREE.MeshStandardMaterial({color:'#713324',roughness:1});
const bunkerLinen=new THREE.MeshStandardMaterial({color:'#d5c6a7',roughness:1});
const bunkerAmber=new THREE.MeshStandardMaterial({color:'#aa7137',roughness:.36});
const bunkerProp=(material,x,y,z,w,h,d)=>part(bunkerFurnishings,w,h,d,material,x,y,z);
// The wardrobe looks like a shallow cupboard until its false back lifts.
const wardrobe=new THREE.Group();
for(const z of [-63.83,-60.17]){
  part(wardrobe,.16,4,.18,oakDoor,26.98,6.91,z);
  for(const y of [6,7.65])part(wardrobe,.08,.22,.12,doorIron,26.92,y,z);
}
part(wardrobe,.28,.22,3.96,oakDoor,26.97,8.68,-62);
part(wardrobe,.15,.12,3.80,oakDoor,26.90,8.48,-62);
for(const z of [-63.5,-60.5]){
  for(const y of [5.17,8.11])
    part(wardrobe,.105,.15,.83,oakDoor,26.94,y,z);
  for(const edge of [-.34,.34])
    part(wardrobe,.10,2.88,.11,oakDoor,26.94,6.65,z+edge);
  const pull=new THREE.Mesh(new THREE.TorusGeometry(.10,.018,6,12),doorIron);
  pull.rotation.y=Math.PI/2;
  pull.position.set(26.83,6.48,z);
  wardrobe.add(pull);
}
// A continuous cornice and plinth tie the four front panels together.
part(wardrobe,.46,.16,4.08,oakDoor,26.86,8.71,-62);
part(wardrobe,.38,.11,3.98,oakDoor,26.89,8.56,-62);
part(wardrobe,.15,.11,3.82,oakDoor,26.88,5.055,-62);
const wardrobeLeaves=[-1,1].map(side=>{
  const hinge=new THREE.Group();
  hinge.position.set(26.89,5,-62+side*.99);
  const center=-side*.485;
  part(hinge,.13,3.32,.97,oakDoor,0,1.70,center);
  for(const y of [.24,1.42,1.61,3.15])
    part(hinge,.052,.09,.84,oakDoor,-.081,y,center);
  for(const edge of [-.39,.39])
    part(hinge,.052,2.93,.09,oakDoor,-.081,1.70,center+edge);
  for(const y of [.42,2.98]){
    part(hinge,.046,.11,.21,doorIron,-.087,y,-side*.12);
    part(hinge,.079,.15,.079,doorIron,-.067,y,-side*.037);
  }
  part(hinge,.035,.24,.11,doorIron,-.092,1.49,-side*.82);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.075,.014,6,12),doorIron);
  ring.rotation.y=Math.PI/2;
  ring.position.set(-.105,1.46,-side*.82);
  hinge.add(ring);
  wardrobe.add(hinge);
  return {hinge,side};
});
const wardrobeBack=new THREE.Group();
wardrobe.add(wardrobeBack);
for(let plank=0;plank<7;plank++)
  part(wardrobeBack,.11,3,.283,oakDoor,29.12,6.5,-62+(plank-3)*.285);
for(const y of [5.48,7.53])
  part(wardrobeBack,.075,.13,1.96,doorIron,29.05,y,-62);
scene.add(wardrobe);
// The study occupies the alcoves on either side of the wardrobe approach.
const study=new THREE.Group();
study.position.set(24,5,-60);
const studyBox=(w,h,d,mat,x,y,z)=>part(study,w,h,d,mat,x,y,z);
const studyLeather=new THREE.MeshStandardMaterial({color:'#4b3024',roughness:.83});
const studyGreen=new THREE.MeshStandardMaterial({color:'#38473e',roughness:1});
const studyBrass=new THREE.MeshStandardMaterial({color:'#987346',roughness:.51,metalness:.48});
studyBox(2.44,.16,.88,oakDoor,0,.88,3.62);
for(const x of [-1.06,1.06])for(const z of [3.31,3.94])
  studyBox(.14,.80,.14,oakDoor,x,.40,z);
studyBox(2.31,.25,.68,oakDoor,0,.68,3.65);
for(const x of [-.58,.58]){
  studyBox(1.02,.18,.057,studyLeather,x,.68,3.29);
  studyBox(.16,.053,.086,studyBrass,x,.68,3.24);
}
studyBox(1.05,.013,.57,studyLeather,-.19,.97,3.60);
for(const x of [-.41,.03])
  studyBox(.43,.028,.38,bunkerLinen,x,.994,3.60).rotation.z=x<0?.036:-.036;
for(let line=0;line<7;line++)for(const x of [-.41,.03])
  studyBox(.29,.003,.009,studyLeather,x,1.010,3.45+line*.043);
studyBox(.10,.11,.10,doorIron,.71,1.015,3.76);
studyBox(.014,.30,.026,bunkerLinen,.71,1.17,3.76).rotation.z=-.38;
studyBox(.64,.11,.62,oakDoor,0,.48,2.58);
studyBox(.60,.085,.57,studyGreen,0,.575,2.58);
for(const x of [-.25,.25]){
  for(const z of [2.34,2.82])studyBox(.09,.44,.09,oakDoor,x,.22,z);
  studyBox(.09,.55,.09,oakDoor,x,.82,2.30);
}
studyBox(.59,.18,.09,oakDoor,0,1.05,2.30);

// Bookcase against the north wall, with inset back, framed shelves and book spines.
studyBox(2.41,2.28,.09,oakDoor,-1.22,1.14,-3.94);
for(const x of [-2.43,-.01])
  studyBox(.14,2.35,.44,oakDoor,x,1.175,-3.75);
for(const y of [.12,.68,1.22,1.76,2.32])
  studyBox(2.56,.10,.48,oakDoor,-1.22,y,-3.74);
const spineMaterials=[studyGreen,studyLeather,bunkerCloth,oakDoor];
for(let row=0;row<3;row++)for(let book=0;book<10;book++){
  const height=.24+pixelHash(book,row,161)*.20;
  const x=-2.28+book*.21;
  const y=.73+row*.54+height/2;
  studyBox(.15,height,.24,spineMaterials[(book+row)%4],x,y,-3.68);
  studyBox(.107,.027,.006,studyBrass,x,y+height*.25,-3.558);
}
// Wall hanging and a low chest frame the room without obstructing either doorway.
studyBox(.10,1.11,1.28,studyGreen,4.93,2.24,1.65);
studyBox(.16,.09,1.49,oakDoor,4.88,2.82,1.65);
for(const z of [1.07,2.23])studyBox(.016,1.02,.047,studyBrass,4.871,2.24,z);
studyBox(.021,.36,.36,studyBrass,4.869,2.24,1.65).rotation.x=Math.PI/4;
studyBox(1.32,.54,.63,oakDoor,3.78,.27,3.56);
studyBox(1.40,.13,.68,oakDoor,3.78,.60,3.56);
for(const x of [3.35,4.21])studyBox(.074,.5,.031,doorIron,x,.29,3.23);
studyBox(.18,.17,.038,doorIron,3.78,.49,3.218);

const studyLight=new THREE.PointLight('#ffcf9a',0,7,2);
studyLight.position.set(.10,1.32,3.47);
study.add(studyLight);
studyBox(.14,.037,.14,studyBrass,.10,.985,3.47);
studyBox(.055,.21,.055,bunkerLinen,.10,1.10,3.47);
studyBox(.032,.085,.032,materialByType.lantern[0],.10,1.24,3.47);
scene.add(study);
function updateWardrobe(dt){
  study.visible=player.x>15&&player.x<32&&player.z>-69&&player.z<-51&&player.y<13;
  studyLight.intensity=study.visible?8:0;
  const aligned=player.y>=4.7&&player.y<8&&Math.abs(player.z+62)<1.28;
  const near=aligned&&player.x>25.25&&player.x<32;
  for(const {hinge,side} of wardrobeLeaves)
    hinge.rotation.y=THREE.MathUtils.damp(hinge.rotation.y,near?side*1.59:0,15,dt);
  wardrobeBack.position.y=THREE.MathUtils.damp(wardrobeBack.position.y,near?3.05:0,18,dt);
}

// Side hinge keeps the open lid entirely outside the stair lane.
const hatchAssembly=new THREE.Group();
let bunkerHatchOpen=false;
function overBunkerHatch(x,z){
  return x+PLAYER_R>18&&x-PLAYER_R<21&&z+PLAYER_R> -3&&z-PLAYER_R<1;
}
hatchAssembly.position.set(18,4.76,-1);
bunkerFurnishings.add(hatchAssembly);
for(let i=0;i<9;i++){
  const x=(i+.5)*3/9;
  part(hatchAssembly,.325,.19,3.98,oakDoor,x,0,0);
}
// Unit grass tiles match the UV scale and top surface of the surrounding turf.
for(let x=0;x<3;x++)for(let z=-2;z<2;z++)
  part(hatchAssembly,1,.145,1,materialByType.grass,x+.5,.1675,z+.5);
for(const z of [-1.38,1.38])part(hatchAssembly,2.88,.065,.09,doorIron,1.5,-.10,z);
makeNetherPlan();
const leverDoors=doorSites.map(([xa,xb,ya,yb,za,zb])=>{
  const alongX=xb-xa>=zb-za;
  const depth=alongX?zb-za+1:xb-xa+1;
  const x=(xa+xb+1)/2,z=(za+zb+1)/2,h=yb-ya+1;
  const width=alongX?xb-xa+1:zb-za+1;
  const door=new THREE.Group();
  door.position.set(x,ya,z);
  door.rotation.y=alongX?0:Math.PI/2;
  for(let i=0;i<width*3;i++)
    part(door,.326,h,.22,oakDoor,(i+.5)/3-width/2,h/2,0);
  const frame=new THREE.Group();
  frame.position.copy(door.position);
  frame.rotation.y=door.rotation.y;
  dressDoorway({frame,door,part,stone:materialByType.netherTrim[0],
    iron:doorIron,width,height:h,depth});
  scene.add(door,frame);
  const levers=new THREE.Group();
  const handles=[];
  for(const side of [-1,1]){
    const reach=depth/2+.19;
    const mount=new THREE.Group();
    mount.position.set(x+(alongX?width/2+.24:side*reach),ya+1.1,
      z+(alongX?side*reach:width/2+.24));
    mount.rotation.y=alongX?(side===1?0:Math.PI):side*Math.PI/2;
    part(mount,.26,.38,.10,doorIron,0,0,0);
    const handle=new THREE.Group();
    handle.position.z=.1;
    part(handle,.08,.28,.08,doorIron,0,.12,0);
    part(handle,.13,.12,.13,oakDoor,0,.27,0);
    mount.add(handle);
    levers.add(mount);
    handles.push(handle);
  }
  scene.add(levers);
  return {door,frame,levers,handles,x,z,ya,h,width,alongX,open:false};
});
function insideDoor(d,x,y,z){
  return Math.abs(x-d.x)<(d.alongX?d.width/2:.18)+PLAYER_R&&
    Math.abs(z-d.z)<(d.alongX?.18:d.width/2)+PLAYER_R&&y<d.ya+d.h&&y+PLAYER_H>d.ya;
}
const castleLeverBtn=$('castleLeverBtn');
let nearestLeverDoor=null;
castleLeverBtn.addEventListener('click',()=>{
  const d=nearestLeverDoor;
  if(!gameRunning||!d)return;
  if(d.open&&insideDoor(d,player.x,player.y,player.z))return;
  d.open=!d.open;
});
function updateLeverDoors(dt){
  nearestLeverDoor=null;
  let distance=2.6;
  for(const d of leverDoors){
    d.door.visible=d.frame.visible=d.levers.visible=isMeadow();
    if(!d.door.visible)continue;
    for(const handle of d.handles)
      handle.rotation.x=THREE.MathUtils.damp(handle.rotation.x,d.open?1.1:.32,12,dt);
    d.door.position.y=THREE.MathUtils.damp(d.door.position.y,d.ya+(d.open?d.h:0),10,dt);
    const near=Math.hypot(Math.max(0,Math.abs(player.x-d.x)-(d.alongX?d.width/2:0)),
      Math.max(0,Math.abs(player.z-d.z)-(d.alongX?0:d.width/2)),player.y-d.ya);
    if(near<distance){distance=near;nearestLeverDoor=d;}
  }
  const atWardrobe=player.x>25.5&&player.x<32&&Math.abs(player.z+62)<1.65&&player.y<8;
  castleLeverBtn.hidden=!gameRunning||!nearestLeverDoor||atWardrobe;
  if(nearestLeverDoor)castleLeverBtn.textContent=nearestLeverDoor.open?'Hebel · Tür schließen':'Hebel · Tür öffnen';
}
function updateBunkerHatch(dt){
  const near=isMeadow()&&Math.abs(player.x-19.5)<2&&
    player.z>=-4.1&&player.z<=2.3&&player.y>=-.1&&player.y<=7;
  const inOpening=isMeadow()&&overBunkerHatch(player.x,player.z)&&
    player.y<5&&player.y+PLAYER_H>4.45;
  bunkerHatchOpen=gameRunning&&(near||inOpening);
  hatchAssembly.rotation.z=THREE.MathUtils.damp(
    hatchAssembly.rotation.z,bunkerHatchOpen?1.76:0,13,dt);
}

for(const y of [-4.42,-2.83]){
  bunkerProp(oakDoor,15.1,y,-20.6,1.45,.2,2.55);
  bunkerProp(bunkerLinen,15.1,y+.15,-20.6,1.3,.20,2.38);
  bunkerProp(bunkerCloth,15.1,y+.27,-20.23,1.32,.08,1.50);
  bunkerProp(bunkerLinen,15.1,y+.28,-21.57,1,.15,.37);
}
for(const x of [14.45,15.77])for(const z of [-21.79,-19.41])
  bunkerProp(oakDoor,x,-3.65,z,.14,2.65,.14);
for(const y of [-4.6,-3.85,-3.1]){
  bunkerProp(oakDoor,14.62,y,-15.8,1.05,.13,2.8);
  for(let j=0;j<6;j++){
    const jar=new THREE.Mesh(new THREE.CylinderGeometry(.11,.14,.25,10),bunkerAmber);
    jar.position.set(14.7,y+.19,-16.9+j*.41);
    bunkerFurnishings.add(jar);
  }
}
for(const [x,z,w,d] of [[19,-17,2,1.25],[24,-14,1.35,2.8],[24,-20,1.35,3.1]]){
  bunkerProp(oakDoor,x,-4.03,z,w,.19,d);
  for(const dx of [-1,1])for(const dz of [-1,1])
    bunkerProp(oakDoor,x+dx*(w/2-.12),-4.55,z+dz*(d/2-.12),.14,.92,.14);
}
bunkerProp(bunkerCloth,19,-4.98,-17,3.5,.035,3);
bunkerProp(bunkerLinen,19,-3.927,-17,.94,.018,.67);
for(const z of [-18.18,-15.82]){
  bunkerProp(oakDoor,19,-4.52,z,.55,.13,.55);
  bunkerProp(bunkerCloth,19,-4.44,z,.51,.05,.51);
  bunkerProp(oakDoor,19,-4.30,z+Math.sign(z+17)*.23,.55,.56,.09);
}
bunkerProp(gateStone,24,-4.55,-14,.94,.83,1.02);
bunkerProp(materialByType.lavaGlow[0],23.52,-4.5,-14,.035,.32,.45);
bunkerProp(oakDoor,20.86,-3.56,-10.48,.13,2.88,1.26);
const bunkerRoomLights=[
  [23,-2.59,-12.5,20,7], [23,-2.59,-17.5,20,7], [23.1,-4.1,-14,13,5]
].map(([x,y,z,power,range])=>{
  const light=new THREE.PointLight('#ffc18c',0,range,2);
  light.position.set(x,y,z);
  bunkerFurnishings.add(light);
  return {light,power};
});
// Every cellar light hangs from the structural ceiling.
const cellarLightGeometry=new THREE.CylinderGeometry(.15,.19,.31,6);
for(const [x,z] of cellarLamps){
  bunkerProp(doorIron,x,-1.62,z,.045,1.24,.045);
  bunkerProp(doorIron,x,-2.24,z,.37,.085,.37);
  const glass=new THREE.Mesh(cellarLightGeometry,materialByType.lantern[0]);
  glass.position.set(x,-2.43,z);
  bunkerFurnishings.add(glass);
  bunkerProp(doorIron,x,-2.60,z,.32,.085,.32);
  for(const dx of [-.125,.125])for(const dz of [-.125,.125])
    bunkerProp(doorIron,x+dx,-2.43,z+dz,.025,.31,.025);
  const light=new THREE.PointLight('#ffbd80',0,8,2);
  light.position.set(x,-2.74,z);
  bunkerFurnishings.add(light);
  bunkerRoomLights.push({light,power:25,cellar:true});
}
const torchFlame=new THREE.MeshBasicMaterial({color:'#ff832f'});
const torchCore=new THREE.MeshBasicMaterial({color:'#ffe9a2'});
const flameGeometry=new THREE.LatheGeometry([new THREE.Vector2(0,0),new THREE.Vector2(.069,.04),new THREE.Vector2(.087,.105),new THREE.Vector2(.049,.18),new THREE.Vector2(0,.28)],12);
// The hearth and furniture sit beyond the wardrobe's clear walking lane.
const hearthRoom=new THREE.Group();
const hearthStone=materialByType.netherTrim[0];
const hearthBrick=materialByType.netherBrick[0];
const hearthPart=(w,h,d,material,x,y,z)=>part(hearthRoom,w,h,d,material,x,y,z);
hearthPart(3.16,.13,1.34,hearthStone,32,5.065,-56.86);
for(const x of [30.94,33.06]){
  hearthPart(.54,1.55,.85,hearthStone,x,5.87,-56.53);
  hearthPart(.66,.18,.99,hearthStone,x,6.64,-56.53);
}
hearthPart(2.82,.22,1.02,hearthStone,32,6.82,-56.55);
hearthPart(2.27,2.12,.47,hearthBrick,32,7.99,-56.25);
const soot=new THREE.MeshLambertMaterial({color:'#29221f'});
hearthPart(1.67,1.52,.12,soot,32,5.89,-56.09);
for(let block=0;block<9;block++){
  const angle=Math.PI*(block+.5)/9;
  const archStone=hearthPart(.33,.22,.29,hearthStone,
    32+.86*Math.cos(angle),6.15+.48*Math.sin(angle),-57);
  archStone.rotation.z=Math.atan2(.48*Math.cos(angle),-.86*Math.sin(angle));
}
for(let log=0;log<5;log++)
  hearthPart(.47,.14,.15,oakDoor,30.85+log%2*.16,5.20+Math.floor(log/2)*.14,-57.72);
for(const x of [31.43,32.57])
  hearthPart(.08,.24,.60,doorIron,x,5.25,-56.67);
for(const z of [-56.87,-56.60,-56.33])
  hearthPart(1.35,.08,.08,doorIron,32,5.28,z);
const charredWood=new THREE.MeshLambertMaterial({color:'#33241b'});
const splitWood=new THREE.MeshLambertMaterial({color:'#94673f'});
const logGeometry=new THREE.CylinderGeometry(.085,.11,1.12,7);
for(const [x,y,z,angle] of [[31.93,5.44,-56.75,.19],[32.06,5.52,-56.49,-.27],[32.02,5.41,-56.30,.08]]){
  const log=new THREE.Mesh(logGeometry,[charredWood,splitWood,splitWood]);
  log.position.set(x,y,z);
  log.rotation.set(angle,0,Math.PI/2);
  hearthRoom.add(log);
}
const coalGeometry=new THREE.DodecahedronGeometry(.09,0);
const coalMaterials=['#a13510','#de5416','#70301a'].map(color=>
  new THREE.MeshLambertMaterial({color:'#362019',emissive:color,emissiveIntensity:.62}));
for(let index=0;index<18;index++){
  const coal=new THREE.Mesh(coalGeometry,coalMaterials[index%3]);
  coal.position.set(31.48+(index%9)*.13,5.36,-56.81+Math.floor(index/9)*.22);
  coal.scale.set(1,.47,.71);
  coal.rotation.y=index*1.73;
  hearthRoom.add(coal);
}
const hearthFlames=[];
const hearthFlameMaterial=new THREE.ShaderMaterial({
  transparent:true,depthWrite:false,
  uniforms:{time:{value:0}},
  vertexShader:`
    uniform float time;
    varying vec2 flameUV;
    void main(){
      flameUV=uv;
      vec3 p=position;
      p.x+=sin(time*4.5+p.y*25.0+uv.x*6.283)*p.y*.39;
      p.z+=cos(time*3.1+p.y*19.0)*p.y*.24;
      gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
    }`,
  fragmentShader:`
    varying vec2 flameUV;
    void main(){
      float h=flameUV.y;
      vec3 color=mix(vec3(1.0,.76,.24),vec3(.94,.19,.027),smoothstep(.19,.92,h));
      float opacity=smoothstep(0.0,.08,h)*(1.0-smoothstep(.48,1.0,h));
      gl_FragColor=vec4(color,opacity*.88);
      #include <colorspace_fragment>
    }`
});
const emberGeometry=new THREE.BufferGeometry();
const emberPositions=new Float32Array(12*3);
emberGeometry.setAttribute('position',new THREE.BufferAttribute(emberPositions,3));
const embers=new THREE.Points(emberGeometry,new THREE.PointsMaterial({
  color:'#ffad58',size:.037,transparent:true,opacity:.72,depthWrite:false
}));
embers.frustumCulled=false;
hearthRoom.add(embers);
for(const [x,z,height] of [[31.62,-56.62,1.65],[31.92,-56.77,2.75],[32.18,-56.53,2.3],[32.46,-56.68,1.5]]){
  const flame=new THREE.Mesh(flameGeometry,hearthFlameMaterial);
  flame.position.set(x,5.42,z);
  hearthRoom.add(flame);
  hearthFlames.push({flame,height});
}
hearthPart(3.22,.027,2.14,bunkerCloth,32,5.014,-59.12);
for(const z of [-60.13,-58.11])hearthPart(3.12,.014,.045,bunkerAmber,32,5.034,z);
for(const x of [30.47,33.53])hearthPart(.045,.014,2.03,bunkerAmber,x,5.034,-59.12);
for(const z of [-59.82,-58.45]){
  hearthPart(.73,.12,.72,oakDoor,30.55,5.48,z);
  hearthPart(.69,.13,.67,bunkerCloth,30.55,5.60,z);
  hearthPart(.14,.88,.75,oakDoor,30.23,5.86,z);
  for(const x of [30.29,30.81])for(const dz of [-.26,.26])
    hearthPart(.10,.48,.10,oakDoor,x,5.24,z+dz);
}
hearthPart(.69,.14,.94,oakDoor,33.42,5.64,-59.62);
for(const x of [33.17,33.67])for(const z of [-59.97,-59.27])
  hearthPart(.09,.58,.09,oakDoor,x,5.29,z);
hearthPart(.29,.055,.38,bunkerLinen,33.35,5.74,-59.68);
hearthPart(.34,.03,.42,oakDoor,33.35,5.71,-59.68);
hearthPart(.11,.15,.11,bunkerAmber,33.62,5.79,-59.36);
// Small textile details and a dark mantel frame catch the firelight.
for(const z of [-59.82,-58.45]){
  hearthPart(.12,.51,.53,bunkerCloth,30.32,5.94,z);
  for(const side of [-1,1])
    hearthPart(.61,.09,.09,oakDoor,30.54,5.88,z+side*.32);
}
for(let stitch=0;stitch<24;stitch++){
  const x=30.51+stitch*.129;
  for(const z of [-60.21,-58.04])
    hearthPart(.057,.012,.12,bunkerLinen,x,5.022,z);
}
hearthPart(.95,.72,.10,oakDoor,32,7.48,-56.52);
hearthPart(.79,.55,.025,bunkerCloth,32,7.48,-56.585);
hearthPart(.24,.24,.035,bunkerAmber,32,7.48,-56.61).rotation.z=Math.PI/4;
// Low oak panelling and a wool hanging soften the stone chamber.
const hearthWool=new THREE.MeshLambertMaterial({color:'#59453b'});
const hearthThread=new THREE.MeshLambertMaterial({color:'#a18460'});
hearthPart(.09,1.10,4.12,oakDoor,33.94,5.55,-58.92);
hearthPart(.15,.10,4.18,oakDoor,33.90,6.11,-58.92);
for(const z of [-60.85,-59.87,-58.89,-57.91,-56.96])
  hearthPart(.047,.89,.07,oakDoor,33.88,5.56,z);
hearthPart(.045,1.58,1.55,hearthWool,33.94,7.45,-60.10);
hearthPart(.087,.071,1.78,oakDoor,33.90,8.27,-60.10);
for(const z of [-60.80,-59.40])
  hearthPart(.013,1.51,.045,hearthThread,33.912,7.45,z);
for(const y of [6.74,8.15])
  hearthPart(.013,.037,1.42,hearthThread,33.912,y,-60.10);
// Poker and shovel rest beside the firebox.
for(const x of [32.98,33.13]){
  const tool=hearthPart(.037,.81,.038,doorIron,x,5.56,-57.34);
  tool.rotation.z=-.17;
}
hearthPart(.13,.045,.16,doorIron,33.06,5.16,-57.32);
// Repeated woven diamonds pick up the firelight without another light source.
for(const z of [-59.68,-59.12,-58.56])for(const x of [31.55,32.45]){
  hearthPart(.25,.005,.25,hearthThread,x,5.031,z).rotation.y=Math.PI/4;
  hearthPart(.14,.005,.14,bunkerCloth,x,5.035,z).rotation.y=Math.PI/4;
}
for(const y of [7.15,7.38,7.61,7.84]){
  for(const z of [-60.30,-59.90])
    hearthPart(.018,.16,.16,hearthThread,33.909,y,z).rotation.x=Math.PI/4;
}
const hearthLight=new THREE.PointLight('#ffad72',0,8,2);
hearthLight.position.set(32,5.96,-57.06);
hearthRoom.add(hearthLight);
scene.add(hearthRoom);
function updateHearth(now){
  hearthRoom.visible=player.x>24&&player.x<38&&player.z>-68&&player.z<-51&&player.y>=4&&player.y<13;
  if(!hearthRoom.visible)return;
  hearthFlameMaterial.uniforms.time.value=now*.001;
  hearthLight.intensity=11+Math.sin(now*.008)*1.1+Math.sin(now*.019)*.6;
  for(let index=0;index<12;index++){
    const t=(now*(.00039+index*.000011)+index*.173)%1;
    emberPositions[index*3]=32+Math.sin(index*2.4+t*3)*(.41+t*.18);
    emberPositions[index*3+1]=5.45+t*1.07;
    emberPositions[index*3+2]=-56.68+Math.cos(index*3.2+t*4)*.14;
  }
  emberGeometry.attributes.position.needsUpdate=true;
  for(const {flame,height} of hearthFlames){
    const phase=now*.010+flame.position.x*9;
    flame.scale.set(1.18,height*(1+.15*Math.sin(phase)),1);
    flame.rotation.z=.12*Math.cos(phase*.83);
  }
}
const bunkerStairLights=[1,4,7].flatMap(step=>[17,21].map(x=>{
  const side=x===17?1:-1;
  const site=[x,5-step,-step,'netherBrick'];
  const torch=new THREE.Group();
  torch.position.set(x+.5+side*.5,site[1]+.22,site[2]+.5);
  part(torch,.10,.39,.23,doorIron,side*.015,0,0);
  for(const y of [-.135,.135])part(torch,.045,.045,.045,doorIron,side*.078,y,0);
  const brace=part(torch,.28,.045,.065,doorIron,side*.13,-.05,0);
  brace.rotation.z=side*.46;
  const handle=part(torch,.075,.34,.075,oakDoor,side*.14,.12,0);
  handle.rotation.z=-side*.45;
  const flame=new THREE.Mesh(flameGeometry,torchFlame);
  const core=new THREE.Mesh(flameGeometry,torchCore);
  core.scale.set(.56,.67,.56);
  core.position.y=-.045;
  flame.add(core);
  part(torch,.15,.10,.15,doorIron,side*.21,.23,0);
  flame.position.set(side*.21,.27,0);
  torch.add(flame);
  scene.add(torch);
  const light=new THREE.PointLight('#ffc085',0,6,2);
  light.position.copy(torch.position).add(new THREE.Vector3(side*.26,.36,0));
  scene.add(light);
  return {site,light,power:11,torch,flame};
}));
// Ribbed stone ceiling below the turf, above player height.
for(const z of [-12.5,-15.5,-18.5,-21.5]){
  for(let i=0;i<13;i++){
    const a=Math.PI*(i+.5)/13;
    const rib=bunkerProp(gateStone,19.5+5.1*Math.cos(a),-3.03+1.98*Math.sin(a),z,1.19,.27,.33);
    rib.rotation.z=Math.atan2(1.98*Math.cos(a),-5.1*Math.sin(a));
  }
}
// Ironwork, ladder and storage sit against the walls, clear of the stairs.
for(const z of [-21.62,-20.83])bunkerProp(oakDoor,15.91,-3.79,z,.11,2.3,.11);
for(let y=-4.67;y<=-2.84;y+=.28)bunkerProp(oakDoor,15.91,y,-21.225,.12,.09,.81);
for(const [x,z] of [[15.45,-12.12],[23.95,-22.1]]){
  bunkerProp(oakDoor,x,-4.66,z,.94,.65,.63);
  for(const dx of [-.27,.27])bunkerProp(doorIron,x+dx,-4.65,z+.32,.08,.64,.035);
}
for(const z of [-12.5,-17.5]){
  bunkerProp(doorIron,23,-1.71,z,.055,1.40,.055);
  bunkerProp(doorIron,23,-2.43,z,.36,.08,.36);
  bunkerProp(materialByType.lantern[0],23,-2.59,z,.24,.29,.24);
  bunkerProp(doorIron,23,-2.77,z,.33,.07,.33);
}
// Hearth and workshop fittings, kept along the room's edges.
for(const [z,width] of [[-14,.8],[-20,2.5]]){
  bunkerProp(oakDoor,24.87,-3.35,z,.14,1.05,width);
  for(let j=0;j<5;j++){
    const pegZ=z+(j-2)*width/6;
    bunkerProp(doorIron,24.73,-3.08,pegZ,.12,.07,.07);
    bunkerProp(oakDoor,24.66,-3.33,pegZ,.065,.48,.068);
    bunkerProp(doorIron,24.63,-3.13,pegZ,.11,.105,.16);
  }
}
for(const z of [-18.43,-15.57])bunkerProp(bunkerAmber,19,-4.955,z,3.4,.015,.075);
for(const x of [17.34,20.66])bunkerProp(bunkerAmber,x,-4.955,-17,.075,.015,2.9);
for(let i=0;i<7;i++){
  bunkerProp(bunkerAmber,17.7+i*.43,-4.954,-18.25,.12,.015,.14).rotation.y=Math.PI/4;
  bunkerProp(bunkerAmber,17.7+i*.43,-4.954,-15.75,.12,.015,.14).rotation.y=Math.PI/4;
}
// Recessed iron hinges at ground level and timber framing around the lower doorway.
for(const z of [-2.58,.58]){
  bunkerProp(doorIron,17.92,4.94,z,.25,.12,.34);
  part(hatchAssembly,.31,.075,.26,doorIron,.19,-.105,z+1);
}
for(const x of [18.1,20.9])
  bunkerProp(oakDoor,x,-3.53,-10.53,.19,2.94,.24);
bunkerProp(oakDoor,19.5,-1.97,-10.53,2.99,.22,.27);
for(const z of [-19.22,-19.62,-20.02]){
  bunkerProp(oakDoor,23.86,-3.88,z,.41,.11,.31);
  bunkerProp(doorIron,23.67,-3.8,z,.075,.10,.21);
}
// Furnish the wall recesses and existing surfaces without narrowing the aisle.
const barrelWood=oakDoor;
const barrelBody=new THREE.CylinderGeometry(.34,.30,.73,12);
const barrelHoop=new THREE.CylinderGeometry(.346,.346,.045,12,1,true);
for(const z of [-12.55,-13.38]){
  const barrel=new THREE.Mesh(barrelBody,barrelWood);
  barrel.position.set(14.66,-4.635,z);
  bunkerFurnishings.add(barrel);
  for(const [y,radius] of [[-.24,.92],[.24,.99]]){
    const hoop=new THREE.Mesh(barrelHoop,doorIron);
    hoop.position.set(14.66,-4.635+y,z);
    hoop.scale.set(radius,1,radius);
    bunkerFurnishings.add(hoop);
  }
  for(const offset of [-.12,.12])
    bunkerProp(doorIron,14.66+offset,-4.267,z,.018,.012,.57);
}
// A dressed stone fireplace surrounds the existing ember opening.
for(const z of [-14.44,-13.56])
  bunkerProp(gateStone,23.49,-4.57,z,.22,.83,.18);
bunkerProp(gateStone,23.94,-4.075,-14,1.24,.19,1.25);
bunkerProp(gateStone,23.35,-4.932,-14,.40,.13,1.25);
for(const z of [-14.29,-13.71])
  bunkerProp(doorIron,23.46,-4.48,z,.055,.34,.055);
bunkerProp(doorIron,23.46,-4.43,-14,.045,.048,.66);

// A reading lamp and a closed book sit beside the map on the oak table.
const bookCover=new THREE.MeshStandardMaterial({color:'#493b26',roughness:.89});
bunkerProp(bunkerLinen,18.36,-3.91,-17.28,.25,.055,.33);
for(const y of [-3.943,-3.878])
  bunkerProp(bookCover,18.36,y,-17.28,.28,.018,.36);
const lampZ=-16.64;
bunkerProp(doorIron,19.66,-3.90,lampZ,.21,.07,.21);
bunkerProp(materialByType.lantern[0],19.66,-3.77,lampZ,.13,.19,.13);
for(const dx of [-.082,.082])for(const dz of [-.082,.082])
  bunkerProp(doorIron,19.66+dx,-3.77,lampZ+dz,.019,.22,.019);
bunkerProp(doorIron,19.66,-3.65,lampZ,.21,.046,.21);
// Barrel hoops, sackcloth and a masonry winch give each room its own silhouette.
const sackMaterial=new THREE.MeshStandardMaterial({color:'#9a8260',roughness:1});
const sackShape=new THREE.SphereGeometry(.42,10,8);
for(const z of [-28,-29.1,-30.2,-31.3,-32.4,-33.5]){
  const barrel=new THREE.Mesh(barrelBody,oakDoor);
  barrel.position.set(12.8,-4.63,z);
  bunkerFurnishings.add(barrel);
  for(const y of [-4.82,-4.42]){
    const hoop=new THREE.Mesh(barrelHoop,doorIron);
    hoop.position.set(12.8,y,z);
    bunkerFurnishings.add(hoop);
  }
}
for(const x of [26.4,27.45])for(const z of [-28.6,-29.65,-30.7]){
  const sack=new THREE.Mesh(sackShape,sackMaterial);
  sack.scale.set(.92,.83,1.14);
  sack.position.set(x,-4.65,z);
  bunkerFurnishings.add(sack);
  bunkerProp(oakDoor,x,-4.30,z,.16,.07,.16);
}
for(const z of [-42.5,-44.1])bunkerProp(oakDoor,13.5,-3.93,z,.18,2.14,.18);
const spindle=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,1.9,12),oakDoor);
spindle.rotation.x=Math.PI/2;
spindle.position.set(13.5,-3.13,-43.3);
bunkerFurnishings.add(spindle);
bunkerProp(doorIron,13.5,-3.78,-43.3,.045,1.12,.045);
for(const z of [-40.5,-43.5,-46.5]){
  bunkerProp(oakDoor,27.8,-3.58,z,.43,.19,1.8);
  for(let j=0;j<6;j++){
    bunkerProp(j%2?bookCover:bunkerCloth,27.75,-3.28,z-.71+j*.28,.27,.41,.17);
  }
}
// Segmental arches spring from the masonry on both sides of the corridor.
const cellarStone=materialByType.netherTrim[0];
const cellarIron=doorIron;
for(const z of [-24.82,-26.5,-34.5,-36.5,-44.5,-47.5]){
  for(const x of [18.07,20.93]){
    bunkerProp(cellarStone,x,-3.48,z,.15,3.04,.52);
    bunkerProp(cellarStone,x,-2.02,z,.21,.15,.61);
  }
  for(let segment=0;segment<11;segment++){
    const t=Math.PI*(segment+.5)/11;
    const rib=bunkerProp(cellarStone,19.5+1.44*Math.cos(t),-2.02+.94*Math.sin(t),z,
      .44,.24,.47);
    rib.rotation.z=Math.atan2(.94*Math.cos(t),-1.44*Math.sin(t));
  }
}

// Stone drainage grate inset at the foot of the cistern rim.
bunkerProp(cellarIron,14.83,-4.984,-43.2,.43,.029,.56);
for(let bar=0;bar<5;bar++)
  bunkerProp(gateStone,14.83,-4.963,-43.42+bar*.11,.36,.012,.023);
bunkerProp(oakDoor,13.5,-3.13,-42.28,.11,.48,.09).rotation.z=.65;
bunkerProp(cellarIron,13.5,-4.27,-43.3,.22,.12,.22);

// Archive shelves have visible wall supports and a low reading desk.
for(const z of [-41.25,-39.75,-44.25,-42.75,-47.25,-45.75])
  bunkerProp(oakDoor,27.83,-3.77,z,.31,.41,.08);
bunkerProp(oakDoor,26.1,-4.04,-46,1.18,.15,.73);
for(const x of [25.64,26.56])for(const z of [-46.27,-45.73])
  bunkerProp(oakDoor,x,-4.55,z,.12,.9,.12);
bunkerProp(bunkerLinen,26.06,-3.95,-46.03,.53,.022,.42);
bunkerProp(bookCover,26.43,-3.91,-46.19,.23,.09,.22);

// Raised racks and iron-strapped grain chests sit against the back walls.
for(const z of [-32.5,-31.35,-30.2,-29.05,-27.9])
  bunkerProp(oakDoor,12.8,-4.95,z,1.02,.1,.10);
for(const x of [25.6,26.95]){
  bunkerProp(oakDoor,x,-4.68,-33.25,1.08,.63,.69);
  bunkerProp(oakDoor,x,-4.34,-33.25,1.14,.12,.75);
  for(const dx of [-.32,.32]){
    bunkerProp(cellarIron,x+dx,-4.63,-32.895,.052,.56,.037);
    bunkerProp(cellarIron,x+dx,-4.271,-33.25,.052,.022,.75);
  }
}
// Carved signs face the corridor at the four open room entrances.
for(const [x,z,name] of [
  [18,-29,'Fasslager'],[21,-29,'Vorratskammer'],
  [18,-41,'Zisterne'],[21,-41,'Archiv'],
]){
  const face=x===18?1:-1;
  const sign=new THREE.Group();
  sign.position.set(x+face*.04,-1.79,z);
  sign.rotation.y=face*Math.PI/2;
  part(sign,1.65,.33,.09,oakDoor,0,0,0);
  const canvas=document.createElement('canvas');
  canvas.width=384;
  canvas.height=80;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#eed6a6';
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  ctx.font='bold 46px Georgia, serif';
  ctx.fillText(name,192,40,346);
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  sign.add(new THREE.Mesh(new THREE.PlaneGeometry(1.59,.33),
    new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false})));
  sign.children[1].position.z=.047;
  for(const edge of [-.75,.75])part(sign,.055,.055,.028,doorIron,edge,0,.05);
  bunkerFurnishings.add(sign);
}

// Stone ribs tie each chamber's ceiling to the walls.
for(const x of [14,25])for(const z of [-33.3,-27.4,-46.7,-37.1]){
  for(let segment=0;segment<15;segment++){
    const angle=Math.PI*(segment+.5)/15;
    const rib=bunkerProp(gateStone,x+2.96*Math.cos(angle),
      -2.35+1.29*Math.sin(angle),z,.66,.23,.32);
    rib.rotation.z=Math.atan2(1.29*Math.cos(angle),-2.96*Math.sin(angle));
  }
  for(const side of [-1,1])
    bunkerProp(cellarStone,x+side*2.88,-2.34,z,.24,.22,.42);
}

// The supply chamber has a raised rack with glazed earthenware.
for(const y of [-4.28,-3.64]){
  bunkerProp(oakDoor,26.5,y,-27.05,2.4,.12,.57);
  for(const x of [25.48,27.52])bunkerProp(oakDoor,x,y-.16,-26.99,.08,.25,.43);
  for(let jar=0;jar<5;jar++){
    const radius=.11+(jar%3)*.026;
    const pot=new THREE.Mesh(new THREE.LatheGeometry([
      new THREE.Vector2(0,0),new THREE.Vector2(radius*.8,0),
      new THREE.Vector2(radius,.11),new THREE.Vector2(radius*.82,.21),
      new THREE.Vector2(radius*.54,.25),new THREE.Vector2(radius*.65,.28),
    ],10),bunkerAmber);
    pot.position.set(25.64+jar*.42,y+.06,-27.06);
    bunkerFurnishings.add(pot);
  }
}
// Barrel heads show plank seams and wooden bungs.
for(const z of [-28,-29.1,-30.2,-31.3,-32.4,-33.5]){
  for(const offset of [-.16,.16])
    bunkerProp(bookCover,12.8+offset,-4.264,z,.014,.009,.48);
  bunkerProp(oakDoor,12.8,-4.247,z,.10,.04,.10);
}
// Iron anchor and feed pipe above the cistern.
bunkerProp(doorIron,11.08,-2.67,-44.25,.16,.36,.37);
bunkerProp(doorIron,12.3,-2.66,-44.25,2.45,.13,.13);
bunkerProp(doorIron,13.48,-2.81,-44.25,.14,.40,.14);
for(const [x,z] of [[26.02,-45.93],[26.17,-46.04],[26.04,-46.15]])
  bunkerProp(bookCover,x,-3.933,z,.23,.006,.018);

// Batch the static box props by material. The hatch, signs and lights stay independent.
const cellarBoxes=new Map();
for(const mesh of bunkerFurnishings.children){
  if(!mesh.isMesh||mesh.geometry.type!=='BoxGeometry'||Array.isArray(mesh.material))continue;
  const boxes=cellarBoxes.get(mesh.material)||[];
  boxes.push(mesh);
  cellarBoxes.set(mesh.material,boxes);
}
const cellarBoxGeometry=new THREE.BoxGeometry(1,1,1);
const cellarTransform=new THREE.Object3D();
for(const [material,boxes] of cellarBoxes){
  const batch=new THREE.InstancedMesh(cellarBoxGeometry,material,boxes.length);
  boxes.forEach((mesh,index)=>{
    const {width,height,depth}=mesh.geometry.parameters;
    cellarTransform.position.copy(mesh.position);
    cellarTransform.quaternion.copy(mesh.quaternion);
    cellarTransform.scale.set(width,height,depth);
    cellarTransform.updateMatrix();
    batch.setMatrixAt(index,cellarTransform.matrix);
  });
  bunkerFurnishings.remove(...boxes);
  bunkerFurnishings.add(batch);
}
scene.add(bunkerFurnishings);

const towerProfiles=[[-29,-38,6,32],[29,-38,6,32],[-42,-68,6,36],
  [42,-68,6,36],[-24,-80,6,43],[24,-80,6,43],[0,-70,9,56]];
// A shared profile adds chamfered stringcourses to all four faces of each tower.
const corniceShape=new THREE.Shape();
corniceShape.moveTo(-.06,-.22);
corniceShape.lineTo(.13,-.15);
corniceShape.lineTo(.25,.05);
corniceShape.lineTo(.25,.19);
corniceShape.lineTo(-.06,.19);
corniceShape.closePath();
const corniceGeometry=new THREE.ExtrudeGeometry(corniceShape,{depth:1,bevelEnabled:false});
corniceGeometry.translate(0,0,-.5);
const copingGeometry=new THREE.CylinderGeometry(.64,.81,.22,4,1);
copingGeometry.rotateY(Math.PI/4);
const copingSites=[];
const courses=[];
for(const [cx,cz,r,top] of towerProfiles){
  for(let dx=-r;dx<=r;dx++)for(let dz=-r;dz<=r;dz++){
    if(Math.max(Math.abs(dx),Math.abs(dz))===r&&netherBlockAt(cx+dx,top+1,cz+dz)==='netherTrim')
      copingSites.push([cx+dx,top+1,cz+dz]);
  }
  for(let y=8;y<=top;y++){
    if(y!==top&&(y%8!==0||(cx===0&&y<24)))continue;
    for(let along=-r+1;along<r;along++)for(const side of [-1,1]){
      courses.push([cx+side*r,y,cz+along,side===1?0:Math.PI]);
      courses.push([cx+along,y,cz+side*r,side===1?-Math.PI/2:Math.PI/2]);
    }
  }
}
const cornices=new THREE.InstancedMesh(corniceGeometry,gateStone,courses.length);
cornices.count=0;
const courseTransform=new THREE.Object3D();
const copings=new THREE.InstancedMesh(copingGeometry,gateStone,copingSites.length);
copings.count=0;

function refreshCornices(){
  let count=0;
  for(const [x,y,z,angle] of courses){
    if(netherBlockAt(x,y,z)!=='netherTrim')continue;
    courseTransform.rotation.y=angle;
    courseTransform.position.set(x+.5+Math.cos(angle)*.5,y+.56,z+.5-Math.sin(angle)*.5);
    courseTransform.updateMatrix();
    cornices.setMatrixAt(count++,courseTransform.matrix);
  }
  cornices.count=count;
  cornices.instanceMatrix.needsUpdate=true;
  cornices.computeBoundingSphere();
  count=0;
  courseTransform.rotation.y=0;
  for(const [x,y,z] of copingSites){
    if(netherBlockAt(x,y,z)!=='netherTrim'||netherBlockAt(x,y+1,z))continue;
    courseTransform.position.set(x+.5,y+1.09,z+.5);
    courseTransform.updateMatrix();
    copings.setMatrixAt(count++,courseTransform.matrix);
  }
  copings.count=count;
  copings.instanceMatrix.needsUpdate=true;
  copings.computeBoundingSphere();
}

// Recessed tower windows: cut-stone sills and jambs follow their owning blocks.
const towerDressings=new THREE.Group();
const jambStone=materialByType.netherBrick[0];
for(const [cx,cz,r,top] of towerProfiles){
  const wallZ=cz+r;
  for(let y=10;y+3<top-3;y++){
    if(y%8!==2||netherBlockAt(cx,y+1,wallZ))continue;
    const sill=part(towerDressings,1.65,.20,.42,gateStone,cx+.5,y+.97,wallZ+1.14);
    sill.userData.site=[cx,y,wallZ];
    sill.userData.type=netherBlockAt(cx,y,wallZ);
    for(const side of [-1,1])for(let h=1;h<=3;h++){
      const x=cx+side,stone=part(towerDressings,.28,.99,.31,jambStone,cx+.5+side*.55,y+h+.5,wallZ+1.09);
      stone.userData.site=[x,y+h,wallZ];
      stone.userData.type=netherBlockAt(x,y+h,wallZ);
    }
  }
}


// Clustered grass uses one instanced draw call. Anchors follow terrain edits.
const meadowBlades=new THREE.BufferGeometry();
const bladeVertices=[];
for(let i=0;i<11;i++){
  const a=i*2.39996,r=.05+pixelHash(i,2,93)*.23;
  const x=Math.cos(a)*r,z=Math.sin(a)*r;
  const h=.16+pixelHash(i,5,13)*.28,w=.016+pixelHash(i,3,88)*.014;
  const dx=Math.cos(a)*w,dz=Math.sin(a)*w;
  bladeVertices.push(x-dz,0,z+dx,x+dz,0,z-dx,x*1.65,h,z*1.65);
}
meadowBlades.setAttribute('position',new THREE.Float32BufferAttribute(bladeVertices,3));
meadowBlades.computeVertexNormals();
const meadowTufts=new THREE.InstancedMesh(meadowBlades,new THREE.MeshLambertMaterial({
  color:'#ffffff',side:THREE.DoubleSide
}),3200);
const tuftTransform=new THREE.Object3D();
const tuftColor=new THREE.Color();
meadowTufts.count=0;
scene.add(meadowTufts);
let tuftRegion='';
function updateMeadowTufts(){
  meadowTufts.visible=isMeadow()&&graphicMode==='schoen';
  if(!meadowTufts.visible)return;
  const cx=Math.floor(player.x/8)*8,cz=Math.floor(player.z/8)*8;
  const region=key(cx,0,cz);
  if(region===tuftRegion)return;
  tuftRegion=region;
  let count=0;
  for(let x=cx-32;x<cx+32;x++)for(let z=cz-32;z<cz+32;z++){
    if(x< -HALF||x>=HALF||z< -HALF||z>=HALF||Math.hypot(x-cx,z-cz)>32)continue;
    if(pixelHash(x,z,91)>.35+.33*Math.sin(x*.29)*Math.cos(z*.23))continue;
    if(get(x,MEADOW_HEIGHT-1,z)!=='grass'||get(x,MEADOW_HEIGHT,z))continue;
    const scale=.52+pixelHash(x,z,40)*.88;
    tuftTransform.position.set(x+.23+.54*pixelHash(x,z,77),MEADOW_HEIGHT,z+.23+.54*pixelHash(x,z,78));
    tuftTransform.rotation.y=pixelHash(x,z,79)*Math.PI*2;
    tuftTransform.scale.set(scale,scale,scale);
    tuftTransform.updateMatrix();
    meadowTufts.setMatrixAt(count,tuftTransform.matrix);
    tuftColor.setHSL(.16+pixelHash(x,z,21)*.08,.23+pixelHash(x,z,22)*.24,.20+pixelHash(x,z,23)*.16);
    meadowTufts.setColorAt(count++,tuftColor);
  }
  meadowTufts.count=count;
  meadowTufts.instanceMatrix.needsUpdate=true;
  if(meadowTufts.instanceColor)meadowTufts.instanceColor.needsUpdate=true;
  meadowTufts.computeBoundingSphere();
}
let castleLightCell='';
const playerLightPosition=new THREE.Vector3();
function updateCastleLighting(){
  updateMeadowTufts();
  castleRidges.visible=isMeadow();
  wingWindowDetails.visible=isMeadow();
  gateMolding.visible=isMeadow();
  valleyTrees.visible=isMeadow();
  lanternFrames.visible=isMeadow();
  castleMist.visible=castleMoonlight()&&graphicMode==='schoen';
  if(castleMist.visible)for(const sheet of castleMist.children)
    sheet.rotation.y=Math.atan2(camera.position.x-sheet.position.x,camera.position.z-sheet.position.z);
  const cell=isMeadow()?Math.floor(player.x/2)+','+Math.floor(player.y/2)+','+Math.floor(player.z/2):'';
  if(cell===castleLightCell)return;
  castleLightCell=cell;
  refreshStairTreads();
  for(const window of wingWindowDetails.children)
    window.visible=netherBlockAt(...window.userData.site)==='glass';

  for(const {mesh,x,y,z,type} of hallAnchors)
    mesh.visible=Boolean(type)&&netherBlockAt(x,y,z)===type;
  for(const door of castleDoors.children)
    door.visible=Boolean(door.userData.type)&&netherBlockAt(...door.userData.site)===door.userData.type;
  if(isMeadow())for(const frame of lanternFrames.children){
    const [x,y,z,type]=frame.userData.site;
    frame.visible=netherBlockAt(x,y,z)===type;
    const wall=frame.userData.wall;
    if(wall)for(const bracket of frame.children.slice(-2))bracket.visible=!!netherBlockAt(...wall);
  }
  if(isMeadow())for(const stone of gateMolding.children)
    stone.visible=netherBlockAt(...stone.userData.site)===stone.userData.type;
  for(const stone of towerDressings.children)
    stone.visible=Boolean(stone.userData.type)&&netherBlockAt(...stone.userData.site)===stone.userData.type;
  const meadow=isMeadow();
  playerLightPosition.set(player.x,player.y+1,player.z);
  for(const {site:[x,y,z,type],light,power,torch} of [...fixedLanterns,...bunkerStairLights]){
    const mounted=meadow&&netherBlockAt(x,y,z)===type;
    const distance=light.position.distanceTo(playerLightPosition);
    light.visible=mounted&&distance<light.distance+5;
    light.intensity=light.visible?power:0;
    if(torch)torch.visible=mounted&&distance<22;
  }
  for(const {light,power,cellar} of bunkerRoomLights){
    const nearby=!cellar||(player.y<.5&&Math.hypot(player.x-light.position.x,player.z-light.position.z)<13);
    light.intensity=meadow&&nearby?power:0;
    light.visible=light.intensity>0&&light.position.distanceTo(playerLightPosition)<light.distance+5;
  }

  const nearbyEdits=meadow?[...edits.values()]
    .filter(([x,y,z,type])=>(type==='lantern'||type==='lavaGlow')&&!fixedLanternKeys.has(key(x,y,z)))
    .map(([x,y,z,type])=>({x,y,z,type,distance:Math.hypot(x+.5-player.x,y+.5-player.y,z+.5-player.z)}))
    .filter(({distance})=>distance<28).sort((a,b)=>a.distance-b.distance):[];
  editLanterns.forEach((light,i)=>{
    const source=nearbyEdits[i];
    light.visible=Boolean(source);
    light.intensity=source?30:0;
    if(source){
      light.position.set(source.x+.5,source.y+.52,source.z+.5);
      light.color.set(source.type==='lavaGlow'?'#ff943f':'#ffc284');
    }
  });
}

function updateNetherCreatures(dt,now){
  const active=isMeadow()&&showCreatures;
  const closeToFort=Math.hypot(player.x,player.z+55)<165;
  fortressAccentGroup.visible=isMeadow()&&closeToFort;
  for(const banner of fortressAccentGroup.children){
    const x=Math.floor(banner.position.x);
    banner.visible=netherBlockAt(x,12,-34)==='netherBrick';
  }
  updateCastleLighting();
  netherDragon.visible=active&&closeToFort;
  if(netherDragon.visible){
    const t=now*.001, a=t*.115;
    netherDragon.position.set(28*Math.cos(a),69+3*Math.sin(t*.67),-64+17*Math.sin(a));
    // Der Kopf ist entlang der negativen lokalen Z-Richtung ausgerichtet.
    const vx=-28*Math.sin(a),vz=17*Math.cos(a);
    netherDragon.rotation.set(Math.sin(t*.39)*.055,Math.atan2(-vx,-vz),Math.sin(t*.42)*.065);
    for(const {wing,side} of netherWings)
      wing.rotation.z=side*(.10+Math.sin(t*2.05)*.36);
    netherBreath.visible=graphicMode==='schoen';
    if(netherBreath.visible){
      for(let i=0;i<netherBreath.count;i++){
        const phase=(t*.66+i/netherBreath.count)%1,spin=i*2.399+t*1.1;
        netherBreathTransform.position.set(Math.sin(spin)*phase*.75,
          -.17+Math.cos(spin)*phase*.62,-5.6-phase*4.1);
        netherBreathTransform.rotation.set(phase*2,spin,phase*3);
        netherBreathTransform.scale.setScalar((1-phase)*(.6+(i%3)*.25));
        netherBreathTransform.updateMatrix();
        netherBreath.setMatrixAt(i,netherBreathTransform.matrix);
      }
      netherBreath.instanceMatrix.needsUpdate=true;
    }
  }
  for(const mob of netherCreatureList){
    const dist=Math.hypot(player.x-mob.x,player.z-mob.z);
    const visible=active&&dist<(MOBILE?43:60);
    mob.group.visible=visible;
    if(!visible)continue;
    const t=now*.001;
    const near=gameRunning&&dist<11&&Math.abs(player.y-mob.y)<4;
    const chase=near&&dist>3.0;
    const dx=player.x-mob.x,dz=player.z-mob.z;
    let angle=chase?Math.atan2(dz,dx):mob.bearing;
    if(!chase){
      const home=Math.hypot(mob.x-mob.homeX,mob.z-mob.homeZ);
      if(home>3.5)angle=Math.atan2(mob.homeZ-mob.z,mob.homeX-mob.x);
      else if(Math.sin(t*.34+mob.seed)>.75)angle+=Math.sin(t*.49+mob.seed)*.66;
    }
    const moving=chase||Math.sin(t*.73+mob.seed*1.77)>.28;
    if(moving){
      const pace=mob.speed*dt;
      const nx=mob.x+Math.cos(angle)*pace,nz=mob.z+Math.sin(angle)*pace;
      let newY=null;
      for(const h of [mob.y,mob.y+1,mob.y-1]){
        if(netherWalkable(nx,nz,h)){newY=h;break;}
      }
      if(newY!==null&&Math.hypot(nx-mob.homeX,nz-mob.homeZ)<(near?8:4.5)){
        mob.x=nx;mob.z=nz;mob.y=newY;mob.bearing=angle;
      }else mob.bearing+=.9*dt;
    }
    mob.group.position.set(mob.x,mob.y+Math.sin(t*3.1+mob.phase)*.023,mob.z);
    mob.group.rotation.y=-angle-Math.PI/2;
    if(mob.type==='zombie'){
      const sway=moving?Math.sin(t*4.0+mob.seed)*.26:0;
      mob.leftLeg.rotation.x=sway;mob.rightLeg.rotation.x=-sway;
      mob.arms[0].rotation.x=-.65+sway*.28;
      mob.arms[1].rotation.x=-.65-sway*.28;
    }else{
      const sway=moving?Math.sin(t*5+mob.seed)*.15:0;
      mob.arms.forEach((leg,i)=>leg.rotation.x=i%2?sway:-sway);
      // Die Creeper werden bei Nähe neugierig, aber explodieren nicht.
      mob.head.rotation.y=Math.sin(t*.85+mob.phase)*.08;
    }
  }
}

function hasLineOfSight(npc){
  const dx=npc.x-camera.position.x;
  const dy=npc.group.position.y+1.45-camera.position.y;
  const dz=npc.z-camera.position.z;
  const distance=Math.hypot(dx,dy,dz);
  if(distance>5.7||distance<.01)return false;
  // The last 0.24 blocks belong to the NPC, not a wall in front of it.
  return !traceVoxel(camera.position,{x:dx,y:dy,z:dz},distance-.24);
}
function updateCreatures(dt){
  if(isMeadow()){
    for(const npc of creatures)npc.group.visible=false;
    selectedNpc=null;selectedWorkshop=null;
    npcTargetBtn.classList.remove('visible');
    return;
  }
  const ms=performance.now();
  const t=ms*.001;
  const scanForSpeech=ms-lastNpcTargetCheck>125;
  if(scanForSpeech){selectedNpc=null;lastNpcTargetCheck=ms;}
  let best=.09;
  for(const npc of creatures){
    const dist=Math.hypot(npc.x-player.x,npc.z-player.z);
    const active=showCreatures&&dist<(MOBILE?46:65);
    npc.group.visible=active;
    if(!active)continue;
    if(npc.sunVillageRole&&!restoreSunnyResidentSpot(npc)){
      npc.group.visible=false;continue;
    }
    npc.turnTimer-=dt;
    if(npc.turnTimer<=0){
      npc.angle+=Math.sin(t*.45+npc.number*13)*2.2;
      npc.turnTimer=1.1+pixelHash(npc.number,Math.floor(t/2),83)*3.2;
    }
    const baseSpeed=npc.kind==='villager'?.48:npc.isAnimal?.25:.33;
    const courtesy=residentGiveWay(npc,player.x,player.z,gameRunning);
    // Besucher freundlich ansehen – bei sehr geringem Abstand jedoch Platz machen.
    const greeting=npc.kind==='villager'&&dist<3.9&&gameRunning&&!courtesy;
    const grazing=npc.isAnimal&&pixelHash(npc.number,Math.floor(t/9),306)>.69;
    let speed=baseSpeed;
    if(courtesy){
      const diff=Math.atan2(Math.sin(courtesy.angle-npc.angle),Math.cos(courtesy.angle-npc.angle));
      npc.angle+=diff*Math.min(1,dt*5);
      speed=courtesy.speed;
    }else if(greeting){
      const targetAngle=Math.atan2(player.z-npc.z,player.x-npc.x);
      const difference=Math.atan2(Math.sin(targetAngle-npc.angle),Math.cos(targetAngle-npc.angle));
      npc.angle+=difference*Math.min(1,dt*2.7);
      speed=0;
    }else if(grazing){speed=0;}
    // Nur tatsächlich freier Weg zählt als Bewegung. Verhindert die frühere
    // Laufanimation direkt vor einer Wand und das Ineinanderlaufen zweier NPCs.
    const wanderLimit=npc.sunVillageRole?(courtesy?3.25:2.2):npc.isAnimal?8:npc.kind==='villager'?8:7;
    let didMove=false;
    if(speed>0){
      const headings=courtesy?[npc.angle,npc.angle+.95,npc.angle-.95]:[npc.angle];
      for(const heading of headings){
        const nx=npc.x+Math.cos(heading)*speed*dt;
        const nz=npc.z+Math.sin(heading)*speed*dt;
        const nearHome=Math.hypot(nx-npc.homeX,nz-npc.homeZ)<wanderLimit;
        if(nearHome&&nx>-HALF+2&&nx<HALF-2&&nz>-HALF+2&&nz<HALF-2&&
           (!npc.sunVillageRole||(safeSunnyResidentSpot(nx,nz)&&residentHasSpace(npc,nx,nz)))&&
           !isInsideHouse(nx,nz)&&lakeDistance(nx,nz)>0&&canNpcEnter(nx,nz,npc.x,npc.z)){
          npc.x=nx;npc.z=nz;didMove=true;
          if(courtesy)npc.angle=heading;
          break;
        }
      }
      if(!didMove)npc.angle+=2.3*dt;
    }
    const ground=npcSurface(npc.x,npc.z);
    npc.group.position.set(npc.x,ground+(didMove?Math.sin(t*2.3+npc.number)*.025:0),npc.z);
    npc.group.rotation.y=-npc.angle-Math.PI/2;
    npc.walkTimer+=dt*(didMove?speed:0)*11;
    const sway=didMove?Math.sin(npc.walkTimer)*.27:0;
    npc.leftLeg.rotation.x=sway;npc.rightLeg.rotation.x=-sway;
    npc.leftArm.rotation.x=sway;npc.rightArm.rotation.x=npc.isAnimal?sway:sway*.65;
    if(npc.kind==='villager'){
      const wave=npc.waveUntil&&ms<npc.waveUntil;
      // Die fünf Berufe führen in ruhigen Momenten jeweils eine kleine Geste
      // aus. Die Handwerks-Requisite bewegt sich mit dem Unterarm.
      const working=npc.sunVillageRole&&!wave&&!greeting&&!courtesy&&!didMove;
      const beat=working?Math.sin(t*(1.1+npc.sunTradeIndex*.16)+npc.number):0;
      npc.rightArm.rotation.x+=working?-.13+beat*.22:0;
      npc.leftArm.rotation.x+=working?-.04-beat*.09:0;
      npc.rightArm.rotation.z=wave?.30+Math.sin(t*10+npc.number)*.33:greeting?.13:working?.07:0;
      npc.head.rotation.z=greeting?Math.sin(t*1.2+npc.number)*.035:0;
      npc.head.rotation.x=working?Math.sin(t*.95+npc.number)*.042:0;
    }else if(npc.isAnimal){
      npc.head.rotation.x=grazing?.18+Math.sin(t*1.7+npc.number)*.12:0;
    }
    npc.head.rotation.y=Math.sin(t*.8+npc.number)*.06;
    if(scanForSpeech&&dist<6){
      npcRay.set(npc.x,npc.group.position.y+1.45,npc.z).project(camera);
      const screenDist=Math.hypot(npcRay.x,npcRay.y);
      if(npcRay.z>=-1&&npcRay.z<=1&&screenDist<best&&hasLineOfSight(npc)){best=screenDist;selectedNpc=npc;}
    }
  }
  // A single contextual action button serves both residents and workshops.
  // Workshop detection is only four short proximity checks; no new raycaster.
  selectedWorkshop=gameRunning&&!selectedNpc?sunWorkshopAt(player):null;
  npcTargetBtn.classList.toggle('visible',gameRunning&&!!(selectedNpc||selectedWorkshop));
  npcTargetBtn.textContent=selectedNpc?.kind==='villager'?`👋 ${selectedNpc.role} ansprechen`:
    selectedNpc?.kind==='cow'?'🐮 Kuh streicheln':selectedNpc?.kind==='sheep'?'🐑 Schaf streicheln':
    selectedNpc?'🌿 Schleicher ansehen':selectedWorkshop?
      `${selectedWorkshop.emoji} ${selectedWorkshop.actions[workshopSteps.get(selectedWorkshop.id)||0]}`:'';
}
function isInsideHouse(x,z){
  for(const v of VILLAGES)for(const [ox,oz] of HOUSE_OFFSETS){
    if(Math.abs(x-(v.x+ox))<4.5&&Math.abs(z-(v.z+oz))<4.5)return true;
  }
  return false;
}
// A reusable 12-voxel particle burst gives tactile feedback without per-frame
// scene creation, extra image downloads, or additional UI clutter.
const workshopSparkleGeometry=new THREE.BoxGeometry(.12,.12,.12);
const workshopSparkleMaterial=new THREE.MeshBasicMaterial({color:'#ffe28e',transparent:true,opacity:.9,depthWrite:false});
const workshopSparkles=new THREE.InstancedMesh(workshopSparkleGeometry,workshopSparkleMaterial,12);
workshopSparkles.visible=false;workshopSparkles.frustumCulled=false;scene.add(workshopSparkles);
const sparkleTransform=new THREE.Object3D();
let sparkleStart=-10000,sparkleOrigin={x:0,y:0,z:0};
function startWorkshopSparkles(place){
  const i=SUN_WORKSHOPS.indexOf(place);
  const [ox,oz]=HOUSE_OFFSETS[i];
  sparkleOrigin={x:VILLAGES[0].x+ox-1.58,y:6.8,z:VILLAGES[0].z+oz-.12};
  sparkleStart=performance.now();workshopSparkles.visible=true;
}
function animateWorkshopSparkles(now){
  if(!workshopSparkles.visible)return;
  const age=(now-sparkleStart)/1000;
  if(age>=1.15){workshopSparkles.visible=false;return;}
  const fade=Math.max(0,1-age/1.15);
  workshopSparkleMaterial.opacity=fade*.89;
  for(let i=0;i<workshopSparkles.count;i++){
    const angle=i*Math.PI*2/workshopSparkles.count;
    sparkleTransform.position.set(sparkleOrigin.x+Math.cos(angle)*(.15+age*.66),
      sparkleOrigin.y+age*.96+Math.sin(i*7.7)*.20,
      sparkleOrigin.z+Math.sin(angle)*(.15+age*.66));
    sparkleTransform.rotation.set(age*2.7+i*.4,age*1.7+i*.35,0);
    sparkleTransform.scale.setScalar(Math.max(.02,fade));
    sparkleTransform.updateMatrix();workshopSparkles.setMatrixAt(i,sparkleTransform.matrix);
  }
  workshopSparkles.instanceMatrix.needsUpdate=true;
}
function useSunWorkshop(place){
  if(!gameRunning||sunWorkshopAt(player)!==place)return;
  const phase=workshopSteps.get(place.id)||0;
  toast(`${place.emoji} ${place.replies[phase]}`);
  startWorkshopSparkles(place);
  if(phase+1===place.actions.length){
    workshopSteps.set(place.id,0);
    if(!workshopProgress.has(place.id)){
      workshopProgress.add(place.id);saveSet(SUN_WORKSHOP_KEY,workshopProgress);updateBook();
      if(workshopProgress.size===SUN_WORKSHOPS.length)
        toast('✨ Alle vier Werkstätten entdeckt! Schau ins Entdeckerbuch.');
    }
  }else workshopSteps.set(place.id,phase+1);
}
npcTargetBtn.addEventListener('click',()=>{
  if(!gameRunning)return;
  if(selectedNpc){
    selectedNpc.waveUntil=performance.now()+1600;
    toast(selectedNpc.kind==='villager'?selectedNpc.dialogue:selectedNpc.kind==='cow'?'Muh! Die Kuh freut sich über deinen Besuch!':selectedNpc.kind==='sheep'?'Mäh! Das Schaf ist ganz freundlich.':'Der grüne Schleicher ist ganz friedlich!');
  }else if(selectedWorkshop)useSunWorkshop(selectedWorkshop);
});
function faceTowards(x,z){
  // V9 Kamera: look direction = (-sin(yaw), -cos(yaw)).
  const dx=x-player.x,dz=z-player.z;
  yaw=Math.atan2(-dx,-dz);pitch=-.08;
}
function teleportTo(x,z,label,targetX=x,targetZ=z){
  player.x=Math.max(-HALF+2,Math.min(HALF-2,x+.5));
  player.z=Math.max(-HALF+2,Math.min(HALF-2,z+.5));
  player.y=terrainHeight(Math.floor(player.x),Math.floor(player.z))+.14;
  player.vy=0;player.grounded=false;
  faceTowards(targetX,targetZ);updateWorldStream(true);updateCamera();updateCompass();
  toast(label);
}
function visitVillage(){
  const v=VILLAGES[0];
  // V19: Ankunft auf der OST-WEST-Straße. Von dort stehen die vier
  // Werkstätten links und rechts der Sichtachse statt hinter dem Spieler.
  teleportTo(v.x+13,v.z,'Willkommen im Sonnen-Dorf!',v.x-3,v.z);
}
$('villageBtn')?.addEventListener('click',visitVillage);
function castleMoonlight(){return isMeadow()&&lightMode===2;}
function applyLighting(){
  const options=[
    {sky:'#d4e8ee',sun:'#fff5e1',power:2.25,hemi:1.55,exposure:1.07,label:'☀ Tag · Hell'},
    {sky:'#dfae8c',sun:'#ffd09a',power:1.78,hemi:1.24,exposure:1.02,label:'🌅 Goldene Stunde'},
    {sky:'#1d3551',sun:'#9bb7df',power:.43,hemi:.85,exposure:1.02,label:'☾ Mondnacht'}
  ];
  const moonlit=castleMoonlight();
  const p=options[lightMode];
  const direction=[[-44,68,-28],[-73,21,-18],[38,53,-48]][lightMode];
  sunlight.position.set(...direction);
  scene.background.set(p.sky);
  netherFarMaterial.color.set(['#ffffff','#ffe2c7','#9bacc8'][lightMode]);
  scene.fog.color.set(lightMode===2?'#344e6a':lightMode===1?'#ddbba1':'#c1e0e6');
  rimLight.intensity=lightMode===2?.16:.31;
  // Day: barely visible. Dusk: amber windows. Night: lit, still voxel-like.
  sunWindowGlowMaterial.opacity=[.08,.36,.78][lightMode];
  sunWindowGlowMaterial.emissiveIntensity=[.08,.39,.85][lightMode];
  sunLampMaterial.emissiveIntensity=[.38,.85,1.15][lightMode];
  sunlight.color.set(p.sun);sunlight.intensity=p.power;
  ambientSky.color.set(moonlit?'#c7d8ff':lightMode===2?'#b0c7ef':'#fff2e7');
  ambientSky.groundColor.set(moonlit||lightMode===2?'#545a58':'#556c50');
  ambientSky.intensity=p.hemi;renderer.toneMappingExposure=p.exposure;
  skyDome.material.map=skyTextures[lightMode];
  skyDome.material.needsUpdate=true;
  sunSprite.visible=!moonlit&&lightMode!==2;moonSprite.visible=moonlit||lightMode===2;
  $('dayBtn').textContent='Himmel: '+p.label;
  applyView();
}
function applyView(){
  const fogFar=isMeadow()?(farView?245:178):(farView?(MOBILE?178:220):(MOBILE?114:145));
  scene.fog.near=castleMoonlight()?56:isMeadow()?(farView?127:81):(farView?76:51);scene.fog.far=lightMode===2?fogFar*.88:fogFar;
  camera.far=fogFar+20;camera.updateProjectionMatrix();
  $('viewBtn').textContent=farView?'🏔️ Sichtweite: Weit':'🌿 Sichtweite: Normal';
  $('viewBtn').setAttribute('aria-pressed',String(farView));
}
function applyGraphicMode(notify=false){
  const ratio=Math.min(window.devicePixelRatio||1, MOBILE?
    (graphicMode==='schoen'?1.05:.8):(graphicMode==='schoen'?1.65:1.25));
  renderer.setPixelRatio(ratio);
  resize();
  $('graphicsBtn').textContent=graphicMode==='schoen'?'✨ Grafik: Schön':'⚡ Grafik: Flüssig';
  $('graphicsBtn').setAttribute('aria-pressed',String(graphicMode==='schoen'));
  // On older phones optional cross-card vegetation can be skipped entirely.
  // The terrain and all gameplay remain identical in either mode.
  for(const meshes of decorativeMeshes.values())for(const mesh of meshes){
    if(mesh.userData.natureDetail)mesh.visible=graphicMode==='schoen';
  }
  if(notify&&isMeadow())updateWorldStream(true);
  if(notify)toast(graphicMode==='schoen'?'Schönere Grafik aktiviert':'Flüssigere Grafik aktiviert');
}
$('graphicsBtn').addEventListener('click',()=>{
  graphicMode=graphicMode==='schoen'?'flüssig':'schoen';
  try{localStorage.setItem(STORAGE_DETAIL,graphicMode);}catch(_){}
  applyGraphicMode(true);
});
$('viewBtn').addEventListener('click',()=>{
  farView=!farView;
  try{localStorage.setItem(STORAGE_VIEW,farView?'weit':'normal');}catch(_){}
  applyView();rebuildDistantLandscape(Math.floor(player.x/CHUNK),Math.floor(player.z/CHUNK));
  toast(farView?'Große Fernsicht aktiviert!':'Kürzere Sichtweite spart Leistung.');
});
$('dayBtn').addEventListener('click',()=>{
  lightMode=(lightMode+1)%3;
  try{localStorage.setItem(LIGHT_MODE_KEY,String(lightMode));}catch{}
  applyLighting();
  toast(lightMode===2?'Der Mond ist aufgegangen!':lightMode===1?'Die Sonne geht langsam unter!':'Ein neuer Tag beginnt!');
});
$('lookoutBtn')?.addEventListener('click',()=>{
  teleportTo(LOOKOUT.x+10,LOOKOUT.z+9,'Die Himmelswarte wartet auf dich!',LOOKOUT.x,LOOKOUT.z);
});
$('birchVillageBtn')?.addEventListener('click',()=>{
  const v=VILLAGES[1];
  teleportTo(v.x+2,v.z+14,'Willkommen im Birken-Dorf!',v.x,v.z);
});
$('waterfallBtn')?.addEventListener('click',()=>{
  teleportTo(FALL.x-10,FALL.z+7,'Entdecke den Kristallfall!',FALL.x,FALL.z);
});

$('ruinBtn')?.addEventListener('click',()=>{
  teleportTo(RUIN.x+2,RUIN.z+13,'Die Schattenruine ist ganz still …',RUIN.x,RUIN.z);
});
$('campBtn')?.addEventListener('click',()=>{
  teleportTo(CAMP.x,CAMP.z+9,'Willkommen am Waldlager!',CAMP.x,CAMP.z);
});
const discovered=new Set();
const collectedRelics=new Set();
const workshopProgress=new Set();
function loadSet(storageKey,valid){
  try{
    const input=JSON.parse(localStorage.getItem(storageKey)||'[]');
    if(Array.isArray(input))return input.filter(item=>valid.has(item));
  }catch(_){ /* Nicht gespeicherte Fortschritte sind unkritisch. */ }
  return [];
}
const knownIds=new Set(DISCOVERIES.map(item=>item.id));
const knownRelics=new Set(RELIC_PLACES.map(item=>item.id));
for(const id of loadSet(DISCOVERY_KEY,knownIds))discovered.add(id);
for(const id of loadSet(RELICS_KEY,knownRelics))collectedRelics.add(id);
for(const id of loadSet(SUN_WORKSHOP_KEY,new Set(SUN_WORKSHOPS.map(w=>w.id))))workshopProgress.add(id);
function saveSet(key,values){try{localStorage.setItem(key,JSON.stringify([...values]));}catch(_){}}
function updateBook(){
  $('discoveryCount').textContent=`${discovered.size}/${DISCOVERIES.length}`;
  $('relicCount').textContent=`✨ Geheimnisse: ${collectedRelics.size}/${RELIC_PLACES.length} gefunden`;
  $('workshopCount').textContent=`${workshopProgress.size}/${SUN_WORKSHOPS.length}`;
  const stamps=$('workshopList');stamps.replaceChildren();
  for(const place of SUN_WORKSHOPS){
    const done=workshopProgress.has(place.id);
    const item=document.createElement('div');item.className='workshop-stamp'+(done?' done':'');
    const badge=document.createElement('span');badge.textContent=done?'✓':place.emoji;
    const name=document.createElement('span');name.textContent=place.name;
    item.append(badge,name);stamps.appendChild(item);
  }
  const panel=$('discoveryList');
  panel.replaceChildren();
  for(const place of DISCOVERIES){
    const found=discovered.has(place.id);
    const item=document.createElement('div');item.className='discovery-item'+(found?' found':'');
    const icon=document.createElement('span');icon.className='discovery-emoji';icon.textContent=found?place.emoji:'🔒';
    const name=document.createElement('span');name.textContent=found?place.name:'Unentdeckter Ort';
    const badge=document.createElement('span');badge.className='discovery-status';badge.textContent=found?'Entdeckt':'Geheim';
    item.append(icon,name,badge);panel.appendChild(item);
  }
}
function updateDiscoveries(){
  if(isMeadow())return;
  let changed=false;
  for(const place of DISCOVERIES){
    if(!discovered.has(place.id)&&Math.hypot(player.x-place.x,player.z-place.z)<(place.id==='home'?11:15)){
      discovered.add(place.id);changed=true;
      toast(`Neuer Entdeckerort: ${place.name}!`);
    }
  }
  if(changed){saveSet(DISCOVERY_KEY,discovered);updateBook();}
  for(const relic of RELIC_PLACES){
    if(collectedRelics.has(relic.id))continue;
    if(Math.hypot(player.x-relic.x,player.z-relic.z)<2.3){
      collectedRelics.add(relic.id);saveSet(RELICS_KEY,collectedRelics);updateBook();
      rebuildDecoration(Math.floor(relic.x/CHUNK),Math.floor(relic.z/CHUNK));
      toast(`✨ Geheimnis gefunden: ${relic.name}!`);
    }
  }
}
// Minimal in-game discovery compass. Indicates the nearest unvisited landmark,
// or the nearest missing relic after all places have been visited.
const COMPASS_KEY='blockwelt-kompass-v11';
let compassEnabled=true;
try{compassEnabled=localStorage.getItem(COMPASS_KEY)!=='aus';}catch(_){}
const compassEl=$('compassGuide');
function setCompass(next){
  compassEnabled=!!next;
  compassEl.classList.toggle('hidden',!compassEnabled);
  $('compassBtn').textContent=compassEnabled?'🧭 Entdecker-Kompass: an':'○ Entdecker-Kompass: aus';
  $('compassBtn').setAttribute('aria-pressed',String(compassEnabled));
  try{localStorage.setItem(COMPASS_KEY,compassEnabled?'an':'aus');}catch(_){}
}
function updateCompass(){
  if(isMeadow()||!compassEnabled||!gameRunning)return;
  const nextPlaces=DISCOVERIES.filter(d=>!discovered.has(d.id));
  let candidates=nextPlaces;
  let clue='Neuer Ort';
  if(!candidates.length){
    candidates=RELIC_PLACES.filter(r=>!collectedRelics.has(r.id));
    clue='Geheimnis';
  }
  if(!candidates.length){
    $('compassText').textContent='Alle Geheimnisse gefunden!';
    $('compassArrow').style.transform='rotate(0rad)';return;
  }
  let nearest=null,distance=Infinity;
  for(const place of candidates){
    const d=Math.hypot(place.x-player.x,place.z-player.z);
    if(d<distance){distance=d;nearest=place;}
  }
  // Player forward = (-sin(yaw), -cos(yaw)). Screen-right = (+cos(yaw), -sin(yaw)).
  const dx=nearest.x-player.x,dz=nearest.z-player.z;
  const forward=-Math.sin(yaw)*dx-Math.cos(yaw)*dz;
  const right=Math.cos(yaw)*dx-Math.sin(yaw)*dz;
  const angle=Math.atan2(right,forward);
  $('compassArrow').style.transform=`rotate(${angle.toFixed(3)}rad)`;
  $('compassText').textContent=`${clue} · ${Math.round(distance)} Felder`;
}
$('compassBtn').addEventListener('click',()=>{setCompass(!compassEnabled);updateCompass();});
setCompass(compassEnabled);
$('discoveryBtn').addEventListener('click',()=>{
  updateBook();$('discoveryPanel').classList.remove('hidden');gameRunning=false;
});
$('closeDiscovery').addEventListener('click',()=>{
  $('discoveryPanel').classList.add('hidden');
  if($('overlay').classList.contains('hidden'))gameRunning=true;
});
updateBook();
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
  if(!gameRunning||stick.id!==null)return;e.preventDefault();e.stopPropagation();
  stick.id=e.pointerId;joystick.setPointerCapture(e.pointerId);moveStick(e);
});
joystick.addEventListener('pointermove',e=>{if(e.pointerId===stick.id)moveStick(e);});
function stopStick(e){if(e.pointerId!==stick.id)return;stick.id=null;stick.x=0;stick.y=0;centerStick();}
for(const event of ['pointerup','pointercancel','lostpointercapture'])joystick.addEventListener(event,stopStick);
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
renderer.domElement.addEventListener('pointerup',e=>{if(e.pointerId===lookId)lookId=null;});
// Mouse: drag to look, left click to mine, right click to place.
let mouseDown=null;
function resetControls(){
  keys.clear();
  stick.id=null;
  stick.x=stick.y=0;
  centerStick();
  lookId=null;
  mouseDown=null;
  jumpHeld=descendHeld=false;
}
window.addEventListener('blur',resetControls);
document.addEventListener('visibilitychange',()=>{if(document.hidden)resetControls();});
renderer.domElement.addEventListener('pointerdown',e=>{if(e.isPrimary)mouseDown={id:e.pointerId,x:e.clientX,y:e.clientY,button:e.button};});
renderer.domElement.addEventListener('pointerup',e=>{
  if(!mouseDown||mouseDown.id!==e.pointerId)return;
  if(Math.hypot(e.clientX-mouseDown.x,e.clientY-mouseDown.y)<6){
    if(e.pointerType==='mouse')modifyWorld(mouseDown.button===2);
  }
  mouseDown=null;
});
for(const event of ['pointercancel','lostpointercapture']){
  renderer.domElement.addEventListener(event,e=>{
    if(e.pointerId===lookId)lookId=null;
    if(mouseDown?.id===e.pointerId)mouseDown=null;
  });
}
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
function refreshNachtrabeMenu(){
  document.body.classList.add('meadow-mode');
  $('worldSubtitle').textContent='Schloss Nachtrabe · V113';
  regionName='';updateRegion();
}
$('fortressBtn').addEventListener('click',()=>{
  // Der Weg zur Festung bleibt bewusst frei: keine Teleportation in Mauern.
  teleportTo(0,-7,'Die Netherfestung wartet auf dich!',0,-45);
});
function openMenu(){$('discoveryPanel').classList.add('hidden');gameRunning=false;resetControls();$('overlay').classList.remove('hidden');$('dialogTitle').textContent='Deine Blockwelt';refreshNachtrabeMenu();}
$('menuBtn').addEventListener('click',openMenu);
$('homeBtn')?.addEventListener('click',()=>{respawn();updateCamera();toast('Zurück bei deiner Startwiese!');});
$('undoBtn').addEventListener('click',undo);
$('flightBtn').addEventListener('click',()=>setFlying(!flying));
$('exportBtn').addEventListener('click',exportWorld);
$('importBtn').addEventListener('click',()=>$('importFile').click());
$('importFile').addEventListener('change',async e=>{const f=e.target.files?.[0];e.target.value='';await importWorld(f);});
$('startBtn').addEventListener('click',()=>{
  $('discoveryPanel').classList.add('hidden');$('overlay').classList.add('hidden');gameRunning=true;toast('Viel Spaß beim Bauen!');
});
$('resetBtn').addEventListener('click',()=>{
  if(!confirm(`Soll Schloss Nachtrabe neu begonnen werden?`))return;
  try{localStorage.removeItem(currentSaveKey());}catch(e){console.warn(e);}
  edits.clear();undoStack.length=0;syncUndo();baseWorld();rebuild();respawn();updateCamera();toast('Nur diese Welt wurde zurückgesetzt!');
});

// Small location indicator: no map, no extra complex menus for young players.
const regions={schattenwald:'🌑 Schattenwald',dorf:'🏘️ Dorf',see:'🌊 See',wueste:'🏜️ Sandland',berge:'🏔️ Hochland',nadelwald:'🌲 Tannenwald',wiese:'🌿 Startwiese',wald:'🌲 Waldland',sand:'🏜️ Sandtal',fels:'⛰️ Felsenberg'};
let regionName='';
function updateRegion(){
  if(isMeadow()){
    const inside=player.z<NETHER_BOUNDS.maxZ+5&&player.z>NETHER_BOUNDS.minZ-6&&Math.abs(player.x)<79;
    let name=inside?'🏰 Schloss Nachtrabe':'🌿 Große Wiese';
    if(player.y<4.45&&player.x>=13&&player.x<26&&player.z>=-24&&player.z<1)name="🕯️ Bunker";
    if(player.x>=-39&&player.x<-16&&player.z>=-77&&player.z<=-61&&player.y<13){
      name='📜 Rabenarchiv';
    }else if(player.z>=-84&&player.z<-59&&Math.abs(player.x)<25){
      if(player.y>=56.8)name='🐉 Kronenturm';
      else if(player.y>=20.8)name='🏰 Hochterrasse';
      else if(player.x>16&&player.y<9)name='🕯️ Geheimgang';
      else if(Math.abs(player.x)<16)name='🏰 Große Halle';
    }else if(player.z>=-43&&player.z<=-35&&Math.abs(player.x)<12){
      name='🦇 Torhalle';
    }else if(player.z<-43&&player.z>=-59&&Math.abs(player.x)<29){
      name='🔥 Innenhof';
    }
    if(regionName!==name){regionName=name;$('regionLabel').textContent=name;}
    return;
  }
  let b=biomeAt(Math.floor(player.x),Math.floor(player.z));
  if(b==='fels'&&player.x>23&&player.z>=-11&&player.z<=-1&&player.y<11)b='hoehle';
  const name=Math.hypot(player.x-RUIN.x,player.z-RUIN.z)<17?'🗝️ Schattenruine':Math.hypot(player.x-CAMP.x,player.z-CAMP.z)<13?'⛺ Waldlager':Math.hypot(player.x-LOOKOUT.x,player.z-LOOKOUT.z)<14?'🏰 Himmelswarte':Math.hypot(player.x-FALL.x,player.z-FALL.z)<15?'💦 Kristallfall':b==='hoehle'?'🪨 Berghöhle':regions[b];
  if(name!==regionName){regionName=name;$('regionLabel').textContent=name;}
}
const cameraButton=$('cameraBtn');
function syncCameraButton(){
  cameraButton.textContent=thirdPerson?'Kamera · Von hinten':'Kamera · Ich-Sicht';
  cameraButton.setAttribute('aria-pressed',String(thirdPerson));
}
syncCameraButton();
cameraButton.addEventListener('click',()=>{
  thirdPerson=!thirdPerson;
  try{localStorage.setItem('blockwelt-kamera',thirdPerson?'hinten':'ego');}catch(_){}
  syncCameraButton();updateCamera();updateTarget();
});
function reloadStandardView(){
  const url=new URL(location.href);
  url.searchParams.set('ansicht',String(Date.now()));
  url.hash='';
  location.replace(url.href);
}
$('resetViewBtn').addEventListener('click',reloadStandardView);
const zoomRecovery=$('zoomRecovery');
zoomRecovery.addEventListener('click',reloadStandardView);
const viewport=window.visualViewport;
function positionZoomRecovery(){
  if(!viewport)return;
  zoomRecovery.hidden=viewport.scale<=1.015;
  if(!zoomRecovery.hidden){
    zoomRecovery.style.transform=
      `translate(${viewport.offsetLeft+12/viewport.scale}px,${viewport.offsetTop+12/viewport.scale}px) scale(${1/viewport.scale})`;
  }
}
viewport?.addEventListener('resize',positionZoomRecovery);
viewport?.addEventListener('scroll',positionZoomRecovery);
positionZoomRecovery();
function resize(){
  const w=window.innerWidth,h=window.innerHeight;
  camera.aspect=w/Math.max(1,h);camera.updateProjectionMatrix();renderer.setSize(w,h,false);
}
resize();
window.addEventListener('resize',resize);
window.addEventListener('orientationchange',()=>setTimeout(resize,180));
try {
  if(localStorage.getItem('blockwelt-nachtrabe-bereinigung-v62')!=='1'){
    localStorage.removeItem(MEADOW_KEY);
    localStorage.removeItem(ADVENTURE_KEY);
    localStorage.setItem('blockwelt-nachtrabe-bereinigung-v62','1');
  }
} catch(error) {
  console.warn('Blockwelt-Weltbereinigung fehlgeschlagen.',error);
}
baseWorld();loadEdits();rebuild();syncUndo();applyLighting();updateCamera();applyGraphicMode();refreshNachtrabeMenu();
try {
  localStorage.removeItem(ADVENTURE_KEY);
} catch(error) {
  console.warn('Der alte Abenteuerwelt-Spielstand konnte nicht gelöscht werden.',error);
}
$('loading').remove();
let lastTime=performance.now(),lastTarget=0,lastCompass=0;
function animate(now){
  requestAnimationFrame(animate);
  const dt=Math.min(.04,Math.max(0,(now-lastTime)/1000));lastTime=now;
  const oldX=player.x,oldZ=player.z;
  updateBunkerHatch(dt);
  updateWardrobe(dt);
  updateHearth(now);
  updateMovement(dt);animateGuardian(dt,Math.hypot(player.x-oldX,player.z-oldZ));updateCamera(dt);updateRegion();updateCreatures(dt);updateNetherCreatures(dt,now);
  animateWorkshopSparkles(now);
  for(const {flame,light,torch,power,site} of bunkerStairLights){
    if(!torch.visible||!light.visible)continue;
    const flicker=Math.sin(now*.009+site[2]+site[0])*.07+Math.sin(now*.021+site[2])*.04;
    flame.scale.y=1+flicker;
    flame.rotation.z=flicker*1.4;
    light.intensity=power*(1+flicker);
  }
  updateLeverDoors(dt);
  if(gameRunning&&Math.floor(now/350)!==Math.floor((now-dt*1000)/350))updateDiscoveries();
  skyDome.position.set(camera.position.x,camera.position.y,camera.position.z);
  const skyDiskPosition=lightMode===2?moonSprite.position:sunSprite.position;
  skyDiskPosition.copy(sunlight.position).setLength(75).add(camera.position);
  let near=0;if(!isMeadow())for(const v of VILLAGES)if(Math.hypot(player.x-v.x,player.z-v.z)<18){near=v;break;}
  const shadowRange=Math.hypot(player.x-RUIN.x,player.z-RUIN.z);
  const mystery=isMeadow()?0:Math.max(0,Math.min(1,(34-shadowRange)/22));
  const baseFog=castleMoonlight()?'#566982':lightMode===2?'#344e6a':lightMode===1?'#ddbba1':'#c1e0e6';
  scene.fog.color.set(baseFog).lerp(shadowFogColor,mystery*.4);
  villageGlow.intensity=near?(lightMode===2?1.8:.55):0;
  const inSunVillage=!isMeadow()&&Math.hypot(player.x-VILLAGES[0].x,player.z-VILLAGES[0].z)<25;
  // Masked per-house in one mesh: a custom facade suppresses only its own sign.
  updateSunVillageSignVisibility(inSunVillage);
  const sunNightPower=[.0,.46,1.05][lightMode];
  // One scene-wide pair only, switched off outside the village.
  for(const light of sunnyVillageLights){
    light.visible=inSunVillage&&sunNightPower>0;
    light.intensity=light.visible?sunNightPower:0;
  }
  shadowGlow.intensity=!isMeadow()&&shadowRange<22?(lightMode===2?1.0:.64):0;
  if(shadowGlow.intensity)shadowGlow.position.set(RUIN.x+.5,terrainHeight(RUIN.x,RUIN.z)+6,RUIN.z+.5);
  if(near)villageGlow.position.set(near.x+.5,terrainHeight(near.x,near.z)+3,near.z+.5);
  if(now-lastTarget>35){updateTarget();lastTarget=now;}
  if(now-lastCompass>350){updateCompass();lastCompass=now;}

  waterSurfaceMap.offset.x=Math.sin(now*.00015)*.065;
  waterSurfaceMap.offset.y=Math.cos(now*.00011)*.045;
  // Slow, restrained magic glow: 2 shared materials instead of per-object animation.
  const breath=Math.sin(now*.00165);
  fireflyViolet.opacity=.66+breath*.20;
  fireflyGold.opacity=.73+Math.sin(now*.0011)*.13;
  ruinGlowMaterial.opacity=.76+breath*.13;
  if(player.x>=30&&player.x<34&&player.y>=4.8&&player.y<13&&player.z>=-65&&player.z<-55){
    const otherLights=[];
    scene.traverseVisible(object=>{
      if(object.isLight&&object!==hearthLight)otherLights.push(object);
    });
    for(const light of otherLights)light.visible=false;
    try{renderer.render(scene,camera);}
    finally{for(const light of otherLights)light.visible=true;}
  }else renderer.render(scene,camera);
  if(perfEl){
    perfFrames++;
    if(now-perfTime>1000){
      perfEl.textContent=`FPS ${Math.round(perfFrames*1000/(now-perfTime))} · Chunks ${chunkMeshes.size} · Drawcalls ${renderer.info.render.calls} · Dreiecke ${renderer.info.render.triangles}`;
      perfFrames=0;perfTime=now;
    }
  }
}
requestAnimationFrame(animate);
