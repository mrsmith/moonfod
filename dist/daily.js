import {ephemeris,project,dayKey} from './ephemeris.js';
import {features} from './features.js';
import {isObservable} from './experience.js';
const cache=new Map(),years=new Map();
// A deterministic schedule for each local calendar year, independent of saved progress.
// Major landmarks receive a head start; time since last selection promotes variety.
export function dailyFeature(date){
 const key=dayKey(date);if(cache.has(key))return cache.get(key);
 const year=date.getFullYear(),end=new Date(year,date.getMonth(),date.getDate(),21);
 if(!years.has(year))years.set(year,{cursor:new Date(year,0,1,21),lastSeen:new Map(),index:0});
 const state=years.get(year),lastSeen=state.lastSeen;
 for(let d=state.cursor;d<=end;d.setDate(d.getDate()+1),state.index++){
  const index=state.index;
  const eph=ephemeris(d),start=new Date(d),middle=new Date(d),end=new Date(d);
  start.setHours(0,0,0,0);middle.setHours(12,0,0,0);end.setHours(23,59,59,999);
  const views=[ephemeris(start),ephemeris(middle),ephemeris(end),eph];
  let best=null,bestScore=-Infinity;
  for(const f of features){if(!views.every(sample=>isObservable(f,sample)))continue;
   const p=project(f,eph),gap=lastSeen.has(f.id)?index-lastSeen.get(f.id):60;
   const score=Math.min(gap,45)*2.5+f.priority*4+(f.type==='Impact crater'?1-Math.abs(p.light-.28):p.light)*7+(p.z*.5);
   if(score>bestScore){bestScore=score;best=f}
  }
  // The enhanced night side is eligible; only hidden or grazing-limb terrain is excluded.
  if(best)lastSeen.set(best.id,index);cache.set(dayKey(d),best);
 }
 return cache.get(key);
}
