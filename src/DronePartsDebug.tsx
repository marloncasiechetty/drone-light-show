import * as THREE from 'three'
import { useState } from 'react'
import { Canvas, type ThreeEvent } from '@react-three/fiber'
import { useGLTF, OrbitControls, Html } from '@react-three/drei'
import type { GLTF } from 'three-stdlib'

type GLTFResult = GLTF & { nodes: Record<string, THREE.Mesh> }

type Part = {
  name: string
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number | [number, number, number]
}

// mirrors the transforms in Drone.tsx so every part sits where it does on the real model
const PARTS: Part[] = [
  { name: 'Object_4' },
  { name: 'Object_6', position: [1.621, 0.109, 0], scale: [0.205, 0.205, 0.466] },

  { name: 'Object_8', position: [0.61, 0.373, -1.096], rotation: [0, -0.637, 0], scale: 0.252 },
  { name: 'Object_10', position: [1.771, 0.644, -2.666], rotation: [0, -0.637, 0], scale: 0.161 },
  { name: 'Object_12', position: [1.771, 0.829, -2.666], rotation: [Math.PI, -1.053, Math.PI], scale: 0.056 },
  { name: 'Object_32', position: [1.872, 0.84, -2.608], rotation: [Math.PI, -1.053, Math.PI], scale: 0.139 },

  { name: 'Object_14', position: [0.61, 0.373, 1.072], rotation: [Math.PI, -0.637, Math.PI], scale: [-0.252, 0.252, 0.252] },
  { name: 'Object_16', position: [1.771, 0.644, 2.642], rotation: [Math.PI, -0.637, Math.PI], scale: [-0.161, 0.161, 0.161] },
  { name: 'Object_18', position: [1.771, 0.829, 2.642], rotation: [0, -0.513, 0], scale: [-0.056, 0.056, 0.056] },
  { name: 'Object_34', position: [1.828, 0.84, 2.54], rotation: [0, -0.513, 0], scale: [-0.139, 0.139, 0.139] },

  { name: 'Object_20', position: [-1.329, 0.373, -1.096], rotation: [0, 0.637, 0], scale: [-0.252, 0.252, 0.252] },
  { name: 'Object_22', position: [-2.49, 0.644, -2.666], rotation: [0, 0.637, 0], scale: [-0.161, 0.161, 0.161] },
  { name: 'Object_24', position: [-2.49, 0.829, -2.666], rotation: [Math.PI, 0.003, -Math.PI], scale: [-0.056, 0.056, 0.056] },
  { name: 'Object_36', position: [-2.49, 0.84, -2.549], rotation: [Math.PI, 0.003, -Math.PI], scale: [-0.139, 0.139, 0.139] },

  { name: 'Object_26', position: [-1.329, 0.373, 1.072], rotation: [-Math.PI, 0.637, -Math.PI], scale: 0.252 },
  { name: 'Object_28', position: [-2.49, 0.644, 2.642], rotation: [-Math.PI, 0.637, -Math.PI], scale: 0.161 },
  { name: 'Object_30', position: [-2.49, 0.829, 2.642], rotation: [0, 0.393, 0], scale: 0.056 },
  { name: 'Object_38', position: [-2.535, 0.84, 2.534], rotation: [0, 0.393, 0], scale: 0.139 },
]

function Part({
  part,
  selected,
  hovered,
  onSelect,
  onHover,
}: {
  part: Part
  selected: boolean
  hovered: boolean
  onSelect: (name: string) => void
  onHover: (name: string | null) => void
}) {
  const { nodes } = useGLTF('/models/drone.glb') as unknown as GLTFResult
  return (
    <mesh
      geometry={nodes[part.name].geometry}
      position={part.position}
      rotation={part.rotation}
      scale={part.scale}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation()
        onSelect(part.name)
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        onHover(part.name)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        onHover(null)
        document.body.style.cursor = 'auto'
      }}
    >
      <meshStandardMaterial
        color={selected ? '#ff3366' : hovered ? '#ffcc00' : '#888888'}
        emissive={selected ? '#ff3366' : hovered ? '#ffcc00' : '#000000'}
        emissiveIntensity={selected || hovered ? 0.6 : 0}
      />
      {selected && (
        <Html center distanceFactor={4} occlude={false}>
          <div
            style={{
              background: 'rgba(0,0,0,0.85)',
              color: '#fff',
              padding: '2px 6px',
              fontSize: 11,
              fontFamily: 'monospace',
              borderRadius: 3,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            {part.name}
          </div>
        </Html>
      )}
    </mesh>
  )
}

export function DronePartsDebug({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Canvas camera={{ position: [0, 1.5, 6], fov: 42 }} style={{ position: 'absolute', inset: 0 }}>
        <color attach="background" args={['#111']} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[3, 4, 3]} intensity={1} />
        <group rotation={[0, Math.PI / 2, 0]}>
          <group position={[0.284, 0.705, 0]} scale={0.5}>
            {PARTS.map((part) => (
              <Part
                key={part.name}
                part={part}
                selected={selected === part.name}
                hovered={hovered === part.name}
                onSelect={setSelected}
                onHover={setHovered}
              />
            ))}
          </group>
        </group>
        <OrbitControls />
      </Canvas>

      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          background: 'rgba(0,0,0,0.8)',
          color: '#fff',
          padding: '12px 16px',
          borderRadius: 8,
          fontFamily: 'monospace',
          fontSize: 13,
          maxWidth: 260,
        }}
      >
        <div style={{ marginBottom: 8, fontWeight: 'bold' }}>Click a part to select it</div>
        <div>
          Hovered: <span style={{ color: '#ffcc00' }}>{hovered ?? '—'}</span>
        </div>
        <div>
          Selected: <span style={{ color: '#ff3366' }}>{selected ?? '—'}</span>
        </div>
        <button
          onClick={onClose}
          style={{
            marginTop: 12,
            padding: '4px 10px',
            background: '#333',
            color: '#fff',
            border: '1px solid #555',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Back to landing page
        </button>
      </div>
    </div>
  )
}

useGLTF.preload('/models/drone.glb')
