import {test} from 'node:test';
import assert from 'node:assert/strict';
import {updateRampProgress,canLand,landingChecks,thrustAcceleration,drivingKeys,footprint,brakeStep,predictLanding} from './challenge.js';
import {rampPose} from './collision.js';
const landing={pitch:0,roll:0,x:-70,z:0,vy:-10};
test('automatic demonstration touches down and stops wholly inside green zone',()=>{
 for(const dt of [1/30,1/60,1/144]){
  let speed=29,angle=0;
  while(angle<Math.PI){speed=Math.max(9,speed-1.8*Math.sin(angle)*dt);angle+=speed/13*dt}
  let {x,y}=rampPose(Math.PI),vx=-speed,vy=2,elapsed=0;
  while(y>.16){elapsed+=dt;vy+=(2-9.81)*dt;x+=vx*dt;y+=vy*dt}
  const t=Math.min(elapsed/2.5,1),pitch=Math.PI*(1-t),roll=2*Math.PI*t*t*(3-2*t);
  assert.ok(canLand({completed:true,failed:false},{x,z:-4,vy,pitch,roll}));
  while(Math.abs(vx)>=.3){({x,vx}=brakeStep(x,vx,dt));assert.ok(footprint({x,z:-4}).insideX)}
 }
});
test('landing marker projects ballistic touchdown rather than current ground position',()=>{
  const hit=predictLanding({x:0,y:20,z:3,vx:-10,vy:0,gas:0,pitch:0,roll:0,thrust:false});
  assert.ok(Math.abs(hit.x+20.1)<.2);
  assert.equal(hit.z,3);
});
test('whole vehicle must fit the visible green rectangle',()=>{
  assert.equal(footprint({...landing,x:-89}).insideX,false);
  assert.equal(footprint({...landing,x:-47}).insideX,false);
  assert.equal(footprint({...landing,z:5}).insideZ,false);
  assert.equal(footprint(landing).insideX,true);
});
test('a valid touchdown can slide outside and must fail the final check',()=>{
  let p={x:-86,vx:-20};
  assert.equal(footprint({...landing,...p}).insideX,true);
  for(let i=0;i<180;i++)p=brakeStep(p.x,p.vx,1/60);
  assert.equal(footprint({...landing,...p}).insideX,false);
});
test('braking distance is independent of frame rate',()=>{
  const a=brakeStep(-75,-25,1);let b={x:-75,vx:-25};
  for(let i=0;i<60;i++)b=brakeStep(b.x,b.vx,1/60);
  assert.ok(Math.abs(a.x-b.x)<1e-9);
});
test('report identifies every failure and normalizes full rotations',()=>{
  const checks=landingChecks({completed:true,failed:false},{...landing,pitch:Math.PI*2,roll:Math.PI,x:-20,vy:-30});
  assert.deepEqual(checks.filter(c=>!c.ok).map(c=>c.label),['翻滚偏差','前后落点','垂直速度']);
  assert.ok(checks[1].value.startsWith('0.0°'));
  assert.equal(checks.every(c=>c.ok),canLand({completed:true,failed:false},{...landing,pitch:Math.PI*2,roll:Math.PI,x:-20,vy:-30}));
});
test('space-only flight cannot qualify even at a perfect landing',()=>{
  const p={completed:false,failed:false};
  for(let a=0;a<=Math.PI+.01;a+=.01)updateRampProgress(p,a,false);
  assert.equal(canLand(p,landing),false);
});
test('releasing suction during the inverted section invalidates the attempt',()=>{
  const p={completed:false,failed:false};
  updateRampProgress(p,2,false);updateRampProgress(p,Math.PI,true);
  assert.equal(canLand(p,landing),false);
});
test('continuous suction and a controlled landing qualify',()=>{
  const p={completed:false,failed:false};
  for(let a=0;a<Math.PI;a+=.01)updateRampProgress(p,a,true);
  updateRampProgress(p,Math.PI,true);
  assert.equal(canLand(p,landing),true);
  assert.equal(canLand(p,{...landing,roll:Math.PI}),false);
});
test('thrust follows car attitude; inverted thrust cannot lift the car',()=>{
  assert.equal(thrustAcceleration(0,0).y,15);
  assert.equal(thrustAcceleration(Math.PI,0).y,-15);
  assert.ok(Math.abs(thrustAcceleration(Math.PI/2,0).y)<1e-10);
  assert.ok(drivingKeys.has('Space'));
});
