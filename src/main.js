import * as THREE from 'three';
import {renderProfile,batchStaticMeshes,addLightPool} from './rendering.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {makeRoadster} from './vehicle.js';
import './style.css';
import {t,initLanguage,language} from './i18n.js';
import {createRecorder} from './recording.js';
import {initTouch} from './touch.js';
import {updateRampProgress,canLand,landingChecks,footprint,brakeStep,predictLanding,LANDING_ZONE,thrustAcceleration,drivingKeys} from './challenge.js';
import {rampPose, rampContact} from './collision.js';

const posterMode=new URLSearchParams(location.search).get('poster');
const profiling=new URLSearchParams(location.search).has('perf');let perfPanel,perfFrames=0,perfStart=performance.now();if(profiling){perfPanel=document.createElement('output');perfPanel.id='perf-panel';Object.assign(perfPanel.style,{position:'fixed',top:'155px',left:'15px',zIndex:'100',background:'#000d',color:'#b8f268',padding:'10px',font:'12px monospace',whiteSpace:'pre'});document.body.append(perfPanel);}
function samplePerformance(){if(!profiling)return;perfFrames++;const now=performance.now();if(now-perfStart>=1000){let lights=0;scene.traverse(o=>{if(o.isLight&&o.visible)lights++});perfPanel.textContent=JSON.stringify({fps:Math.round(perfFrames*1000/(now-perfStart)),calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,lights,pixelRatio:renderer.getPixelRatio()});perfStart=now;perfFrames=0;}}
const $=id=>document.getElementById(id);
const guidance=document.createElement('div');guidance.id='landing-guide';guidance.hidden=true;$('hud').append(guidance);
initLanguage();
const mobile=matchMedia('(pointer: coarse)').matches;
const quality=renderProfile({coarse:mobile,width:innerWidth,ratio:devicePixelRatio,override:new URLSearchParams(location.search).get('quality')});
const watchOnly=()=>innerHeight>innerWidth&&(mobile||innerWidth<=900);
let clearTouch=()=>{};
let lastReport=null,lastMessage=null,lastReason=null;
const renderer=new THREE.WebGLRenderer({canvas:$('scene'),antialias:quality.antialias,powerPreference:'high-performance'});
renderer.setPixelRatio(quality.pixelRatio);renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=quality.shadows;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=quality.low?1.35:1.15;
const scene=new THREE.Scene();scene.background=new THREE.Color('#08111e');scene.fog=new THREE.FogExp2('#08111e',.0045);
if(!quality.low){const envRoom=new RoomEnvironment();const pmrem=new THREE.PMREMGenerator(renderer);const envMap=pmrem.fromScene(envRoom,.04);scene.environment=envMap.texture;envRoom.dispose();pmrem.dispose();}
const camera=new THREE.PerspectiveCamera(52,innerWidth/innerHeight,.1,800);
scene.add(new THREE.HemisphereLight(0xbedcff,quality.low?0x617487:0x222a1f,quality.low?4:2));
if(quality.low)scene.add(new THREE.AmbientLight(0xc7dcf1,1.8));
const moon=new THREE.DirectionalLight(0xb5d5ff,quality.low?4.5:3);moon.position.set(-35,65,25);moon.castShadow=quality.shadows;moon.shadow.mapSize.set(mobile?1024:2048,mobile?1024:2048);Object.assign(moon.shadow.camera,{left:-100,right:100,top:100,bottom:-100,far:220});scene.add(moon);
const materials=new Map();const mat=(color,metalness=0,roughness=.6)=>{const key=[color,metalness,roughness].join('/');if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,metalness:quality.low?Math.min(metalness,.2):metalness,roughness}));return materials.get(key)};
const asphalt=mat(0x18232c,.15,.85), steel=mat(0x263641,.65,.4), lime=new THREE.MeshBasicMaterial({color:0xb8f268}), white=new THREE.MeshBasicMaterial({color:0xd8e9ff});
function box(w,h,d,m,x=0,y=0,z=0,parent=scene){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
box(700,.4,500,mat(0x0c161f),50,-.3,0);box(270,.12,16,asphalt,35,0,0);
for(let x=-90;x<165;x+=9){box(3,.03,.12,white,x,.09,-5.8);box(3,.03,.12,white,x,.09,5.8)}
for(let x=-95;x<170;x+=6)for(const z of [-8,8]){box(.5,.08,.16,lime,x,.18,z);}
// The ramp is a continuous semicircle: tangent along +X at entry, -X at exit.
const R=13,start=0,arc=R*Math.PI,verts=[],indices=[];
for(let i=0;i<=120;i++){const a=i/120*Math.PI,x=start+R*Math.sin(a),y=R*(1-Math.cos(a));verts.push(x,y,-6,x,y,6);if(i<120){let k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2)}}
const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setIndex(indices);geo.computeVertexNormals();const ramp=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:0x34434d,metalness:quality.low?.15:.65,roughness:.38,side:THREE.DoubleSide}));ramp.receiveShadow=true;scene.add(ramp);
for(const z of [-6,6]){const points=[];for(let i=0;i<=120;i++){let a=i/120*Math.PI;points.push(new THREE.Vector3(R*Math.sin(a),R*(1-Math.cos(a)),z))}scene.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),120,.07,5,false),lime))}
for(let i=1;i<=12;i++){let a=i/12*Math.PI,x=R*Math.sin(a),y=R*(1-Math.cos(a));for(const z of [-6.35,6.35])box(.24,y,.24,steel,x,y/2,z)}
// Landing strip follows the inverted exit back across the launch field.
box(LANDING_ZONE.width,.15,LANDING_ZONE.depth,mat(0x26352a,.1,.8),LANDING_ZONE.centerX,.08,0);for(const z of [-6,6])box(44,.04,.14,lime,-68,.18,z);for(let x=-86;x<-48;x+=5)box(1.5,.04,.3,lime,x,.19,0);
const sceneLabels=[];
function label(text,x,y,z,size=2,color='#b8f268'){const c=document.createElement('canvas');c.width=1024;c.height=128;const ctx=c.getContext('2d');const texture=new THREE.CanvasTexture(c);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true}));s.userData.redraw=()=>{ctx.clearRect(0,0,1024,128);ctx.font='600 60px sans-serif';ctx.fillStyle=color;ctx.textAlign='center';ctx.fillText(t(text),512,88);texture.needsUpdate=true;};s.userData.redraw();sceneLabels.push(s);s.position.set(x,y,z);s.scale.set(size*8,size,1);scene.add(s);return s}

