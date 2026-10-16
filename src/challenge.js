export function updateRampProgress(progress, angle, fan) {
  if (angle > .65 && !fan) progress.failed = true;
  if (angle >= Math.PI && fan && !progress.failed) progress.completed = true;
  return progress;
}

export function canLand(progress, {pitch, roll, x, z, vy}) {
  return landingChecks(progress, {pitch,roll,x,z,vy}).every(c=>c.ok);
}

const degrees=a=>Math.abs(Math.atan2(Math.sin(a),Math.cos(a)))*180/Math.PI;
export const LANDING_ZONE={centerX:-68,width:44,depth:12};
export function footprint({pitch=0,roll=0,x,z}) {
  const halfX=Math.abs(Math.cos(pitch))*2.3+Math.abs(Math.sin(pitch))*(Math.abs(Math.cos(roll))*.75+Math.abs(Math.sin(roll))*1.15);
  const halfZ=Math.abs(Math.sin(roll))*.75+Math.abs(Math.cos(roll))*1.15;
  return {insideX:x-halfX>=-90&&x+halfX<=-46,insideZ:Math.abs(z)+halfZ<=6,halfX,halfZ};
}
export function brakeStep(x,vx,dt) {
  const decay=Math.exp(-4*dt);
  return {x:x+vx*(1-decay)/4,vx:vx*decay};
}
export function predictLanding({x,y,z,vx,vy,gas,pitch,roll,thrust,auto=false}) {
  const dt=1/120;
  for(let t=0;t<15&&y>.16;t+=dt){
    const force=thrust&&gas>0?(auto?{x:0,y:2}:thrustAcceleration(pitch,roll)):{x:0,y:0};
    vx+=force.x*dt;vy+=(force.y-9.81)*dt;x+=vx*dt;y+=vy*dt;
    if(thrust)gas-=13*dt;
  }
  return {x,z};
}
export function landingChecks(progress,{pitch,roll,x,z,vy}) {
  const limit=(Math.acos(.8)*180/Math.PI).toFixed(1);
  const bounds=footprint({pitch,roll,x,z});
  return [
    {ok:progress.completed&&!progress.failed,label:'坡道吸附',value:progress.failed?'倒挂段曾松开吸附':progress.completed?'完整通过':'尚未完整通过',hint:'按住 Shift 通过整个倒挂段'},
    {ok:Math.cos(pitch)>.8,label:'俯仰偏差',value:`${degrees(pitch).toFixed(1)}° / 需 < ${limit}°`,hint:'用 ↑ ↓ 调整车头'},
    {ok:Math.cos(roll)>.8,label:'翻滚偏差',value:`${degrees(roll).toFixed(1)}° / 需 < ${limit}°`,hint:'用 ← → 把车轮转向地面'},
    {ok:bounds.insideX,label:'前后落点',value:`车身范围 ${(x-bounds.halfX).toFixed(1)} ～ ${(x+bounds.halfX).toFixed(1)} m / 绿区 −90 ～ −46 m`,hint:x>-68?'落得太早，需要飞得更远':'车身超出绿区远端，减少滞空时间'},
    {ok:bounds.insideZ,label:'左右落点',value:`车身最外侧距中心 ${(Math.abs(z)+bounds.halfZ).toFixed(1)} m / 需 ≤ 6 m`,hint:'用 A D 对准着陆区，整车需在线内'},
    {ok:Math.abs(vy)<28,label:'垂直速度',value:`${Math.abs(vy).toFixed(1)} m/s / 需 < 28 m/s`,hint:'先调正车身，再点按空格减缓下降'},
  ];
}

export function thrustAcceleration(pitch, roll, force=15) {
  return {x:-Math.sin(pitch)*Math.cos(roll)*force, y:Math.cos(pitch)*Math.cos(roll)*force};
}

export const drivingKeys = new Set(['KeyW','KeyS','KeyA','KeyD','ShiftLeft','ShiftRight','Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight']);
