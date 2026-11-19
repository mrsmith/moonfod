// Pointer-only state: browser scrolling, pinching, and cancelled gestures never navigate.
export function createGestureTracker(){
 let active=null;
 const move=p=>{
  if(!active||p.pointerId!==active.id)return;
  active.travel=Math.max(active.travel,Math.hypot(p.clientX-active.x,p.clientY-active.y));
 };
 return {
  start(p){
   if(p.isPrimary===false||(active&&active.id!==p.pointerId)){active=null;return}
   if(p.button!==0)return;
   active={id:p.pointerId,x:p.clientX,y:p.clientY,time:p.timeStamp,travel:0};
  },
  move,
  end(p){
   if(!active||p.pointerId!==active.id)return null;
   move(p);const a=active;active=null;
   const dx=p.clientX-a.x,dy=p.clientY-a.y,elapsed=p.timeStamp-a.time;
   if(Math.abs(dx)>=48&&Math.abs(dx)>Math.abs(dy)*1.8&&elapsed<=1200)return {kind:'swipe',direction:dx<0?1:-1};
   return {kind:a.travel<=12&&elapsed<=500?'tap':'cancel'};
  },
  cancel(){active=null}
 };
}

// A touch/pen selects first. Mouse and assistive-technology activation open directly.
export function featureActivation({available,selected,pointerType,keyboard=false}){
 if(!available)return 'none';
 return keyboard||pointerType==='mouse'||selected?'open':'highlight';
}
