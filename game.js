// BLOCKWELT V9 — grafischer Welt-Feinschliff, bessere Fernsicht, lebendigere Orte, Performanceprofil. V3–V8-Spielstände bleiben kompatibel.
// Keine Minecraft-Dateien oder Texturen; 3D-Technik: Three.js (MIT).
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.js';

const $ = (id) => document.getElementById(id);
const gameEl = $('game');
const BLOCK_TYPES = ['grass','dirt','stone','wood','leaves','sand','planks','bricks','cobble','glass','gold','water','path','snow','blossom','lantern'];
const LABELS = {grass:'Gras',dirt:'Erde',stone:'Stein',wood:'Holz',leaves:'Blätter',sand:'Sand',planks:'Bretter',bricks:'Ziegel',cobble:'Pflaster',glass:'Glas',gold:'Gold',water:'Wasser',path:'Weg',snow:'Schnee',blossom:'Blüten',lantern:'Laterne'};
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
const KEY = 'blockwelt-kleine-baumeister-v1';
const blocks = new Map();
const edits = new Map();
const chunkMeshes = new Map();
const decorativeMeshes = new Map();
const generatedChunks = new Set();
let lastStreamCenter = '';
const chunksPerSide = HALF / CHUNK;
let showCreatures = true;
let lightMode = 0; // 0: Morgensonne, 1: Goldene Stunde, 2: Nacht
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
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MOBILE ? (graphicMode==='schoen'?1.35:1.0) : (graphicMode==='schoen'?1.65:1.3)));
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
    lantern:['#f4b642','#ffdc72','#ffe7a1','#df8f2f','#ffd66a','#fff0b0']
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
  if(type==='bricks'){
    for(let y=0;y<64;y+=13){line('#e2b79b',0,y,64,3);
      const offset=(Math.floor(y/13)%2)*13;
      for(let x=offset;x<64;x+=26)line('#e2b79b',x,y+3,3,10);
    }
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
  if(type==='glass'){
    line('#e9ffff',4,5,4,46);line('#e9ffff',10,10,2,23);line('#4c9cbe',0,58,64,3);
  }
  const map=new THREE.CanvasTexture(canvas);
  map.colorSpace=THREE.SRGBColorSpace;map.magFilter=THREE.NearestFilter;
  map.minFilter=THREE.NearestMipmapNearestFilter;
  map.anisotropy=2;
  return map;
}
const materialByType={};
for(const type of BLOCK_TYPES){
  const side=new THREE.MeshLambertMaterial({map:texture(type,'side')});
  const top=new THREE.MeshLambertMaterial({map:texture(type,'top')});
  const bottom=new THREE.MeshLambertMaterial({map:texture(type,'bottom')});
  if(type==='lantern'){
    const mat=new THREE.MeshLambertMaterial({map:texture(type,'side'),emissive:'#ffae3c',emissiveIntensity:.42});
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
    const crossX=Math.abs(x-v.x),crossZ=Math.abs(z-v.z);
    // Straßennetz, Dorfplatz und breite Eingänge auf Höhe des Geländes.
    if((crossX<15&&crossZ<=1)||(crossZ<15&&crossX<=1)||(crossX<=2&&crossZ<=2)){
      const h=terrainHeight(x,z);
      if(y===h-1)chunkPut(x,y,z,'path');
    }
    for(let i=0;i<HOUSE_OFFSETS.length;i++){
      const [dx,dz]=HOUSE_OFFSETS[i],hx=v.x+dx,hz=v.z+dz;
      const rx=x-hx,rz=z-hz,ax=Math.abs(rx),az=Math.abs(rz);
      if(ax>5||az>5)continue;
      const floor=5;
      // Fundament und warmer Dielenboden.
      if(ax<=3&&az<=3&&y===floor)chunkPut(x,y,z,'planks');
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
        const roofY=floor+4+(4-ax);
        if(y===roofY)chunkPut(x,y,z,roofBlock);
        if(az===3&&ax<=2&&y>=floor+4&&y<roofY)chunkPut(x,y,z,'planks');
        if(az===4&&ax<=3&&y===floor+3)chunkPut(x,y,z,'wood');
        // Eaves project beyond the walls, but never close the front door.
        if(az===4&&ax<=4&&y===roofY)chunkPut(x,y,z,roofBlock);
        if(az===4&&ax===4&&y===floor+3)chunkPut(x,y,z,'wood');
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
      // Ein schmaler dekorativer Schornstein über dem Dachrand.
      if(i%2===0&&rx===2&&rz===-2&&y>=floor+6&&y<=floor+8)chunkPut(x,y,z,'cobble');
    }
    // Beleuchtete Wege und kleine Gartenbeete.
    if((crossX===5&&crossZ===5)||(crossX===13&&crossZ===3)){
      if(y>=5&&y<=6)chunkPut(x,y,z,'wood');
      if(y===7)chunkPut(x,y,z,'lantern');
    }
    // Dorfbrunnen bleibt unverändert benutzbar und interaktiv.
    if(crossX<=2&&crossZ<=2){
      if(y===5&&(crossX===2||crossZ===2))chunkPut(x,y,z,'cobble');
      if(y===5&&crossX<2&&crossZ<2)chunkPut(x,y,z,'water');
      if(y>=6&&y<=8&&crossX===2&&crossZ===2)chunkPut(x,y,z,'wood');
      if(y===9&&crossX<=2&&crossZ<=2)chunkPut(x,y,z,'planks');
    }
  }
}
const LOOKOUT={x:77,z:58,name:'Himmelswarte'};
const FALL={x:75,z:-45,name:'Kristallfall'};
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
      for(let y=3;y<=15;y++)villageBlocks(x,z,y,put);
    }
  }
  // Two adventure landmarks outside the original V3 64×64 region.
  addAdventureLandmarks(xmin,xmax,zmin,zmax);
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
  for(const mesh of decorativeMeshes.get(id)||[]){scene.remove(mesh);mesh.dispose();}
  decorativeMeshes.delete(id);
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
    if(x<-chunksPerSide||x>=chunksPerSide||z<-chunksPerSide||z>=chunksPerSide)continue;
    generateChunkData(x,z);
  }
  for(let dx=-STREAM_RADIUS;dx<=STREAM_RADIUS;dx++)for(let dz=-STREAM_RADIUS;dz<=STREAM_RADIUS;dz++){
    const x=cx+dx,z=cz+dz;
    if(x<-chunksPerSide||x>=chunksPerSide||z<-chunksPerSide||z>=chunksPerSide)continue;
    const key=chunkKey(x,z);desired.add(key);
    if(!chunkMeshes.has(key))rebuildChunk(x,z);
  }
  for(const id of [...chunkMeshes.keys()])if(!desired.has(id))disposeChunkMesh(id);
  for(const id of [...generatedChunks]){
    const [x,z]=id.split(',').map(Number);
    if(Math.max(Math.abs(cx-x),Math.abs(cz-z))>STREAM_RADIUS+1)unloadChunkData(x,z);
  }
  // Vereinfachte Berg-, Wald- und See-Silhouetten weit hinter den echten Baublöcken.
  rebuildDistantLandscape(cx,cz);
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
    return lakeDistance(x,z)<0&&h<=WATER_LEVEL ? WATER_LEVEL+.07 : h-.035;
  };
  for(let ox=-ring;ox<=ring;ox++)for(let oz=-ring;oz<=ring;oz++){
    if(Math.max(Math.abs(ox),Math.abs(oz))<=STREAM_RADIUS)continue;
    const ccx=cx+ox,ccz=cz+oz;
    if(ccx<-chunksPerSide||ccx>=chunksPerSide||ccz<-chunksPerSide||ccz>=chunksPerSide)continue;
    const xmin=ccx*CHUNK,zmin=ccz*CHUNK;
    for(let x=xmin;x<xmin+CHUNK;x+=step)for(let z=zmin;z<zmin+CHUNK;z+=step){
      const midX=x+1,midZ=z+1;
      const h=terrainHeight(midX,midZ),biome=biomeAt(midX,midZ);
      const water=lakeDistance(midX,midZ)<0&&h<=WATER_LEVEL;
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
      if(generatedTreeAt(ax,az)&&trees.length<320)trees.push([ax,terrainHeight(ax,az),az]);
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
  const waterFaces={top:[],left:[],right:[],front:[],back:[]};
  for(let x=cx*CHUNK;x<(cx+1)*CHUNK;x++)for(let z=cz*CHUNK;z<(cz+1)*CHUNK;z++){
    for(let y=0;y<=MAX_Y+8;y++){
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
      }else if(visible(x,y,z))byType[type].push([x,y,z]);
    }
  }
  const chunk=[];
  function addInstanced(type,positions){
    if(!positions.length)return;
    const mesh=new THREE.InstancedMesh(blockGeo,materialByType[type],positions.length);
    mesh.userData.positions=positions;
    for(let i=0;i<positions.length;i++){
      const [x,y,z]=positions[i];
      dummy.position.set(x+.5,y+.5,z+.5);
      dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);dummy.updateMatrix();
      mesh.setMatrixAt(i,dummy.matrix);
      const variation=.92+pixelHash(x,z,y+811)*.14;
      const shade=get(x,y+1,z)?variation*.93:variation;
      mesh.setColorAt(i,new THREE.Color().setRGB(shade,shade,shade));
    }
    mesh.instanceColor.needsUpdate=true;
    if(type==='glass')mesh.renderOrder=2;
    mesh.instanceMatrix.needsUpdate=true;
    mesh.computeBoundingSphere();scene.add(mesh);chunk.push(mesh);
  }
  for(const type of BLOCK_TYPES)if(type!=='water')addInstanced(type,byType[type]);
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
const sparkleMaterial=new THREE.MeshBasicMaterial({color:'#e1fbff',transparent:true,opacity:.48,depthWrite:false,side:THREE.DoubleSide});
const sparkleGeometry=new THREE.PlaneGeometry(.64,.09);
function farmPatch(x,z){
  return VILLAGES.some(v=>x>=v.x+12&&x<=v.x+17&&z>=v.z-6&&z<=v.z-1);
}
function rebuildDecoration(cx,cz){
  const id=chunkKey(cx,cz);
  for(const mesh of decorativeMeshes.get(id)||[]){scene.remove(mesh);mesh.dispose();}
  const stems=[],blooms=[],tufts=[],crops=[],fencePosts=[],fenceRails=[];
  const trimBlocks=[],shutters=[],flowerBoxes=[],roofBands=[],sparkles=[];
  for(let x=cx*CHUNK;x<(cx+1)*CHUNK;x++)for(let z=cz*CHUNK;z<(cz+1)*CHUNK;z++){
    const h=terrainHeight(x,z);
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
    mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();scene.add(mesh);meshes.push(mesh);
  }
  addTrim(trimBlocks,trimMaterial);addTrim(shutters,shutterMaterial);
  addTrim(flowerBoxes,flowerBoxMaterial);addTrim(roofBands,roofAccentMaterial);
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

// Procedural three-tone sky: a single inexpensive sphere, no remote image assets.
function skyGradient(high,mid,low){
  const c=document.createElement('canvas');c.width=16;c.height=256;
  const ctx=c.getContext('2d'),g=ctx.createLinearGradient(0,0,0,256);
  g.addColorStop(0,high);g.addColorStop(.56,mid);g.addColorStop(1,low);
  ctx.fillStyle=g;ctx.fillRect(0,0,16,256);
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
  tex.magFilter=THREE.LinearFilter;return tex;
}
const skyTextures=[
  skyGradient('#65aff0','#b6ddf5','#e5f5e6'),
  skyGradient('#627bad','#f3bd96','#ffe0ab'),
  skyGradient('#091e42','#344a6a','#65758d')
];
const skyDome=new THREE.Mesh(
  new THREE.SphereGeometry(80,24,12),
  new THREE.MeshBasicMaterial({map:skyTextures[0],side:THREE.BackSide,depthWrite:false,fog:false})
);
skyDome.frustumCulled=false;skyDome.renderOrder=-1000;scene.add(skyDome);

// Warm sun and moon are lightweight, unlit sprites rather than expensive post-processing.
function skyDisk(day){
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
  const c=canvas.getContext('2d');const g=c.createRadialGradient(64,64,8,64,64,64);
  g.addColorStop(0,day?'#fff9cd':'#f6f9ff');
  g.addColorStop(.25,day?'#ffe6a0':'#d4e2ff');
  g.addColorStop(.54,day?'#ffdb8b88':'#a3b6e355');
  g.addColorStop(1,'#ffffff00');
  c.fillStyle=g;c.fillRect(0,0,128,128);
  const t=new THREE.CanvasTexture(canvas);
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthWrite:false,depthTest:true,transparent:true,fog:false}));
  sprite.scale.set(day?19:12,day?19:12,1);sprite.renderOrder=-4;scene.add(sprite);return sprite;
}
const sunSprite=skyDisk(true),moonSprite=skyDisk(false);
moonSprite.visible=false;
const villageGlow=new THREE.PointLight('#ffc375',0,14,2);
scene.add(villageGlow);
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
  const data={format:'blockwelt',version:7,savedAt:new Date().toISOString(),edits:[...edits.values()]};
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
    if(data?.format!=='blockwelt'||![2,3,5,6,7].includes(data.version)||!Array.isArray(data.edits)||data.edits.length>20000)throw new Error('format');
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
    // Kleine freundliche Mundlinie und helle Wangen für lesbarere Gesichter.
    part(group,.22,.035,.035,npcDark,0,1.56,-.339);
    part(group,.09,.07,.02,new THREE.MeshLambertMaterial({color:'#d89588'}),-.29,1.60,-.333);
    part(group,.09,.07,.02,new THREE.MeshLambertMaterial({color:'#d89588'}),.29,1.60,-.333);
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
    const speed=npc.kind==='villager'?.48:npc.isAnimal?.25:.33;
    const nx=npc.x+Math.cos(npc.angle)*speed*dt;
    const nz=npc.z+Math.sin(npc.angle)*speed*dt;
    const wanderLimit=npc.isAnimal?8:npc.kind==='villager'?8:7;
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
    npc.leftArm.rotation.x=npc.isAnimal?-sway:-sway*.65;npc.rightArm.rotation.x=npc.isAnimal?sway:sway*.65;
    npc.head.rotation.y=Math.sin(t*.8+npc.number)*.06;
    if(dist<6){
      npcRay.set(npc.x,npc.group.position.y+1.45,npc.z).project(camera);
      const screenDist=Math.hypot(npcRay.x,npcRay.y);
      if(npcRay.z>=-1&&npcRay.z<=1&&screenDist<best){best=screenDist;selectedNpc=npc;}
    }
  }
  npcTargetBtn.classList.toggle('visible',!!selectedNpc&&gameRunning);
  npcTargetBtn.textContent=selectedNpc?.kind==='villager'?'👋 Hallo sagen':selectedNpc?.kind==='cow'?'🐮 Kuh streicheln':selectedNpc?.kind==='sheep'?'🐑 Schaf streicheln':'🌿 Schleicher ansehen';
}
function isInsideHouse(x,z){
  for(const v of VILLAGES)for(const [ox,oz] of HOUSE_OFFSETS){
    if(Math.abs(x-(v.x+ox))<4.5&&Math.abs(z-(v.z+oz))<4.5)return true;
  }
  return false;
}
npcTargetBtn.addEventListener('click',()=>{
  if(!gameRunning||!selectedNpc)return;
  toast(selectedNpc.kind==='villager'?'Hallo! Schön, dass du unser Dorf besuchst!':selectedNpc.kind==='cow'?'Muh! Die Kuh freut sich über deinen Besuch!':selectedNpc.kind==='sheep'?'Mäh! Das Schaf ist ganz freundlich.':'Der grüne Schleicher ist ganz friedlich!');
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
  $('mobsBtn').textContent=showCreatures?'✓ Tiere und Bewohner: an':'○ Tiere und Bewohner: aus';
  toast(showCreatures?'Die Welt ist lebendig!':'Die Figuren machen eine Pause.');
});
function applyLighting(){
  const options=[
    {sky:'#8cc9f0',sun:'#fff2cb',power:1.80,hemi:1.46,exposure:1.02,label:'☀ Morgensonne'},
    {sky:'#dfae8c',sun:'#ffd09a',power:1.78,hemi:1.24,exposure:1.02,label:'🌅 Goldene Stunde'},
    {sky:'#1d3551',sun:'#9bb7df',power:.43,hemi:.85,exposure:1.02,label:'☾ Sternennacht'}
  ];
  const p=options[lightMode];scene.background.set(p.sky);
  scene.fog.color.set(lightMode===2?'#344e6a':lightMode===1?'#ddbba1':'#c1e0e6');
  rimLight.intensity=lightMode===2?.16:.31;
  sunlight.color.set(p.sun);sunlight.intensity=p.power;
  ambientSky.intensity=p.hemi;renderer.toneMappingExposure=p.exposure;
  skyDome.material.map=skyTextures[lightMode];
  skyDome.material.needsUpdate=true;
  sunSprite.visible=lightMode!==2;moonSprite.visible=lightMode===2;
  $('nightStars').classList.toggle('visible',lightMode===2);
  $('dayBtn').textContent=p.label;
  applyView();
}
function applyView(){
  const fogFar=farView?(MOBILE?178:220):(MOBILE?114:145);
  scene.fog.near=farView?76:51;scene.fog.far=lightMode===2?fogFar*.83:fogFar;
  camera.far=fogFar+20;camera.updateProjectionMatrix();
  $('viewBtn').textContent=farView?'🏔️ Sichtweite: Weit':'🌿 Sichtweite: Normal';
  $('viewBtn').setAttribute('aria-pressed',String(farView));
}
function applyGraphicMode(notify=false){
  const ratio=Math.min(window.devicePixelRatio||1, MOBILE?
    (graphicMode==='schoen'?1.35:1.0):(graphicMode==='schoen'?1.65:1.25));
  renderer.setPixelRatio(ratio);
  resize();
  $('graphicsBtn').textContent=graphicMode==='schoen'?'✨ Grafik: Schön':'⚡ Grafik: Flüssig';
  $('graphicsBtn').setAttribute('aria-pressed',String(graphicMode==='schoen'));
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
  lightMode=(lightMode+1)%3;applyLighting();
  toast(lightMode===2?'Die Sterne funkeln!':lightMode===1?'Die Sonne geht langsam unter!':'Ein neuer Tag beginnt!');
});
$('lookoutBtn').addEventListener('click',()=>{
  player.x=LOOKOUT.x+7.5;player.z=LOOKOUT.z+7.5;
  player.y=terrainHeight(Math.floor(player.x),Math.floor(player.z))+.12;
  player.vy=0;player.grounded=false;
  yaw=Math.PI/4;pitch=-.12;updateWorldStream(true);updateCamera();
  toast('Die Himmelswarte wartet auf dich!');
});
$('birchVillageBtn').addEventListener('click',()=>{
  const v=VILLAGES[1];
  player.x=v.x+5.5;player.z=v.z+.5;
  player.y=terrainHeight(Math.floor(player.x),Math.floor(player.z))+.12;
  player.vy=0;player.grounded=false;yaw=Math.PI/2;pitch=-.1;
  updateWorldStream(true);updateCamera();
  toast('Willkommen im Birken-Dorf!');
});
$('waterfallBtn').addEventListener('click',()=>{
  player.x=FALL.x-8.5;player.z=FALL.z+5.5;
  player.y=terrainHeight(Math.floor(player.x),Math.floor(player.z))+.12;
  player.vy=0;player.grounded=false;yaw=-1.01;pitch=-.10;
  updateWorldStream(true);updateCamera();
  toast('Entdecke den Kristallfall!');
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
  const name=Math.hypot(player.x-LOOKOUT.x,player.z-LOOKOUT.z)<14?'🏰 Himmelswarte':Math.hypot(player.x-FALL.x,player.z-FALL.z)<15?'💦 Kristallfall':b==='hoehle'?'🪨 Berghöhle':regions[b];
  if(name!==regionName){regionName=name;$('regionLabel').textContent=name;}
}
function resize(){
  const w=window.innerWidth,h=window.innerHeight;
  camera.aspect=w/Math.max(1,h);camera.updateProjectionMatrix();renderer.setSize(w,h,false);
}
window.addEventListener('resize',resize);
window.addEventListener('orientationchange',()=>setTimeout(resize,180));
baseWorld();loadEdits();rebuild();syncUndo();applyLighting();updateCamera();applyGraphicMode();
$('loading').remove();
let lastTime=performance.now(),lastTarget=0;
function animate(now){
  requestAnimationFrame(animate);
  const dt=Math.min(.04,Math.max(0,(now-lastTime)/1000));lastTime=now;
  updateMovement(dt);updateCamera();updateRegion();updateCreatures(dt);
  skyDome.position.set(camera.position.x,camera.position.y,camera.position.z);
  sunSprite.position.set(player.x-39,player.y+51,player.z-55);
  moonSprite.position.set(player.x+38,player.y+53,player.z-48);
  let near=0;for(const v of VILLAGES)if(Math.hypot(player.x-v.x,player.z-v.z)<18){near=v;break;}
  villageGlow.intensity=near?(lightMode===2?1.8:.55):0;
  if(near)villageGlow.position.set(near.x+.5,terrainHeight(near.x,near.z)+3,near.z+.5);
  if(now-lastTarget>35){updateTarget();lastTarget=now;}
  clouds.position.set(player.x*.66+Math.sin(now*.00007)*2,0,player.z*.66);
  waterSurfaceMap.offset.x=Math.sin(now*.00015)*.065;
  waterSurfaceMap.offset.y=Math.cos(now*.00011)*.045;
  renderer.render(scene,camera);
}
requestAnimationFrame(animate);
