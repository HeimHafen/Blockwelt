export function buildCastleArchitecture({box,solid,deck,empty,routes,doors}){
  const stone='netherBrick', trim='netherTrim', slate='netherDeep';
  const opening=(xa,xb,ya,yb,za,zb)=>box(xa,xb,ya,yb,za,zb,null);
  const door=(xa,xb,ya,yb,za,zb)=>{
    opening(xa,xb,ya,yb,za,zb);
    doors.push([xa,xb,ya,yb,za,zb]);
  };
  deck(-38,37,4,-82,-35,'cobble');
  box(-38,-38,5,13,-82,-35,stone);
  box(37,37,5,13,-82,-35,stone);
  box(-38,37,5,13,-82,-82,stone);
  box(-38,37,5,12,-36,-35,stone);
  door(-3,3,5,10,-36,-35);
  for(let x=-38;x<=37;x+=3){
    solid(x,13,-35,trim);
    solid(x,14,-82,trim);
  }

  // A straight central walk and two perpendicular branches orient visitors.
  for(let z=-63;z<=-35;z++)deck(-2,2,4,z,z,trim);
  for(const z of [-70,-60,-50]){
    // The northern branch stays outside the hall footprint.
    if(z<-64){
      deck(-19,-18,4,z,z+1,trim);
      deck(18,19,4,z,z+1,trim);
    }else deck(-19,19,4,z,z+1,trim);
  }
  // Battered buttresses reinforce the curtain wall outside the approach.
  for(const x of [-33,-26,-19,19,26,33]){
    box(x-1,x+1,5,7,-34,-32,stone);
    box(x-1,x+1,8,10,-34,-33,stone);
    deck(x-1,x+1,11,-34,-34,trim);
  }
  // A paved border frames the courtyard while keeping every approach clear.
  for(const x of [-17,16])deck(x,x+1,4,-63,-43,trim);
  for(const z of [-63,-44])deck(-17,17,4,z,z,trim);
  for(const x of [-12,12])for(const z of [-58,-47]){
    deck(x-1,x+1,4,z-1,z+1,trim);
    solid(x,5,z,stone);
    solid(x,6,z,trim);
  }

  // Two gate chambers and an open central passage.
  for(const [a,b] of [[-12,-4],[4,12]]){
    box(a,b,5,15,-42,-34,stone);
    opening(a+1,b-1,5,11,-41,-35);
    door(a+3,a+5,5,8,-42,-42);
    for(let y=16;y<=20;y++){
      const inset=y-16;
      if(a+inset<=b-inset)deck(a+inset,b-inset,y,-42+inset,-34-inset,slate);
    }
  }

  deck(-3,3,4,-42,-35,'cobble');
  for(const x of [-3,3])deck(x,x,4,-42,-35,trim);
  deck(-3,3,12,-42,-37,stone);

  for(const x of towerWindows){
    box(x,x,10,12,-34,-34,null);
    box(x,x,10,12,-35,-35,'glass');
  }

  // Three wings enclose the courtyard. Each wing has three separate rooms.
  for(const [a,b,front,back,rooms] of [
    [-35,-19,-75,-44,[-70,-60,-50]],
    [19,34,-75,-44,[-70,-60,-50]],
  ]){
    for(const x of [a,b])box(x,x,5,12,front,back,stone);
    for(const z of [front,-65,-55,back])box(a,b,5,12,z,z,stone);
    const inner=a<0?b:a;
    // Interior doorways allow a straight walk down each wing.
    const passage=a<0?b-3:a+2;
    for(const z of [-65,-55])door(passage,passage+1,5,8,z,z);
    const outer=a<0?a:b;
    for(const z of rooms){
      box(outer,outer,8,10,z-1,z,'glass');
      box(outer,outer,7,7,z-2,z+1,trim);
      door(inner,inner,5,8,z,z+1);
      box(inner,inner,9,10,z-2,z-1,'glass');
      solid(inner,8,z-2,trim);
    }
    deck(a,b,13,front,back,trim);
    for(let y=14;y<=20;y++){
      const inset=y-14;
      for(const x of [a+inset,b-inset])deck(x,x,y,front,back,slate);
      for(const z of [front,back])deck(a+inset,b-inset,y,z,z,stone);
    }
    deck(a+7,b-7,21,front,back,slate);
  }

  // A false partition conceals a chamber in the east wing.
  box(29,29,5,12,-64,-56,stone);
  opening(29,29,5,7,-63,-62);
  box(34,34,8,10,-61,-60,stone);
  box(27,28,5,7,-64,-64,'planks');
  box(27,28,5,7,-61,-61,'planks');
  deck(27,28,8,-63,-62,'planks');
  deck(27,33,4,-63,-62,trim);
  deck(30,33,4,-64,-56,'planks');

  // Great hall and four rooms above it, with two mirrored return stairs.
  for(const x of [-17,17])box(x,x,5,18,-80,-64,stone);
  for(const z of [-80,-64])box(-17,17,5,18,z,z,stone);
  door(-3,3,5,10,-64,-64);
  for(const x of [-10,-6,6,10])box(x-1,x+1,8,11,-64,-64,'glass');
  deck(-16,16,16,-79,-65,trim);
  for(const [left,right] of stairwellBounds){
    const divider=left+3;
    for(const x of [left-1,right+1])box(x,x,5,20,-78,-68,stone);
    box(left,right,5,20,-78,-78,stone);
    opening(left,right,5,19,-77,-69);
    deck(left,right,20,-77,-68,stone);
    opening(left,right,5,19,-68,-68);
    // A full-height spine separates flights and closes the drop at the upper exit.
    box(divider,divider,5,19,-74,-68,stone);
    box(left,divider-1,8,19,-68,-68,stone);
    box(divider+1,right,5,19,-68,-68,stone);
    opening(divider+1,right,17,19,-68,-68);
    // Solid masonry under both flights keeps their backs closed from the hall.
    box(left,right,5,9,-77,-75,stone);
    deck(left,right,10,-77,-75,trim);
    for(let step=0;step<6;step++){
      box(left,divider-1,5,5+step,-69-step,-69-step,stone);
      box(divider+1,right,5,11+step,-75+step,-75+step,stone);
    }
    for(const z of [-77,-74,-71,-68]){
      deck(left,right,20,z,z,trim);
    }
    for(let lane=0;lane<3;lane++){
      routes.push([[left+lane,4,-68],...Array.from({length:6},(_,i)=>[left+lane,5+i,-69-i]),[left+lane,10,-75]]);
      routes.push([[right-lane,10,-76],...Array.from({length:6},(_,i)=>[right-lane,11+i,-75+i]),[right-lane,16,-68]]);
    }
    deck(left,right,16,-67,-65,trim);
    for(const x of [left-1,right+1])opening(x,x,5,8,-67,-66);
    for(const z of [-74,-71])box(left-1,left-1,13,14,z,z,'glass');
  }
  for(const x of [-7,0,7]){
    box(x,x,17,20,-79,-71,stone);
    door(x,x,17,19,-72,-71);
    if(x!==0){
      const landing=x+Math.sign(x);
      opening(landing,landing,17,19,-72,-67);
      deck(landing,landing,16,-72,-67,trim);
    }
  }
  for(let y=19;y<=31;y++){
    const span=17-(y-19);
    for(const x of [-span,span])deck(x,x,y,-81,-63,slate);
    for(const z of [-81,-63])deck(-span,span,y,z,z,stone);
  }
  deck(-4,4,32,-81,-63,slate);
  solid(0,24,-63,'glass');
  // Two rear towers flank the great hall and open directly onto the courtyard routes.
  for(const left of towerLeftEdges){
    const right=left+8, middle=left+4;
    for(const x of [left,right])box(x,x,5,38,-86,-75,stone);
    for(const z of [-86,-75])box(left,right,5,38,z,z,stone);
    deck(left,right,4,-86,-75,trim);
    opening(left+1,left+3,5,8,-75,-75);
    opening(left+1,left+3,5,7,-74,-74);
    deck(left+1,left+3,4,-74,-73,trim);
    box(middle,middle,5,38,-84,-77,stone);
    for(let flight=0;flight<4;flight++){
      const level=4+8*flight;
      const north=flight%2===0;
      const start=north?-76:-85, end=north?-85:-76, direction=north?-1:1;
      for(let lane=0;lane<3;lane++){
        const x=left+(north?1:5)+lane;
        routes.push([[x,level,start],...Array.from({length:8},(_,step)=>
          [x,level+step+1,start+direction*(step+1)]),[x,level+8,end]]);
      }
      deck(left+1,right-1,level+8,end,end,trim);
      // Carry the stone steps on a continuous stepped masonry beam.
      for(let step=1;step<=8;step++){
        const z=start+direction*step;
        const x=left+(north?1:5);
        deck(x,x+2,level+step-1,z,z,stone);
      }
      const nextEdge=north?left:right;
      for(let y=level+4;y<=level+5;y++)solid(nextEdge,y,start+direction*3,'glass');
    }
    // Leave the last flight open to the sky at its top; stone walls protect the stairwell.
    deck(left+1,middle,36,-85,-76,trim);
    deck(middle+1,right-1,36,-85,-81,trim);
    deck(left+1,right-1,36,-76,-76,trim);
    box(middle,middle,37,38,-80,-77,stone);
    box(middle+1,right-1,37,38,-81,-81,stone);
    // Corbel courses and capped corners give the parapet a continuous base.
    for(const x of [left-1,right+1])deck(x,x,36,-86,-75,trim);
    for(const z of [-87,-74])deck(left,right,36,z,z,trim);
    for(const x of [left,right])for(const z of [-86,-75])box(x,x,39,40,z,z,trim);
    for(const z of [-86,-75])deck(left,right,37,z,z,trim);
    for(const x of [left,right])deck(x,x,37,-86,-75,trim);
    for(const x of [left,right])for(let z=-86;z<=-75;z+=2)solid(x,39,z,trim);
    for(const z of [-86,-75])for(let x=left;x<=right;x+=2)solid(x,39,z,trim);
  }
  for(const [x,y,z,type] of interiorLampSites){
    solid(x,y,z,type);
  }
  for(const x of [-8,8])for(const z of [-60,-51,-32,-24,-16]){
    solid(x,5,z,slate);
    solid(x,6,z,'lantern');
  }
}

