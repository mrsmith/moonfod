import {surface,dot,norm} from './ephemeris.js';

const prepared=new WeakMap(),maxStep=Math.PI/360;
function vectorsFor(paths){
 if(prepared.has(paths))return prepared.get(paths);
 const result=paths.map(path=>{
  const vertices=path.map(([lon,lat])=>surface(lat,lon)),dense=[vertices[0]];
  for(let i=1;i<vertices.length;i++){
   const a=vertices[i-1],b=vertices[i],angle=Math.acos(Math.max(-1,Math.min(1,dot(a,b))));
   const steps=Math.max(1,Math.ceil(angle/maxStep));
   for(let j=1;j<=steps;j++){
    if(j===steps){dense.push(b);continue}
    const t=j/steps,s=Math.sin(angle),wa=Math.sin((1-t)*angle)/s,wb=Math.sin(t*angle)/s;
    dense.push(a.map((v,k)=>wa*v+wb*b[k]));
   }
  }
  return dense;
 });
 prepared.set(paths,result);return result;
}

// Project the source geography using the renderer's exact body/view basis.
// Clip each segment at the limb; never close a hidden arc with a line across the disk.
export function projectOutline(paths,ephem,geometry){
 const {cx,cy,radius}=geometry,commands=[];
 const screen=v=>`${(cx+dot(v,ephem.right)*radius).toFixed(3)} ${(cy-dot(v,ephem.up)*radius).toFixed(3)}`;
 for(const path of vectorsFor(paths)){
  let penDown=false;
  for(let i=1;i<path.length;i++){
   let a=path[i-1],b=path[i];const za=dot(a,ephem.observer),zb=dot(b,ephem.observer);
   if(za<0&&zb<0){penDown=false;continue}
   if((za<0)!==(zb<0)){
    const t=za/(za-zb),edge=norm(a.map((v,k)=>v+(b[k]-v)*t));
    if(za<0)a=edge;else b=edge;
   }
   if(!penDown)commands.push(`M${screen(a)}`);
   commands.push(`L${screen(b)}`);penDown=zb>=0;
  }
 }
 return commands.join(' ');
}