label('FLIGHT / 01',8,30,0,2);label('LANDING ZONE',-69,.3,-9,1.5);
// Ground markers distinguish the forecast, actual contact point, and safe target.
function groundMarker(color){const group=new THREE.Group();const material=new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide,depthTest:false,transparent:true,opacity:.9});const ring=new THREE.Mesh(new THREE.RingGeometry(2.4,2.5,64),material);ring.rotation.x=-Math.PI/2;group.add(ring);box(5,.015,.06,material,0,0,0,group);box(.06,.015,3,material,0,0,0,group);group.position.y=.23;group.visible=false;scene.add(group);return group}
const predictedMarker=groundMarker(0xffc66d),actualMarker=groundMarker(0x65e8ff);
const predictedLabel=label('预计触地点',0,1,0,.85,'#ffc66d');predictedLabel.visible=false;
const actualLabel=label('实际触地点',0,1,0,.85,'#65e8ff');actualLabel.visible=false;
box(44,.025,.1,lime,-68,.21,0);box(.1,.025,12,lime,-68,.21,0);
for(const edge of [-90,-46])box(.22,.025,12,lime,edge,.21,0);
label('中心 / TARGET',-68,1,-7,1);
const forecastLine=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]),new THREE.LineDashedMaterial({color:0xffc66d,dashSize:.7,gapSize:.5,transparent:true,opacity:.65}));scene.add(forecastLine);forecastLine.visible=false;
// Detailed procedural Roadster is kept separate from driving and collision state.
const makeCar=makeRoadster;
const car=makeCar();scene.add(car);for(const wheel of car.userData.wheels)wheel.userData.keepTransform=true;batchStaticMeshes(car);for(const wheel of car.userData.wheels)batchStaticMeshes(wheel);if(quality.low)car.traverse(o=>{if(o.isMesh){if(o.material.isMeshPhysicalMaterial)o.material.clearcoat=0;if(o.material.metalness!==undefined)o.material.metalness=Math.min(o.material.metalness,.2);}});
const collisionProbes=[-1.35,0,1.35].map(x=>new THREE.Vector3(x,.8,0));
function worldProbes(){car.updateMatrixWorld(true);return collisionProbes.map(p=>car.localToWorld(p.clone()));}
const parkedCars=new THREE.Group();parkedCars.name='parked-car';scene.add(parkedCars);
for(let i=0;i<5;i++){const c=makeCar([0x728896,0x353c45,0x9b9f9d,0x4e606a,0x879099][i],false);c.name='parked-car';c.position.set(-20-i*5,0,0);c.rotation.y=Math.PI/2;parkedCars.add(c)}
batchStaticMeshes(parkedCars);
for(let i=0;i<14;i++){const x=-100+i*20,z=i%2?30:-35;box(6,4,8,steel,x,2,z);box(5,.3,7,mat(0x44535e),x,4,z)}
let spotCount=0;
for(let x=-90;x<130;x+=35)for(const z of [-22,22]){box(.25,17,.25,steel,x,8.5,z);box(3,.4,.8,white,x,17,z);addLightPool(scene,x,z*.12,quality.low?.6:.35);if(spotCount<quality.spotLights&&z<0&&x%2===0){const spot=new THREE.SpotLight(0xc6e0ff,1800,65,.65,.8,1.5);spot.position.set(x,17,z);spot.target.position.set(x,0,0);scene.add(spot,spot.target);spotCount++;}}
batchStaticMeshes(scene,{directOnly:true});

