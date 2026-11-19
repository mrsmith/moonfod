import {lightingForPhase} from './experience.js';
const vertex=`attribute vec2 position;void main(){gl_Position=vec4(position,0.,1.);}`;
const fragment=`precision highp float;
uniform vec2 resolution,center,heightTexel;uniform float radius,earthshine,exposure;uniform mat3 basis;
uniform vec3 light;uniform sampler2D colorMap,heightMap;
const float PI=3.141592653589793;
vec2 uv(vec3 n){return vec2(atan(n.y,n.x)/(2.*PI)+.5,.5-asin(clamp(n.z,-1.,1.))/PI);}
float altitude(vec2 st){vec2 c=texture2D(heightMap,st).rg;return ((c.r*65280.+c.g*255.)*.0005-10.)/1737.4;}
void main(){
 vec2 p=(gl_FragCoord.xy-center)/radius;float r2=dot(p,p);if(r2>1.)discard;
 vec3 view=vec3(p,sqrt(1.-r2));vec3 n=basis*view;vec2 st=uv(n);
 vec3 albedo=texture2D(colorMap,st).rgb;
 float du=heightTexel.x,dv=heightTexel.y;float h=altitude(st);
 vec3 east=normalize(vec3(-n.y,n.x,0.)),north=cross(n,east);
 float dx=(altitude(st+vec2(du,0.))-altitude(st-vec2(du,0.)))/(4.*PI*du*max(.08,length(n.xy)));
 float dy=(altitude(st-vec2(0.,dv))-altitude(st+vec2(0.,dv)))/(2.*PI*dv);
 vec3 normal=normalize(n-east*dx-north*dy);
 float incidence=dot(n,light),mu=max(0.,dot(normal,light));
 float visibility=smoothstep(-.002,.002,incidence);
 if(incidence>-.015&&incidence<.4){
  vec3 origin=n*(1.+h+.000015);
  for(int i=1;i<=12;i++){
   float stepSize=.00045*pow(float(i),1.65);
   vec3 point=origin+light*stepSize;float len=length(point);
   float terrain=1.+altitude(uv(point/len));
   visibility*=smoothstep(-.000008,.000008,len-terrain);
  }
 }
 // A lunar Lommel-Seeliger/Lambert blend avoids a plastic-looking sphere.
 float emission=max(.03,dot(normal,basis[2]));
 float diffuse=.7*(mu/(mu+emission+.001))+.3*mu;
 float brightness=diffuse*visibility*1.65+earthshine;
 vec3 linear=pow(albedo,vec3(2.2))*brightness*exposure;
 // Filmic shoulder: luminous highlands retain texture instead of clipping to white.
 vec3 mapped=(linear*(2.51*linear+.03))/(linear*(2.43*linear+.59)+.14);
 vec3 color=pow(clamp(mapped,0.,1.),vec3(1./2.2));
 // A restrained S-curve separates dark maria from bright highlands in SDR.
 color=mix(color,smoothstep(vec3(.015),vec3(1.02),color),.2);
 float edge=1.-smoothstep(1.-1.5/radius,1.,sqrt(r2));
 gl_FragColor=vec4(color,edge);
}`;
export class MoonRenderer {
 constructor(canvas){
  this.canvas=canvas;this.gl=canvas.getContext('webgl',{alpha:true,antialias:false,depth:false,stencil:false,powerPreference:'low-power',premultipliedAlpha:false,preserveDrawingBuffer:false});
  if(!this.gl)throw Error('WebGL is unavailable');
  const gl=this.gl,compile=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s};
  this.program=gl.createProgram();const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment);gl.attachShader(this.program,vs);gl.attachShader(this.program,fs);gl.linkProgram(this.program);gl.deleteShader(vs);gl.deleteShader(fs);
  if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(this.program));gl.useProgram(this.program);
  const buf=this.buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const pos=gl.getAttribLocation(this.program,'position');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
  this.loc=Object.fromEntries(['resolution','center','heightTexel','radius','earthshine','exposure','basis','light','colorMap','heightMap'].map(n=>[n,gl.getUniformLocation(this.program,n)]));
  this.ready=false;this.textures=[];this.quality='high';
 }
 async init(quality='high'){
  const gl=this.gl,max=gl.getParameter(gl.MAX_TEXTURE_SIZE);
  if(quality==='ultra'&&max<8192)throw Error('This device supports the 4K surface map.');
  if(max<4096)throw Error('This device does not support the required surface maps.');
  const load=path=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('The lunar surface maps could not be loaded.'));img.src=path;});
  // Start with 4K color and 2K elevation. Ultra is explicitly opt-in.
  const color=await load(quality==='ultra'?'./assets/moon-color-8k.jpg':'./assets/moon-color-4k.jpg');
  const height=await load(quality==='ultra'?'./assets/moon-height.png':'./assets/moon-height-2k.png');
  this.ready=false;
  for(const tex of this.textures)gl.deleteTexture(tex);this.textures=[];
  [color,height].forEach((img,unit)=>{
   const tex=gl.createTexture();this.textures.push(tex);gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,tex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,img);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  });
  gl.useProgram(this.program);gl.uniform1i(this.loc.colorMap,0);gl.uniform1i(this.loc.heightMap,1);gl.uniform2f(this.loc.heightTexel,1/height.width,1/height.height);this.quality=quality;this.ready=true;
 }
 dispose(){
  this.ready=false;for(const tex of this.textures)this.gl.deleteTexture(tex);this.textures=[];
  this.gl.deleteBuffer(this.buffer);this.gl.deleteProgram(this.program);
 }

 draw(e,{south=false,zoom=1,panX=0,panY=0,brightness=40}={}){
  const gl=this.gl,c=this.canvas,rect=c.getBoundingClientRect(),pixelBudget=this.quality==='ultra'?2400000:1200000,dpr=Math.min(devicePixelRatio||1,2,Math.sqrt(pixelBudget/Math.max(1,rect.width*rect.height)));
  const width=Math.round(rect.width*dpr),height=Math.round(rect.height*dpr);
  if(c.width!==width||c.height!==height){c.width=width;c.height=height;}
  const radius=Math.min(rect.width*.475,rect.height*.47)*zoom;
  this.geometry={width:rect.width,height:rect.height,radius,cx:rect.width/2+panX,cy:rect.height/2+panY};
  gl.viewport(0,0,width,height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
  if(!this.ready)return;
  gl.useProgram(this.program);gl.uniform2f(this.loc.resolution,width,height);gl.uniform2f(this.loc.center,(rect.width/2+panX)*dpr,(rect.height/2-panY)*dpr);gl.uniform1f(this.loc.radius,radius*dpr);
  const s=south?-1:1;gl.uniformMatrix3fv(this.loc.basis,false,new Float32Array([...e.right.map(x=>x*s),...e.up.map(x=>x*s),...e.observer]));
  const lighting=lightingForPhase(brightness,e.illuminated);
  gl.uniform3fv(this.loc.light,e.light);gl.uniform1f(this.loc.earthshine,lighting.earthshine);gl.uniform1f(this.loc.exposure,lighting.exposure);gl.drawArrays(gl.TRIANGLES,0,6);
 }
}
export function drawStars(canvas){
 const dpr=1,w=innerWidth,h=innerHeight;if(canvas.width===w&&canvas.height===h)return;canvas.width=w;canvas.height=h;
 const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);let seed=37891;const rand=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646};
 for(let i=0;i<w*h/6400;i++){const x=rand()*w,y=rand()*h,r=rand()>.97?1.1:rand()*.65+.2;ctx.fillStyle=`rgba(194,204,218,${.08+rand()*.33})`;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
}
