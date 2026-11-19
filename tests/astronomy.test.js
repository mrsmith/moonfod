import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
vm.runInThisContext(fs.readFileSync(new URL('../dist/vendor/astronomy.js',import.meta.url),'utf8'));
const {ephemeris,project,dot,dayKey}=await import('../dist/ephemeris.js');
const {dailyFeature}=await import('../dist/daily.js');
const {features}=await import('../dist/features.js');
const {isObservable}=await import('../dist/experience.js');
const reference=JSON.parse(fs.readFileSync(new URL('./nasa-reference.json',import.meta.url),'utf8'));
const delta=(a,b)=>Math.abs(((a-b+540)%360)-180);

test('phase, libration, solar longitude and axial tilt agree with independent NASA samples',()=>{
 for(const n of reference.samples){const e=ephemeris(new Date(n.date));
  assert.ok(Math.abs(e.illuminated*100-n.phase)<.02,`phase at ${n.date}`);
  assert.ok(Math.abs(e.latitude-n.subearth.lat)<.015,`latitude at ${n.date}`);
  assert.ok(delta(e.longitude,n.subearth.lon)<.015,`longitude at ${n.date}`);
  assert.ok(delta(e.solarLongitude,n.subsolar.lon)<.015,`solar longitude at ${n.date}`);
  assert.ok(delta(-e.positionAngle,n.posangle)<.015,`position angle at ${n.date}`);
  assert.ok(Math.abs(e.distance-n.distance)<100,`distance at ${n.date}`);
 }
});
test('Moon age remains valid before and after new Moon',()=>{
 for(const iso of ['2026-11-09T07:01:00Z','2026-11-09T07:03:00Z','1900-01-01T00:00:00Z','2100-12-31T23:59:00Z']){
  const e=ephemeris(new Date(iso));assert.ok(e.age>=0&&e.age<30,`${iso}: ${e.age}`);
 }
});
test('view projection puts sub-Earth point at disk center and hides its antipode',()=>{
 const e=ephemeris(new Date('2026-11-19T05:00:00Z'));
 const center=project({lat:e.latitude,lon:e.longitude},e);assert.ok(Math.abs(center.x)<1e-12&&Math.abs(center.y)<1e-12);assert.ok(center.z>.99999);
 const far=project({lat:-e.latitude,lon:e.longitude+180},e);assert.ok(far.z<-.99999);
 for(const axis of [e.right,e.up,e.observer])assert.ok(Math.abs(dot(axis,axis)-1)<1e-12);
 assert.ok(Math.abs(dot(e.right,e.up))<1e-12);
});
test('hemisphere switch rotates feature positions by 180 degrees without changing illumination',()=>{
 const e=ephemeris(new Date('2026-11-19T05:00:00Z')),n=project(features[0],e),s=project(features[0],e,true);
 assert.equal(n.x,-s.x);assert.equal(n.y,-s.y);assert.equal(n.light,s.light);assert.equal(n.z,s.z);
});
test('daily lessons stay stable and Earth-facing throughout the day, including the night side',()=>{
 let last=null,repeats=0,nightLessons=0,all=new Set();
 for(let day=1;day<=90;day++){
  const d=new Date(2026,0,day,21),f=dailyFeature(d);
  const earlier=new Date(d);earlier.setHours(0,1);assert.equal(dailyFeature(earlier)?.id,f?.id);
  const samples=Array.from({length:24},(_,hour)=>{const at=new Date(d);at.setHours(hour,0,0,0);return ephemeris(at)});
  assert.ok(f,`${dayKey(d)} has a daily lesson even near new Moon`);
  for(const e of samples)assert.ok(isObservable(f,e),`${dayKey(d)}: ${f.id} at ${e.date.getHours()}:00`);
  if(project(f,ephemeris(d)).light<=0)nightLessons++;
  if(last===f.id)repeats++;last=f.id;all.add(f.id);
 }
 assert.ok(all.size>=20,`variety: ${all.size}`);assert.ok(repeats<8,`consecutive repeats: ${repeats}`);
 assert.ok(nightLessons>0,'night-side landmarks should be included in the curriculum');
});
test('all lessons have unique IDs and valid geographic coordinates',()=>{
 assert.equal(new Set(features.map(f=>f.id)).size,24);
 for(const f of features){assert.ok(Math.abs(f.lat)<=90&&Math.abs(f.lon)<=180);assert.ok(f.size>0);assert.ok(f.lesson.length>100&&f.tip.length>30);}
});
