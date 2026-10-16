import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

export function renderProfile({coarse=false,width=1280,ratio=1,override}={}){
 const low=override==='low'||(override!=='high'&&(coarse||width<=900));
 return {low,pixelRatio:Math.min(ratio,low?1:1.5),shadows:!low,antialias:!low,spotLights:low?0:4};
}

// Merge only non-textured, static mesh geometry. Animated wheel groups stay live.
export function batchStaticMeshes(root,{directOnly=false}={}){
 root.updateMatrixWorld(true);
 const inverse=new THREE.Matrix4().copy(root.matrixWorld).invert(),groups=new Map();
 root.traverse(o=>{
  if(!o.isMesh||Array.isArray(o.material)||o.material.map||o.material.transparent)return;
  if(directOnly&&o.parent!==root)return;
  for(let p=o.parent;p&&p!==root;p=p.parent)if(p.userData.keepTransform)return;
  let list=groups.get(o.material);if(!list)groups.set(o.material,list=[]);list.push(o);
 });
 for(const [material,objects] of groups){
  if(objects.length<2)continue;
  const geometries=objects.map(o=>{
   const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();
   for(const name of Object.keys(g.attributes))if(!['position','normal'].includes(name))g.deleteAttribute(name);
   return g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld));
  });
  const geometry=mergeGeometries(geometries,false);geometries.forEach(g=>g.dispose());
  if(!geometry)continue;
  const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=objects.some(o=>o.castShadow);mesh.receiveShadow=objects.some(o=>o.receiveShadow);root.add(mesh);
  for(const o of objects){o.removeFromParent();o.geometry.dispose();}
 }
}

const pools=new WeakMap();
export function addLightPool(scene,x,z,opacity=.35){
 let pool=pools.get(scene);
 if(!pool){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
  const context=canvas.getContext('2d'),gradient=context.createRadialGradient(32,32,0,32,32,32);gradient.addColorStop(0,'#ffffff');gradient.addColorStop(1,'#ffffff00');context.fillStyle=gradient;context.fillRect(0,0,64,64);
  const material=new THREE.MeshBasicMaterial({color:0xbed8f2,map:new THREE.CanvasTexture(canvas),transparent:true,opacity,depthWrite:false});pool=new THREE.InstancedMesh(new THREE.PlaneGeometry(2,2),material,32);pool.count=0;scene.add(pool);pools.set(scene,pool);
 }
 const transform=new THREE.Object3D();transform.rotation.x=-Math.PI/2;transform.scale.set(10,6,1);transform.position.set(x,.085,z);transform.updateMatrix();pool.setMatrixAt(pool.count++,transform.matrix);pool.instanceMatrix.needsUpdate=true;pool.computeBoundingSphere();
}
