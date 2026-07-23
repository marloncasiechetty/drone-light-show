import * as THREE from 'three'

// shared mutable point the whole swarm reads every frame to glow within a radius of the cursor
export const pointerWorld = new THREE.Vector3(9999, 9999, 0)
