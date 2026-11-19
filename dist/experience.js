import {dayKey,project} from './ephemeris.js';
// Future dates show the Moon without calculating or revealing the future lesson.
export function discoveryForDate(date,today,choose){
 return dayKey(date)>dayKey(today)?null:choose(date);
}
// Lessons can use either lit or unlit terrain on the Earth-facing disk, clear of the limb.
export function isObservable(feature,ephem){
 return project(feature,ephem).z>=.18;
}
export function normalizeBrightness(value){
 if(value===null||value===''||!Number.isFinite(Number(value)))return 40;
 return Math.min(100,Math.max(0,Number(value)));
}
const smoothstep=(low,high,value)=>{const t=Math.min(1,Math.max(0,(value-low)/(high-low)));return t*t*(3-2*t)};
export function lightingForPhase(value,illuminated){
 const level=normalizeBrightness(value)/100,phase=Math.min(1,Math.max(0,illuminated));
 // Anchor 40% at the gibbous view the user preferred. Reduce exposure toward full
 // Moon, where far more of the disk is bright. Smooth curves prevent date-step jumps.
 const full=smoothstep(.6,1,phase),reference=smoothstep(.6,1,.67);
 const exposure=2.15*Math.pow(2,1.25*(reference-full)+1.5*(level-.4));
 // As the lit area shrinks, lift the unlit surface more strongly for study.
 // This display fill is independent of the Sun direction and lesson eligibility.
 const shadowGain=1+3.2*(1-smoothstep(.03,.6,phase));
 const earthshine=.0003+.002*(1-phase)+.22*Math.pow(level,1.65)*shadowGain;
 return {exposure,earthshine};
}
