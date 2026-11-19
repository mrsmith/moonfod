import test from 'node:test';
import assert from 'node:assert/strict';
import {discoveryForDate,normalizeBrightness,lightingForPhase,isObservable} from '../dist/experience.js';

test('today and yesterday reveal their own lesson while tomorrow never invokes the selector',()=>{
 const today=new Date(2026,10,18,21),calls=[];
 const choose=date=>{calls.push(date.getDate());return {id:`feature-${date.getDate()}`}};
 assert.equal(discoveryForDate(new Date(2026,10,17,21),today,choose).id,'feature-17');
 assert.equal(discoveryForDate(new Date(2026,10,18,23),today,choose).id,'feature-18');
 assert.equal(discoveryForDate(new Date(2026,10,19,0),today,choose),null);
 assert.deepEqual(calls,[17,18]);
});
test('future feature gating respects local dates across year boundaries',()=>{
 const now=new Date(2026,11,31,23,59),future=new Date(2027,0,1,0,1);
 assert.equal(discoveryForDate(future,now,()=>{throw Error('Future lesson was requested')}),null);
 assert.equal(discoveryForDate(future,new Date(2027,0,1,0,2),()=>42),42);
});
test('brightness defaults to 40 percent and controls both lit and unlit terrain',()=>{
 assert.equal(normalizeBrightness(null),40);assert.equal(normalizeBrightness('invalid'),40);
 assert.equal(normalizeBrightness('0'),0);assert.equal(normalizeBrightness(150),100);
 for(const phase of [0,.25,.67,1]){
  const values=[0,25,40,75,100].map(value=>lightingForPhase(value,phase));
  for(let i=1;i<values.length;i++){
   assert.ok(values[i].earthshine>values[i-1].earthshine);
   assert.ok(values[i].exposure>values[i-1].exposure);
  }
  assert.ok(values[0].earthshine<.003,'zero disables the artificial shadow fill');
 }
});
test('phase adaptation preserves the preferred gibbous view, dims full Moon and lifts dark phases',()=>{
 const gibbous=lightingForPhase(40,.67),full=lightingForPhase(40,1),dark=lightingForPhase(40,.01);
 assert.equal(gibbous.exposure,2.15);
 assert.ok(full.exposure<gibbous.exposure*.5,'full Moon exposure should be reduced by more than one stop');
 assert.ok(dark.earthshine>gibbous.earthshine*3,'dark phases need substantially more shadow detail');
 assert.ok(dark.exposure<gibbous.exposure*1.1,'a thin sunlit crescent must not get a huge exposure boost');
});
test('phase compensation remains smooth and bounded throughout the lunar cycle',()=>{
 let previous=lightingForPhase(40,0);
 for(let step=1;step<=1000;step++){
  const current=lightingForPhase(40,step/1000);
  assert.ok(current.exposure>0&&Number.isFinite(current.exposure));
  assert.ok(current.earthshine>0&&Number.isFinite(current.earthshine));
  assert.ok(Math.abs(current.exposure-previous.exposure)<.02);
  assert.ok(Math.abs(current.earthshine-previous.earthshine)<.002);
  assert.ok(current.exposure<=previous.exposure&&current.earthshine<=previous.earthshine);
  previous=current;
 }
});
test('visible night-side features qualify while limb and far-side features stay excluded',()=>{
 const feature={lat:0,lon:0},axes={right:[0,1,0],up:[0,0,1],observer:[1,0,0]};
 assert.equal(isObservable(feature,{...axes,light:[-1,0,0]}),true);
 assert.equal(isObservable(feature,{...axes,light:[.05,Math.sqrt(1-.05**2),0]}),true);
 assert.equal(isObservable(feature,{...axes,observer:[0,1,0],light:[1,0,0]}),false);
 assert.equal(isObservable(feature,{...axes,observer:[-1,0,0],light:[1,0,0]}),false);
 assert.equal(isObservable(feature,{...axes,light:[.5,Math.sqrt(.75),0]}),true);
});