export const wingWindows=[-35,34].flatMap(x=>[-70,-60,-50].map(z=>[x,z]));

const towerLeftEdges=[-27,19];
const stairwellBounds=[[-15,-9],[9,15]];
const stairwellLamps=stairwellBounds.flatMap(([left,right])=>[
  [left-1,8,-70,'lantern',-1,0],
  [left-1,12,-77,'lantern',-1,0],
  [right+1,14,-73,'lantern',1,0],
  [right+1,18,-73,'lantern',1,0],
]);

export const interiorLampSites=[
  ...towerLeftEdges.flatMap(left=>[
    [left+2,8,-75,'lantern',0,1],
    [left+2,15,-86,'lantern',0,-1],
    [left+6,23,-75,'lantern',0,1],
    [left+2,31,-86,'lantern',0,-1],
  ]),
  ...stairwellLamps,
  ...[-3,3].flatMap(x=>[-41,-38].map(z=>[x,8,z,'lantern',Math.sign(x),0])),
  ...[-34,33].flatMap(x=>(x<0?[-67,-57,-47]:[-67,-47]).map(z=>[x,7,z,'lantern',x<0?-1:1,0])),
  ...[-10,0,10].map(x=>[x,8,-79,'lantern',0,-1])
];

// Stone surrounds and iron guides sit outside the clear opening.
export function dressDoorway({frame,door,part,stone,iron,width,height,depth}){
  for(const face of [-1,1]){
    const z=face*(depth/2+.07);
    for(const side of [-1,1]){
      const x=side*(width/2+.15);
      for(let y=0;y<height;y+=.5){
        part(frame,.3,.482,.22,stone,x,y+.25,z);
      }
      part(frame,.075,height,.08,iron,side*(width/2+.04),height/2,face*.16);
    }
    part(frame,width+.6,.29,.3,stone,0,height+.145,z);
    for(const y of [.22,.73]){
      part(door,width-.04,.15,.065,iron,0,height*y,face*.134);
      for(let x=.25;x<width;x+=.5)
        part(door,.07,.07,.045,iron,x-width/2,height*y,face*.17);
    }
  }
}

