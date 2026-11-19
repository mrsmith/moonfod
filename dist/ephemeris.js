/* IAU lunar body axes + geocentric Sun/Moon vectors, in J2000. */
const RAD = Math.PI / 180;
export const dot = (a,b) => a.reduce((s,x,i)=>s+x*b[i],0);
export const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const norm = v => {const m=Math.hypot(...v);return v.map(x=>x/m)};
const vector = v => [v.x,v.y,v.z];
export const surface = (lat,lon) => [Math.cos(lat*RAD)*Math.cos(lon*RAD),Math.cos(lat*RAD)*Math.sin(lon*RAD),Math.sin(lat*RAD)];
export function ephemeris(date) {
  const A=globalThis.Astronomy;
  const moon=vector(A.GeoMoon(date)), sun=vector(A.GeoVector('Sun',date,true));
  // Surface orientation is evaluated at the light-time corrected lunar epoch.
  const distance=Math.hypot(...moon)*149597870.7;
  const emitted=new Date(+date-distance/299792.458*1000);
  const axis=A.RotationAxis('Moon',emitted), a=axis.ra*15*RAD, w=axis.spin*RAD;
  const north=vector(axis.north), node=[-Math.sin(a),Math.cos(a),0], side=cross(north,node);
  const x=node.map((v,i)=>v*Math.cos(w)+side[i]*Math.sin(w));
  const y=node.map((v,i)=>-v*Math.sin(w)+side[i]*Math.cos(w));
  const body=v=>[dot(v,x),dot(v,y),dot(v,north)];
  const towardEarth=norm(moon.map(v=>-v));
  // Right is west on the celestial sphere; celestial north is up.
  const right=norm(cross([0,0,1],towardEarth)), up=cross(towardEarth,right);
  const observer=body(towardEarth), light=body(norm(sun.map((v,i)=>v-moon[i])));
  const phase=A.MoonPhase(date), illuminated=A.Illumination('Moon',date).phase_fraction;
  const previousNew=A.SearchMoonPhase(0,date,-32);
  return {date,distance,phase,illuminated,age:(+date-+previousNew.date)/86400000,
    right:body(right),up:body(up),observer,light,
    longitude:Math.atan2(observer[1],observer[0])/RAD, latitude:Math.asin(observer[2])/RAD,
    solarLongitude:Math.atan2(light[1],light[0])/RAD, solarLatitude:Math.asin(light[2])/RAD,
    positionAngle:Math.atan2(dot(north,right),dot(north,up))/RAD};
}
export function project(feature,ephem,south=false){
  const n=surface(feature.lat,feature.lon), sign=south?-1:1;
  return {x:dot(n,ephem.right)*sign,y:dot(n,ephem.up)*sign,z:dot(n,ephem.observer),light:dot(n,ephem.light)};
}
export function phaseName(e) {
  if(e.illuminated<.006)return 'New Moon';
  if(e.illuminated>.994)return 'Full Moon';
  if(Math.abs(e.phase-90)<2)return 'First quarter';
  if(Math.abs(e.phase-270)<2)return 'Last quarter';
  return `${e.phase<180?'Waxing':'Waning'} ${e.illuminated<.5?'crescent':'gibbous'}`;
}
export function dayKey(date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
export function dayNumber(date){return Math.floor(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())/86400000);}
