import test from 'node:test';
import assert from 'node:assert/strict';
import {createGestureTracker,featureActivation} from '../dist/gestures.js';

const point=(x,y,time=0,extra={})=>({pointerId:1,isPrimary:true,button:0,clientX:x,clientY:y,timeStamp:time,...extra});
test('horizontal swipes advance once on release and preserve left/right meaning',()=>{
 const g=createGestureTracker();
 g.start(point(240,220));g.move(point(170,225,100));
 assert.deepEqual(g.end(point(90,228,260)),{kind:'swipe',direction:1});
 assert.equal(g.end(point(70,228,280)),null);
 g.start(point(90,220));
 assert.deepEqual(g.end(point(220,210,300)),{kind:'swipe',direction:-1});
});
test('tap jitter is accepted; vertical motion, tiny drags, long holds and slow swipes are cancelled',()=>{
 for(const [end,kind] of [[point(105,106,150),'tap'],[point(105,200,160),'cancel'],[point(125,105,140),'cancel'],[point(100,100,800),'cancel'],[point(250,100,1600),'cancel'],[point(180,160,220),'cancel']]){
  const g=createGestureTracker();g.start(point(100,100));assert.equal(g.end(end).kind,kind);
 }
 const g=createGestureTracker();g.start(point(100,100));g.move(point(160,100,100));
 assert.equal(g.end(point(100,100,200)).kind,'cancel','dragging out and back must not become a tap');
});
test('pinches, browser cancellation and another pointer cannot turn into navigation',()=>{
 const g=createGestureTracker();g.start(point(220,220));
 g.start(point(250,220,20,{pointerId:2,isPrimary:false}));
 assert.equal(g.end(point(40,220,300)),null);
 g.start(point(220,220));g.cancel();assert.equal(g.end(point(40,220,300)),null);
 g.start(point(220,220));assert.equal(g.end(point(40,220,300,{pointerId:2})),null);
 assert.equal(g.end(point(220,220,200)).kind,'tap');
 g.start(point(220,220,0,{button:2}));assert.equal(g.end(point(40,220,300)),null);
});
test('touch and pen highlight first, then open; mouse and keyboard open immediately',()=>{
 const base={available:true,selected:false};
 for(const pointerType of ['touch','pen']){
  assert.equal(featureActivation({...base,pointerType}),'highlight');
  assert.equal(featureActivation({...base,pointerType,selected:true}),'open');
 }
 assert.equal(featureActivation({...base,pointerType:'mouse'}),'open');
 assert.equal(featureActivation({...base,pointerType:'touch',keyboard:true}),'open');
 assert.equal(featureActivation({...base,available:false,pointerType:'touch',selected:true}),'none');
});