export const towerWindows=[-10,-7,7,10];

export const cellarLamps=[
  [19.5,-28.5],[19.5,-35.5],[19.5,-43.5],
  [15,-31],[24,-31],[15,-42],[24,-42],
];

export function buildLowerCellars({box,deck,solid}){
  const stone='netherBrick', trim='netherTrim', dark='netherDeep';
  // Thick foundations and a three-block central corridor behind the old room.
  box(10,28,-6,-1,-48,-24,stone);
  box(18,20,-5,-2,-47,-24,null);
  deck(18,20,-6,-47,-24,'cobble');
  for(const x of [18,20])deck(x,x,-6,-47,-24,trim);
  for(const [start,end] of [[-34,-26],[-47,-36]]){
    const doorway=start+Math.floor((end-start)/2);
    box(11,16,-5,-2,start,end,null);
    box(22,27,-5,-2,start,end,null);
    for(const x of [17,21]){
      box(x,x,-5,-3,doorway,doorway+1,null);
      box(x,x,-2,-2,doorway-1,doorway+2,trim);
      for(const z of [doorway-1,doorway+2])box(x,x,-5,-3,z,z,trim);
      deck(x,x,-6,doorway,doorway+1,trim);
    }
    for(const x of [11,27])deck(x,x,-6,start,end,dark);
    for(const z of [start,end]){
      deck(11,16,-6,z,z,trim);
      deck(22,27,-6,z,z,trim);
      deck(11,16,-1,z,z,trim);
      deck(22,27,-1,z,z,trim);
    }
  }
  for(const z of [-26,-34,-36,-44,-47]){
    deck(18,20,-1,z,z,trim);
    for(const x of [17,21])box(x,x,-5,-2,z,z,trim);
  }
  // Recessed cistern basin with a solid rim and circulation on all sides.
  deck(12,14,-6,-45,-41,'cobble');
  for(const z of [-45,-41])deck(12,14,-5,z,z,trim);
  for(const x of [12,14])deck(x,x,-5,-44,-42,trim);
  deck(13,13,-5,-44,-42,'water');
  // Raised stone platforms keep stored goods clear of cellar damp.
  deck(25,27,-6,-32,-28,trim);
  deck(26,27,-6,-46,-40,trim);
  solid(19,-4,-48,trim);
}
