// Wheelbase clearance keeps the straight chassis inside the curved surface.
export const RAMP_RADIUS = 13;
export const RAMP_CLEARANCE = .16;
export function rampPose(angle) {
  return { x: (RAMP_RADIUS-RAMP_CLEARANCE)*Math.sin(angle),
    y: RAMP_RADIUS-(RAMP_RADIUS-RAMP_CLEARANCE)*Math.cos(angle) };
}

// Minimum distance to the finite semicircular ramp, including both lips.
export function rampDistance(x,y,z) {
  const a=Math.max(0,Math.min(Math.PI,Math.atan2(x,RAMP_RADIUS-y)));
  return Math.hypot(x-RAMP_RADIUS*Math.sin(a),
    y-RAMP_RADIUS*(1-Math.cos(a)),Math.max(0,Math.abs(z)-6));
}

export function rampContact(previous,current) {
  const distance=Math.hypot(current.x-previous.x,current.y-previous.y,current.z-previous.z);
  const steps=Math.max(1,Math.ceil(distance/.08));
  for(let i=1;i<=steps;i++) {
    const t=i/steps;
    const p={x:previous.x+(current.x-previous.x)*t,y:previous.y+(current.y-previous.y)*t,z:previous.z+(current.z-previous.z)*t};
    if(rampDistance(p.x,p.y,p.z)<.72) return p;
  }
  return null;
}
