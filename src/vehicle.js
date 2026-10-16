import * as THREE from 'three';

// Procedural, game-scale interpretation of the white 2026 reveal prototype.
// +X forward; wheelbase and outer extents fit the existing challenge envelope.
export function makeRoadster(color=0xe7e9e8,detailed=true){
 const car=new THREE.Group();
 const paint=new THREE.MeshPhysicalMaterial({color,metalness:.42,roughness:.24,clearcoat:1,clearcoatRoughness:.15});
 const glass=new THREE.MeshPhysicalMaterial({color:0x081a26,metalness:.55,roughness:.13,clearcoat:1});
 const carbon=new THREE.MeshStandardMaterial({color:0x10171c,metalness:.55,roughness:.45});
 const rubber=new THREE.MeshStandardMaterial({color:0x090b0d,roughness:.88});
 const alloy=new THREE.MeshStandardMaterial({color:0x71818d,metalness:.9,roughness:.24});
 const lamp=new THREE.MeshBasicMaterial({color:0xdceeff});
 const red=new THREE.MeshBasicMaterial({color:0xff2638});
 function mesh(geo,material,parent=car){const m=new THREE.Mesh(geo,material);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 function block(w,h,d,material,x,y,z,parent=car){const m=mesh(new THREE.BoxGeometry(w,h,d),material,parent);m.position.set(x,y,z);return m;}
 function line(points,material,radius=.015,parent=car){return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),points.length*5,radius,5,false),material,parent);}
 function loft(sections,material){const vertices=[],indices=[],n=sections[0].points.length;
  for(const section of sections)for(const [z,y] of section.points)vertices.push(section.x,y,z);
  for(let i=0;i<sections.length-1;i++)for(let j=0;j<n;j++){const a=i*n+j,b=i*n+(j+1)%n,c=a+n,d=b+n;indices.push(a,b,c,b,d,c)}
  for(const i of [0,sections.length-1])for(let j=1;j<n-1;j++){const a=i*n;indices.push(...(i===0?[a,a+j+1,a+j]:[a,a+j,a+j+1]))}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return mesh(g,material);
 }
 // Body panels rise around the wheel arches instead of passing through tyres.
 const stations=[-2.25,-2.1,-1.9,-1.75,-1.6,-1.45,-1.3,-1.15,-1,-.85,-.65,-.3,0,.3,.65,.85,1,1.15,1.3,1.45,1.6,1.75,1.9,2.1,2.25];
 loft(stations.map(x=>{
  const w=1.025-.23*Math.pow(Math.abs(x)/2.25,4);
  const top=x>0?.83-.25*Math.pow(x/2.25,2):.86-.12*Math.pow(x/2.25,3);
  const nearest=Math.min(Math.abs(x-1.35),Math.abs(x+1.35));
  const arch=nearest<.54?.46+Math.sqrt(.54**2-nearest**2):.32;
  const shoulder=Math.max(top+.035,arch+.035);
  return {x,points:[[0,top],[w*.73,shoulder],[w,shoulder-.035],[w,Math.max(.29,arch)],[w*.7,.27],[-w*.7,.27],[-w,Math.max(.29,arch)],[-w,shoulder-.035],[-w*.73,shoulder]]};
 }),paint);
 block(3.9,.09,1.65,carbon,0,.25,0);
 // Swept windscreen, low roof, tapering rear glass form one continuous canopy.
 const canopy=[[-1.44,.58,.87],[-.83,.66,1.2],[-.48,.66,1.27],[.05,.62,1.24],[.82,.75,.84]];
 loft(canopy.map(([x,w,y])=>({x,points:[[-w,.8],[-w,y-.13],[-w*.72,y],[w*.72,y],[w,y-.13],[w,.8]]})),glass);
 if(!detailed){
  for(const x of [-1.35,1.35])for(const side of [-1,1]){
   const tyre=mesh(new THREE.CylinderGeometry(.46,.46,.28,16),rubber);tyre.rotation.x=Math.PI/2;tyre.position.set(x,.46,side*.94);
   const hub=mesh(new THREE.CylinderGeometry(.31,.31,.29,12),alloy);hub.rotation.x=Math.PI/2;hub.position.copy(tyre.position);
  }
  block(.04,.035,1.6,lamp,2.24,.59,0);block(.04,.035,1.6,red,-2.25,.78,0);
  block(.3,.055,2.08,carbon,-1.98,1.15,0);
  return car;
 }
 // Roof cap and thin structural rails leave the windshield visibly sloped.
 loft([[-.82,.49,1.205],[-.48,.49,1.282],[.04,.46,1.252]].map(([x,w,y])=>({x,points:[[-w,y-.045],[-w,y],[w,y],[w,y-.045]]})),carbon);
 for(const side of [-1,1]){
  line([[-1.46,.87,side*.59],[-.83,1.08,side*.66],[-.48,1.15,side*.66],[.05,1.12,side*.62],[.82,.84,side*.75]],paint,.024);
  // Front LED blades wrap onto the fenders, rather than one rectangular headlight.
  line([[2.17,.594,side*.2],[2.15,.61,side*.62],[1.91,.72,side*.84]],lamp,.023);
  line([[-2.245,.77,side*.05],[-2.19,.78,side*.68],[-2.02,.82,side*.85]],red,.018);
  line([[-.9,.71,side*1.026],[.35,.69,side*1.026],[.8,.75,side*.99]],carbon,.01);
  block(.2,.025,.026,alloy,-.34,.78,side*1.025);
  // Side intake and lower sill.
  const intake=block(.48,.16,.035,carbon,-.67,.48,side*1.01);intake.rotation.z=-.17;
  block(1.7,.08,.075,carbon,0,.3,side*1.015);
  const mirror=block(.24,.085,.15,paint,.52,.9,side*1.05);mirror.rotation.y=side*.2;
  block(.14,.04,.07,carbon,.48,.86,side*1.005);
 }
 // Front splitter, dark lower fascia and rear diffuser.
 block(.2,.065,1.85,carbon,2.14,.27,0);
 block(.03,.12,1.3,carbon,2.25,.41,0);
 block(.15,.17,1.58,carbon,-2.2,.35,0);
 for(const z of [-.65,-.32,0,.32,.65])block(.5,.15,.025,carbon,-2.02,.25,z);
 // Active rear wing, with sculpted tapered cross-section and end plates.
 for(const z of [-.57,.57]){const support=block(.08,.28,.045,carbon,-1.85,1.02,z);support.rotation.z=-.22;}
 loft([{x:-2.16,points:[[-1.04,1.15],[-1.04,1.19],[1.04,1.19],[1.04,1.15]]},{x:-1.78,points:[[-1.04,1.12],[-1.04,1.17],[1.04,1.17],[1.04,1.12]]}],carbon);
 for(const z of [-1.045,1.045])block(.42,.14,.025,carbon,-1.97,1.2,z);
 // Four recessed cold-gas nozzles below the continuous rear light signature.
 for(const z of [-.64,-.22,.22,.64]){
  const outer=mesh(new THREE.CylinderGeometry(.105,.12,.12,16),alloy);outer.rotation.z=Math.PI/2;outer.position.set(-2.2,.55,z);
  const bore=mesh(new THREE.CylinderGeometry(.077,.077,.125,16),carbon);bore.rotation.z=Math.PI/2;bore.position.set(-2.22,.55,z);
 }
 car.userData.wheels=[];
 for(const x of [-1.35,1.35])for(const side of [-1,1]){
  const wheel=new THREE.Group();wheel.position.set(x,.46,side*.94);car.add(wheel);
  const tyre=mesh(new THREE.CylinderGeometry(.46,.46,.28,32),rubber,wheel);tyre.rotation.x=Math.PI/2;
  const disk=mesh(new THREE.CylinderGeometry(.34,.34,.285,32),carbon,wheel);disk.rotation.x=Math.PI/2;
  const rotor=mesh(new THREE.CylinderGeometry(.26,.26,.29,24),alloy,wheel);rotor.rotation.x=Math.PI/2;
  const caliper=block(.1,.24,.065,new THREE.MeshStandardMaterial({color:0xb92524,metalness:.4,roughness:.4}),.19,0,side*.155,wheel);
  const spokes=new THREE.Group();spokes.position.z=side*.157;wheel.add(spokes);
  for(let i=0;i<5;i++){
   const a=i*Math.PI*2/5;
   for(const offset of [-.045,.045]){const spoke=block(.055,.27,.035,alloy,Math.sin(a+offset)*.18,Math.cos(a+offset)*.18,0,spokes);spoke.rotation.z=-a-offset;}
  }
  const hub=mesh(new THREE.CylinderGeometry(.085,.085,.035,16),alloy,spokes);hub.rotation.x=Math.PI/2;hub.position.z=side*.015;
  const rim=mesh(new THREE.TorusGeometry(.35,.018,6,32),alloy,wheel);rim.position.z=side*.15;
  car.userData.wheels.push(spokes);
 }
 return car;
}