const stars=new THREE.BufferGeometry(),sp=[];for(let i=0;i<900;i++)sp.push((Math.random()-.5)*700,90+Math.random()*200,(Math.random()-.5)*600);stars.setAttribute('position',new THREE.Float32BufferAttribute(sp,3));scene.add(new THREE.Points(stars,new THREE.PointsMaterial({color:0x8096ad,size:.35})));
// Exhaust particles are pooled, so repeated attempts do not grow scene memory.
const count=260,pdata=new Float32Array(count*3),particles=Array.from({length:count},()=>({life:0,v:new THREE.Vector3()}));const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(pdata,3));const exhaust=new THREE.Points(pg,new THREE.PointsMaterial({color:0xd3edff,size:.28,transparent:true,opacity:.6,depthWrite:false}));scene.add(exhaust);let cursor=0;
function emit(dt,power){for(let i=0;i<Math.ceil(power*dt*(mobile?45:100));i++){const n=cursor++%count,p=particles[n];const v=new THREE.Vector3((Math.random()-.5)*3,-4-Math.random()*7,(Math.random()-.5)*3).applyQuaternion(car.quaternion);p.v.copy(v);p.life=.5+Math.random()*.5;pdata[n*3]=car.position.x+(Math.random()-.5)*3;pdata[n*3+1]=car.position.y+.3;pdata[n*3+2]=car.position.z+(Math.random()-.5)*1.5}}
let rampProgress,touchdown;let hudElapsed=0;
const pauseButton=document.createElement('button');pauseButton.id='pause';pauseButton.className='secondary';pauseButton.textContent=t('Ⅱ 暂停 P');$('demo').before(pauseButton);
let paused=false;
const keys=new Set();let auto=true,state,time,speed,gas,x,y,z,angle,roll,pitch,vx,vy,turn,camMode=0,landTime=0,finished=false;
function reset(demo=true){clearTouch();lastReport=null;lastMessage=null;lastReason=null;document.body.dataset.mode=demo?'demo':'manual';paused=false;pauseButton.disabled=!demo;pauseButton.textContent=t('Ⅱ 暂停 P');pauseButton.setAttribute('aria-pressed','false');predictedMarker.visible=false;predictedLabel.visible=false;actualMarker.visible=false;actualLabel.visible=false;forecastLine.visible=false;touchdown=null;rampProgress={completed:false,failed:false};auto=demo;state='run';time=0;speed=0;gas=100;x=-83;y=0;z=-4;angle=0;roll=0;pitch=0;vx=0;vy=0;turn=0;landTime=0;finished=false;car.position.set(x,0,z);car.rotation.set(0,0,0);$('result').hidden=true;$('mode').textContent=t(auto?(watchOnly()?'自动演示 · 竖屏观看':'自动演示 · 驾驶按键接管'):'手动驾驶');$('play').textContent=t(auto?'接管驾驶 ↗':'重新挑战 ↗');if(typeof refreshOrientation==='function')refreshOrientation();}
function finish(ok){if(finished)return;finished=true;state=ok?'landed':'crashed';$('result').hidden=false;$('result').textContent=t(lastMessage=ok?`着陆成功 / TOUCHDOWN\n${auto?'自动演示完成':'任务完成 · '+Math.round(700+gas*3)+' 分'}\n按 R 重来，或接管驾驶`:'着陆失败 / TRY AGAIN\n保持吸附通过坡道，空中调整姿态\n按 R 立即重试');}
function showLandingReport(checks){lastReport=checks;
 const result=$('result');result.replaceChildren();
 const summary=document.createElement('p');const failed=checks.filter(c=>!c.ok);summary.textContent=t(failed.length?failed.map(c=>c.label+' · '+c.hint).join(' / '):'整车已在绿色区域内停稳');result.append(summary);const details=document.createElement('details');details.open=!matchMedia('(max-width: 900px), (pointer: coarse)').matches;const detailsTitle=document.createElement('summary');detailsTitle.textContent=t('查看全部检查数值');details.append(detailsTitle);result.append(details);
 const title=document.createElement('h2');title.textContent=t(checks.every(c=>c.ok)?'着陆成功 / TOUCHDOWN':'着陆失败 · 原因明细');result.append(title);
 for(const c of checks){const row=document.createElement('div');row.className='check '+(c.ok?'pass':'fail');const name=document.createElement('strong');name.textContent=t((c.ok?'✓ ':'✕ ')+c.label);const value=document.createElement('span');value.textContent=t(c.value);row.append(name,value);if(!c.ok){const hint=document.createElement('small');hint.textContent=t(c.hint);row.append(hint)}details.append(row)}
 const retry=document.createElement('p');retry.textContent=t('着陆检查记录 · R 重试 / 点击「重新挑战」');result.append(retry);
}
function update(dt){const previousProbes=worldProbes();time+=dt;let fan=false,thrust=false;
 if(state==='run'){speed=Math.max(0,Math.min(29,speed+((auto||keys.has('KeyW'))?8:-2)*dt-(keys.has('KeyS')?18*dt:0)));x+=speed*dt;if(!auto){z+=((keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0))*speed*.025*dt;z=THREE.MathUtils.clamp(z,-5,5)}if(x>=0){x=0;state='ramp';angle=0;if(speed<8)speed=8}}
 else if(state==='ramp'){fan=auto||keys.has('ShiftLeft')||keys.has('ShiftRight');speed=Math.max(9,speed-1.8*Math.sin(angle)*dt);angle+=speed/R*dt;updateRampProgress(rampProgress,angle,fan);({x,y}=rampPose(angle));if((!fan&&angle>.65)||angle>=Math.PI){angle=Math.min(angle,Math.PI);({x,y}=rampPose(angle));vx=speed*Math.cos(angle);vy=speed*Math.sin(angle)+2;state='air';landTime=time;pitch=angle;}}
 else if(state==='air'){thrust=gas>0&&(auto||keys.has('Space'));const elapsed=time-landTime;if(thrust){gas=Math.max(0,gas-dt*13);if(auto){vy+=dt*2}else{const acceleration=thrustAcceleration(pitch,roll);vx+=dt*acceleration.x;vy+=dt*acceleration.y}}vy-=9.81*dt;x+=vx*dt;y+=vy*dt;
 if(auto){const t=THREE.MathUtils.clamp(elapsed/2.5,0,1);pitch=Math.PI*(1-t);roll=Math.PI*2*(t*t*(3-2*t));}else{roll+=((keys.has('ArrowRight')?1:0)-(keys.has('ArrowLeft')?1:0))*2.5*dt;pitch+=((keys.has('ArrowUp')?1:0)-(keys.has('ArrowDown')?1:0))*2*dt;z+=((keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0))*3*dt;}
 if(y<=.16){y=.16;touchdown={pitch,roll,x,z,vy};actualMarker.position.set(x,.24,z);actualMarker.visible=true;actualLabel.position.set(x,1.5,z);actualLabel.visible=true;const checks=landingChecks(rampProgress,touchdown);if(!canLand(rampProgress,touchdown)){finish(false);showLandingReport(checks)}else{state='braking';pitch=0;roll=0;}}}

 else if(state==='braking'){({x,vx}=brakeStep(x,vx,dt));const bounds=footprint({pitch:0,roll:0,x,z});if(!bounds.insideX||!bounds.insideZ){finish(false);showLandingReport(landingChecks(rampProgress,{...touchdown,pitch:0,roll:0,x,z}));const reason=document.createElement('p');reason.textContent=t(lastReason='触地后滑出绿色区域：必须整车停稳在线内。');$('result').append(reason)}else if(Math.abs(vx)<.3){vx=0;finish(true);showLandingReport(landingChecks(rampProgress,{...touchdown,x,z}));}}
 else if(state==='landed'){if(auto&&time-landTime>7)reset(true)}
 car.position.set(x,y,z);car.rotation.set(roll,0,state==='ramp'?angle:state==='air'||state==='crashed'?pitch:0,'ZYX');
 if(!finished){const currentProbes=worldProbes();for(let i=0;i<currentProbes.length;i++){const hit=rampContact(previousProbes[i],currentProbes[i]);if(hit){const offset=currentProbes[i].clone().sub(car.position);car.position.set(hit.x-offset.x,hit.y-offset.y,hit.z-offset.z);x=car.position.x;y=car.position.y;z=car.position.z;pitch=state==='ramp'?angle:pitch;speed=0;vx=0;vy=0;finish(false);$('result').textContent=t(lastMessage='撞到坡道 / COLLISION\n车身已被坡道阻挡\n按 R 重试');break;}}}
 for(const wheel of car.userData.wheels)wheel.rotation.z-=(state==='run'||state==='ramp'?speed:state==='braking'?Math.abs(vx):0)*dt/.46;
 if(fan||thrust)emit(dt,thrust?2: .5);for(let i=0;i<count;i++){const p=particles[i];if(p.life>0){p.life-=dt;pdata[i*3]+=p.v.x*dt;pdata[i*3+1]+=p.v.y*dt;pdata[i*3+2]+=p.v.z*dt}else pdata[i*3+1]=-100}pg.attributes.position.needsUpdate=true;
 hudElapsed+=dt;if(hudElapsed>=.1){hudElapsed=0;
 $('speed').textContent=t(String(Math.round((state==='air'?Math.hypot(vx,vy):(state==='landed'||state==='braking')?Math.abs(vx):speed)*3.6)).padStart(3,'0'));$('alt').textContent=t(Math.max(0,y).toFixed(1));$('gas').textContent=t(Math.round(gas));$('gasbar').style.width=gas+'%';$('fan').textContent=t(fan?'ACTIVE / ON':'STANDBY');$('stage').textContent=t(({run:'01 / 加速进入坡道',ramp:'02 / 风扇吸附 · 倒挂',air:'03 / 冷气推进 · 翻转',braking:'04 / 制动中 · 停稳后判定',landed:'05 / 区域内停稳',crashed:'任务中断'})[state]);
 predictedMarker.visible=predictedLabel.visible=forecastLine.visible=state==='air';if(state==='air'){const hit=predictLanding({x,y,z,vx,vy,gas,pitch,roll,thrust,auto});predictedMarker.position.set(hit.x,.24,hit.z);predictedLabel.position.set(hit.x,1.6,hit.z);const points=forecastLine.geometry.attributes.position;points.setXYZ(0,x,y+1,z);points.setXYZ(1,hit.x,.24,hit.z);points.needsUpdate=true;forecastLine.geometry.computeBoundingSphere();forecastLine.computeLineDistances();}
 guidance.hidden=state!=='air';if(state==='air'){const checks=landingChecks(rampProgress,{pitch,roll,x,z,vy});const visibleChecks=(mobile||innerWidth<=900)?[checks.find(c=>!c.ok)||checks[5]]:checks;guidance.textContent=t('着陆检查 / 实时\n'+visibleChecks.map(c=>(c.ok?'✓ ':'! ')+c.label+' · '+c.value).join('\n'));}
 }
 updateCamera(dt);
}
function updateCamera(dt){
 if(posterMode==='ramp'){camera.fov=65;camera.updateProjectionMatrix();camera.position.set(-16,8,25);camera.lookAt(1,12.5,0);return;}
 const target=new THREE.Vector3(x,y+.8,z),desired=camMode===3?new THREE.Vector3(x+5.4,y+2.8,z+5.4):camMode===0?new THREE.Vector3(x-19,y+9,z+22):camMode===1?new THREE.Vector3(x+6,y+5,z+30):new THREE.Vector3(-48,40,65);camera.position.lerp(desired,1-Math.exp(-dt*3));camera.lookAt(target);
}
function togglePause(){if(!auto)return;paused=!paused;pauseButton.textContent=t(paused?'▶ 继续 P':'Ⅱ 暂停 P');pauseButton.setAttribute('aria-pressed',String(paused));$('mode').textContent=t(paused?'自动演示 · 已暂停':watchOnly()?'自动演示 · 竖屏观看':'自动演示 · 驾驶按键接管');}
pauseButton.onclick=togglePause;
window.addEventListener('keydown',e=>{if(e.target.closest?.('select,input,textarea'))return;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(watchOnly()&&drivingKeys.has(e.code))return;if(auto&&drivingKeys.has(e.code)){reset(false)}keys.add(e.code);if(e.code==='KeyP'&&!e.repeat)togglePause();if(e.code==='KeyR')reset(auto);if(e.code==='KeyC')camMode=(camMode+1)%4});window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>keys.clear());$('play').onclick=()=>{if(!watchOnly())reset(false)};$('demo').onclick=()=>reset(true);$('camera').onclick=()=>camMode=(camMode+1)%4;
clearTouch=initTouch({begin:()=>{if(!watchOnly()&&auto)reset(false)},press:code=>{if(watchOnly())return;if(auto)reset(false);keys.add(code);},release:code=>keys.delete(code),clear:()=>keys.clear()});
const orientationHint=$('orientation-hint');
function refreshOrientation(){const watch=watchOnly();$('mode').textContent=t(auto?(paused?'自动演示 · 已暂停':watch?'自动演示 · 竖屏观看':'自动演示 · 驾驶按键接管'):'手动驾驶');document.body.dataset.watchOnly=String(watch);orientationHint.hidden=!watch;$('play').disabled=watch;$('play').textContent=t(watch?'横屏后可驾驶':auto?'接管驾驶 ↗':'重新挑战 ↗');if(watch&&!auto)reset(true);}
$('dismiss-orientation').hidden=true;
window.addEventListener('languagechange',()=>{sceneLabels.forEach(s=>s.userData.redraw());pauseButton.textContent=t(paused?'▶ 继续 P':'Ⅱ 暂停 P');$('mode').textContent=t(auto?(paused?'自动演示 · 已暂停':watchOnly()?'自动演示 · 竖屏观看':'自动演示 · 驾驶按键接管'):'手动驾驶');$('play').textContent=t(auto?'接管驾驶 ↗':'重新挑战 ↗');$('stage').textContent=t(({run:'01 / 加速进入坡道',ramp:'02 / 风扇吸附 · 倒挂',air:'03 / 冷气推进 · 翻转',braking:'04 / 制动中 · 停稳后判定',landed:'05 / 区域内停稳',crashed:'任务中断'})[state]);if(lastReport){showLandingReport(lastReport);if(lastReason){const reason=document.createElement('p');reason.textContent=t(lastReason);$('result').append(reason)}}else if(lastMessage&&!$('result').hidden){$('result').textContent=t(lastMessage)}refreshOrientation();});
window.addEventListener('resize',()=>{refreshOrientation();renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()});reset(true);camera.position.set(-95,9,22);if(new URLSearchParams(location.search).has('poster')){reset(false);camMode=3;if(new URLSearchParams(location.search).get('poster')==='ramp'){x=-8;z=8;scene.children.forEach(item=>{if(item.isSprite||item.name==='parked-car')item.visible=false;});}document.getElementById('hud').hidden=true;}const recorder=createRecorder({renderer,language,restart:()=>{reset(true);camMode=0;camera.position.set(-102,9,22);},getState:()=>({state,y,gas,speed:(state==='air'?Math.hypot(vx,vy):(state==='landed'||state==='braking')?Math.abs(vx):speed)*3.6})});const clock=new THREE.Clock();renderer.setAnimationLoop(()=>{let dt=Math.min(clock.getDelta(),.05);if(document.hidden)return;if(!paused)update(recorder.active?dt*.72:dt);else updateCamera(dt);renderer.render(scene,camera);recorder.frame();samplePerformance()});
