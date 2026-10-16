import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {renderProfile,batchStaticMeshes} from './rendering.js';
test('phones default to bounded pixel count and no per-frame shadows or spot lights',()=>{
 const p=renderProfile({coarse:true,width:1200,ratio:3});
 assert.equal(p.pixelRatio,1);assert.equal(p.shadows,false);assert.equal(p.spotLights,0);
 assert.equal(renderProfile({width:390,ratio:3}).low,true);
});
test('batching combines static meshes while keeping spinning wheels independent',()=>{
 const root=new THREE.Group(),material=new THREE.MeshStandardMaterial();
 for(const x of [0,2,4]){const m=new THREE.Mesh(new THREE.BoxGeometry(),material);m.position.x=x;root.add(m)}
 const wheel=new THREE.Group();wheel.userData.keepTransform=true;const spoke=new THREE.Mesh(new THREE.BoxGeometry(),material);wheel.add(spoke);root.add(wheel);
 batchStaticMeshes(root);
 assert.equal(root.children.filter(o=>o.isMesh).length,1);assert.equal(spoke.parent,wheel);
 const bounds=new THREE.Box3().setFromObject(root);assert.equal(bounds.max.x,4.5);
});
