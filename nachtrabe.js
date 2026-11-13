export function buildCastleArchitecture({box,solid,deck,empty,routes}){
  const stone='netherBrick', trim='netherTrim', slate='netherDeep';
  const opening=(xa,xb,ya,yb,za,zb)=>box(xa,xb,ya,yb,za,zb,null);
  deck(-38,37,4,-82,-35,'cobble');
  box(-38,-38,5,13,-82,-35,stone);
  box(37,37,5,13,-82,-35,stone);
  box(-38,37,5,13,-82,-82,stone);
  box(-38,37,5,12,-36,-35,stone);
  opening(-3,3,5,10,-36,-35);
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
  // Two gate chambers and an open central passage.
  for(const [a,b] of [[-12,-4],[4,12]]){
    box(a,b,5,15,-42,-34,stone);
    opening(a+1,b-1,5,11,-41,-35);
    opening(a+3,a+5,5,8,-42,-42);
    for(let y=16;y<=20;y++){
      const inset=y-16;
      if(a+inset<=b-inset)deck(a+inset,b-inset,y,-42+inset,-34-inset,slate);
    }
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
    for(const z of [-65,-55])opening(passage,passage+1,5,8,z,z);
    for(const z of rooms){
      opening(inner,inner,5,8,z,z+1);
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
  opening(-3,3,5,10,-64,-64);
  for(const x of [-10,-6,6,10])box(x-1,x+1,8,11,-64,-64,'glass');
  deck(-16,16,16,-79,-65,trim);
  for(const [left,right] of [[-15,-11],[11,15]]){
    for(const x of [left-1,right+1])box(x,x,5,16,-77,-68,stone);
    box(left,right,5,8,-77,-77,stone);
    box(left,right,5,8,-68,-68,stone);
    opening(left,left+1,5,7,-68,-68);
    opening(left,right,13,16,-77,-68);
    box(left+2,left+2,5,15,-74,-69,stone);
    deck(left,right,10,-77,-75,trim);
    for(let side=0;side<2;side++){
      routes.push([[left+side,4,-68],...Array.from({length:6},(_,i)=>[left+side,5+i,-69-i]),[left+side,10,-75]]);
      deck(left+side,left+side,10,-76,-75,trim);
      routes.push([[right-side,10,-76],...Array.from({length:6},(_,i)=>[right-side,11+i,-75+i]),[right-side,16,-69]]);
    }
    opening(right-1,right,17,18,-68,-68);
    deck(left,right,16,-68,-65,trim);
    // Ground-floor access from the nave beside each stair entrance.
    opening(left-1,left-1,5,8,-67,-66);
    opening(right+1,right+1,5,8,-67,-66);
    for(const z of [-74,-71])box(left-1,left-1,13,14,z,z,'glass');
  }
  for(const x of [-7,0,7]){
    box(x,x,17,20,-79,-71,stone);
    opening(x,x,17,19,-72,-71);
  }
  for(let y=19;y<=31;y++){
    const span=17-(y-19);
    for(const x of [-span,span])deck(x,x,y,-81,-63,slate);
    for(const z of [-81,-63])deck(-span,span,y,z,z,stone);
  }
  deck(-4,4,32,-81,-63,slate);
  for(const x of [-8,8])for(const z of [-60,-51,-42]){
    solid(x,5,z,slate);
    solid(x,6,z,'lantern');
  }
}
