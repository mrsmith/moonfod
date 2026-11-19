import test from 'node:test';
import assert from 'node:assert/strict';
import {outlines} from '../dist/outlines.js';
import {features} from '../dist/features.js';
import {projectOutline} from '../dist/outline-projection.js';

const view={observer:[1,0,0],right:[0,1,0],up:[0,0,1]},geometry={cx:150,cy:150,radius:100};
const points=d=>[...d.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)].map(m=>[Number(m[1]),Number(m[2])]);

test('every lesson has a real USGS outline with provenance and valid coordinates',()=>{
 assert.deepEqual(Object.keys(outlines).sort(),features.map(f=>f.id).sort());
 for(const f of features){
  const outline=outlines[f.id];assert.equal(outline.source,f.gazetteer);assert.equal(outline.controlNetwork,'LOLA 2011');
  for(const path of outline.paths){
   assert.ok(path.length>2);
   for(const [lon,lat] of path)assert.ok(Number.isFinite(lon)&&Number.isFinite(lat)&&Math.abs(lon)<=180&&Math.abs(lat)<=90);
   if(outline.geometryType.includes('POLYGON'))assert.deepEqual(path[0],path.at(-1));
  }
 }
 assert.equal(outlines.recta.geometryType,'MULTILINESTRING','the Straight Wall is a trace, not an invented enclosing ring');
});

test('outline coordinates use the same spherical projection as the Moon',()=>{
 const path=projectOutline([[[30,30],[31,30]]],view,geometry),[x,y]=points(path)[0];
 assert.ok(Math.abs(x-(150+100*Math.cos(Math.PI/6)*.5))<.001);
 assert.ok(Math.abs(y-100)<.001);
 const rotated={...view,right:[0,-1,0],up:[0,0,-1]},[rx,ry]=points(projectOutline([[[30,30],[31,30]]],rotated,geometry))[0];
 assert.ok(Math.abs(x+rx-300)<.001&&Math.abs(y+ry-300)<.001);
});

test('longitude seams stay local instead of drawing across the Moon',()=>{
 const path=projectOutline([[[359,0],[1,0]]],view,geometry);
 for(const [x,y] of points(path)){assert.ok(Math.abs(x-150)<2);assert.equal(y,150)}
});

test('far-side outlines disappear and crossing boundaries stop at the limb',()=>{
 assert.equal(projectOutline([[[170,-10],[175,10],[-170,10]]],view,geometry),'');
 const path=projectOutline([[[80,-10],[100,-10],[100,10],[80,10],[80,-10]]],view,geometry);
 assert.equal((path.match(/M/g)||[]).length,2,'hidden section must break the stroke');
 assert.ok(!path.includes('Z'),'do not invent a closing chord across hidden terrain');
 for(const [x,y] of points(path))assert.ok(Math.hypot(x-150,y-150)<=100.001);
});

test('open traces and separate parts keep their source topology',()=>{
 const path=projectOutline([[[0,0],[1,1]],[[10,0],[11,1]]],view,geometry);
 assert.equal((path.match(/M/g)||[]).length,2);
 assert.ok(!path.includes('Z'));
});
