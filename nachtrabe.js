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

  // Great hall and four rooms above it, with two mirrored return stairs.
  for(const x of [-17,17])box(x,x,5,18,-80,-64,stone);
  for(const z of [-80,-64])box(-17,17,5,18,z,z,stone);
  door(-3,3,5,10,-64,-64);
  for(const x of [-10,-6,6,10])box(x-1,x+1,8,11,-64,-64,'glass');
  deck(-16,16,16,-79,-65,trim);
  for(const [left,right] of [[-15,-11],[11,15]]){
    for(const x of [left-1,right+1])box(x,x,5,16,-77,-68,stone);
    box(left,right,5,8,-77,-77,stone);
    box(left,right,5,8,-68,-68,stone);
    door(left,left+1,5,7,-68,-68);
    opening(left,right,13,16,-77,-68);
    box(left+2,left+2,5,15,-74,-69,stone);
    deck(left,right,10,-77,-75,trim);
    for(let side=0;side<2;side++){
      routes.push([[left+side,4,-68],...Array.from({length:6},(_,i)=>[left+side,5+i,-69-i]),[left+side,10,-75]]);
      deck(left+side,left+side,10,-76,-75,trim);
      routes.push([[right-side,10,-76],...Array.from({length:6},(_,i)=>[right-side,11+i,-75+i]),[right-side,16,-69]]);
    }
    door(right-1,right,17,18,-68,-68);
    deck(left,right,16,-68,-65,trim);
    // Ground-floor access from the nave beside each stair entrance.
    door(left-1,left-1,5,8,-67,-66);
    door(right+1,right+1,5,8,-67,-66);
    for(const z of [-74,-71])box(left-1,left-1,13,14,z,z,'glass');
  }
  for(const x of [-7,0,7]){
    box(x,x,17,20,-79,-71,stone);
    door(x,x,17,19,-72,-71);
  }
  for(let y=19;y<=31;y++){
    const span=17-(y-19);
    for(const x of [-span,span])deck(x,x,y,-81,-63,slate);
    for(const z of [-81,-63])deck(-span,span,y,z,z,stone);
  }
  deck(-4,4,32,-81,-63,slate);
  solid(0,24,-63,'glass');
  for(const [x,y,z,type] of interiorLampSites){
    solid(x,y,z,type);
  }
  for(const x of [-8,8])for(const z of [-60,-51,-32,-24,-16]){
    solid(x,5,z,slate);
    solid(x,6,z,'lantern');
  }
}

export const wingWindows=[-35,34].flatMap(x=>[-70,-60,-50].map(z=>[x,z]));

export const interiorLampSites=[
  ...[-3,3].flatMap(x=>[-41,-38].map(z=>[x,8,z,'lantern',Math.sign(x),0])),
  ...[-34,33].flatMap(x=>[-67,-57,-47].map(z=>[x,7,z,'lantern',x<0?-1:1,0])),
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
