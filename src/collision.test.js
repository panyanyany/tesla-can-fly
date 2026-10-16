import {test} from 'node:test';
import assert from 'node:assert/strict';
import {rampPose,rampDistance,rampContact,RAMP_RADIUS as R} from './collision.js';

test('high-speed motion cannot cross the concrete ramp',()=>{
  assert.ok(rampContact({x:8,y:13,z:0},{x:18,y:13,z:0}));
});
test('inward departure and flight beyond the ramp width stay clear',()=>{
  assert.equal(rampContact({x:0,y:24.5,z:0},{x:-4,y:24,z:0}),null);
  assert.equal(rampContact({x:8,y:13,z:9},{x:18,y:13,z:9}),null);
});
test('all four tyres remain on the open side of the curved surface',()=>{
  for(let a=0;a<=Math.PI;a+=.01){const p=rampPose(a);
    for(const axle of [-1.35,1.35]){
      const x=p.x+axle*Math.cos(a)-.46*Math.sin(a);
      const y=p.y+axle*Math.sin(a)+.46*Math.cos(a);
      assert.ok(Math.hypot(x,y-R)+.46<=R+.001);
    }
  }
});
test('ramp lips are solid but its empty interior is traversable',()=>{
  assert.ok(rampDistance(0,26,0)<.001);
  assert.ok(rampDistance(3,13,0)>9);
});
