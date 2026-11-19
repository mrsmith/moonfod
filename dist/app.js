import {ephemeris,project,phaseName,dayKey,dayNumber} from './ephemeris.js';
import {dailyFeature} from './daily.js';
import {MoonRenderer,drawStars} from './renderer.js';
import {discoveryForDate,isObservable} from './experience.js';
import {outlines} from './outlines.js';
import {projectOutline} from './outline-projection.js';
import {site} from './site.js';
const $=id=>document.getElementById(id);
let selectedDate=new Date(),live=true,e,featured=null,renderer,pendingDraw=0;
const view={zoom:1,south:false,brightness:40};
const formatDate=d=>new Intl.DateTimeFormat(undefined,{day:'numeric',month:'long',...(d.getFullYear()!==new Date().getFullYear()?{year:'numeric'}:{})}).format(d);
const coord=(v,p,n)=>`${Math.abs(v).toFixed(1)}° ${v>=0?p:n}`;
function relativeDay(date){const diff=dayNumber(date)-dayNumber(new Date());return diff===0?'Today':diff===-1?'Yesterday':diff===1?'Tomorrow':formatDate(date)}
function adjacent(direction){const d=new Date(selectedDate);d.setDate(d.getDate()+direction);return d}
function updateDate(date,{isLive=false}={}){
 if(!Number.isFinite(+date)||date.getFullYear()<1900||date.getFullYear()>2100)return;
 selectedDate=date;live=isLive;e=ephemeris(date);
 featured=discoveryForDate(date,new Date(),dailyFeature);
 if(featured&&!isObservable(featured,e))featured=null;
 const relative=relativeDay(date),diff=dayNumber(date)-dayNumber(new Date());
 $('observation-date').textContent=Math.abs(diff)<=1?`${relative} · ${formatDate(date)}`:formatDate(date);
 $('feature-name').hidden=!featured;$('feature-name').textContent=featured?.name||'';
 $('feature-name').setAttribute('aria-label',featured?`Discover ${featured.name}, ${relative.toLowerCase()}’s lunar feature`:'');
 $('no-feature').hidden=!!featured||diff>0;
 $('no-feature').textContent=diff===0?'No feature in view today.':'No feature in view on this date.';
 $('return-today').hidden=diff===0;
 $('previous-label').textContent=relativeDay(adjacent(-1));$('next-label').textContent=relativeDay(adjacent(1));
 $('previous-day').setAttribute('aria-label',`View ${relativeDay(adjacent(-1)).toLowerCase()}`);
 $('next-day').setAttribute('aria-label',`View ${relativeDay(adjacent(1)).toLowerCase()}`);
 $('previous-day').disabled=dayKey(date)==='1900-01-01';$('next-day').disabled=dayKey(date)==='2100-12-31';
 $('moon').setAttribute('aria-label',`${phaseName(e)}, ${(e.illuminated*100).toFixed(1)} percent illuminated. ${formatDate(date)}. View from Earth, celestial north up.`);
 document.title=diff===0?`${site.name} — Moon Feature of the Day`:`${relative} on the Moon — ${site.name}`;
 scheduleDraw();
}
function scheduleDraw(){if(pendingDraw||document.hidden)return;pendingDraw=requestAnimationFrame(()=>{pendingDraw=0;draw()})}
function draw(){
 if(!e||document.hidden)return;
 renderer?.draw(e,view);const outline=$('feature-outline'),g=renderer?.geometry;
 if(!featured||!g||!renderer.ready||!isObservable(featured,e)){outline.hidden=true;return}
 const shape=outlines[featured.id];if(!shape){outline.hidden=true;return}
 const path=projectOutline(shape.paths,e,g);if(!path){outline.hidden=true;return}
 $('outline-svg').setAttribute('viewBox',`0 0 ${g.width} ${g.height}`);
 $('outline-trace').setAttribute('d',path);$('outline-hit').setAttribute('d',path);
 outline.setAttribute('aria-label',`Explore ${featured.name}`);outline.hidden=false;
}
function stepDay(direction){
 const next=adjacent(direction);const isToday=dayKey(next)===dayKey(new Date());
 if(isToday)updateDate(new Date(),{isLive:true});else{next.setHours(21,0,0,0);updateDate(next)}
}
$('previous-day').onclick=()=>stepDay(-1);$('next-day').onclick=()=>stepDay(1);
$('return-today').onclick=()=>updateDate(new Date(),{isLive:true});
function openDetail(){
 if(!featured)return;const f=featured;
 $('detail-date').textContent=dayKey(selectedDate)===dayKey(new Date())?'TODAY’S DISCOVERY':`DISCOVERED ${formatDate(selectedDate).toUpperCase()}`;
 $('detail-name').textContent=f.name;$('detail-subtitle').textContent=f.subtitle;
 $('detail-intro').textContent=f.intro;$('detail-lesson').textContent=f.lesson;$('detail-tip').textContent=f.tip;
 $('detail-coordinates').textContent=`${f.type} · ${f.size.toLocaleString()} km · ${coord(f.lat,'N','S')} · ${coord(f.lon,'E','W')}`;
 const p=project(f,e);$('detail-visibility').textContent=p.light<=0?'On the night side. Enhanced brightness reveals the surface for study.':p.light<.25?'Near the terminator, where low sunlight reveals the terrain.':'';
 $('detail-source').href=f.source;$('outline-source').href=outlines[f.id].source;$('detail-dialog').showModal();
}
$('feature-name').onclick=$('feature-outline').onclick=openDetail;
for(const event of ['pointerenter','focus'])$('feature-name').addEventListener(event,()=>document.body.classList.add('feature-focus'));
for(const event of ['pointerleave','blur'])$('feature-name').addEventListener(event,()=>document.body.classList.remove('feature-focus'));
$('close-detail').onclick=()=>$('detail-dialog').close();
$('detail-dialog').addEventListener('click',event=>{if(event.target!==$('detail-dialog'))return;const r=event.target.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)event.target.close()});
document.addEventListener('keydown',event=>{
 if($('detail-dialog').open||event.target.matches('input,textarea,select,[contenteditable]')||event.altKey||event.ctrlKey||event.metaKey)return;
 if(event.key==='ArrowLeft'){event.preventDefault();stepDay(-1)}
 if(event.key==='ArrowRight'){event.preventDefault();stepDay(1)}
 if(event.key==='Home'){event.preventDefault();updateDate(new Date(),{isLive:true})}
});
let lastSize='';new ResizeObserver(entries=>{const r=entries[0].contentRect,key=`${Math.round(r.width)}:${Math.round(r.height)}`;if(key===lastSize)return;lastSize=key;scheduleDraw();drawStars($('stars'))}).observe($('moon-stage'));
async function startRenderer(){
 $('loading').hidden=false;$('render-error').hidden=true;$('feature-outline').hidden=true;
 try{renderer?.dispose();renderer=new MoonRenderer($('moon'));draw();await renderer.init('high');$('loading').hidden=true;document.body.classList.add('ready');draw()}
 catch(error){console.error(error);$('loading').hidden=true;$('render-error').hidden=false}
}
$('retry-render').onclick=startRenderer;
$('moon').addEventListener('webglcontextlost',event=>{event.preventDefault();if(renderer)renderer.ready=false;$('loading').hidden=true;$('render-error').hidden=false;$('feature-outline').hidden=true});
$('moon').addEventListener('webglcontextrestored',startRenderer);
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(pendingDraw);pendingDraw=0}else if(live)updateDate(new Date(),{isLive:true});else updateDate(selectedDate)});
window.addEventListener('pagehide',()=>{cancelAnimationFrame(pendingDraw);pendingDraw=0});
window.addEventListener('pageshow',()=>{if(live)updateDate(new Date(),{isLive:true});else scheduleDraw()});
setInterval(()=>{if(!document.hidden){if(live)updateDate(new Date(),{isLive:true});else if(!featured&&dayKey(selectedDate)<=dayKey(new Date()))updateDate(selectedDate)}},60000);
updateDate(selectedDate,{isLive:true});drawStars($('stars'));startRenderer();
