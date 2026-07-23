import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing'
import { DroneSwarm } from './DroneSwarm'
import { REDUCED_MOTION } from './swarmFormations'
import { pointerWorld } from './pointerWorld'

// one canvas-baked sky: smooth gradient with a soft horizon haze plus static stars of varied
// size, brightness and tint — reads as a photograph of a night sky rather than a particle effect
function makeSkyTexture() {
  const c = document.createElement('canvas')
  c.width = 2048
  c.height = 1024
  const ctx = c.getContext('2d')!

  const g = ctx.createLinearGradient(0, 0, 0, c.height)
  g.addColorStop(0, '#010208')
  g.addColorStop(0.34, '#050817')
  g.addColorStop(0.47, '#0b1128')
  g.addColorStop(0.52, '#131b38')
  g.addColorStop(0.56, '#0a0f22')
  g.addColorStop(0.66, '#03040c')
  g.addColorStop(1, '#000004')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, c.width, c.height)

  let seed = 9
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647

  // faint stars — heavy size bias toward tiny, density thinning near the horizon haze
  for (let i = 0; i < 900; i++) {
    const x = rand() * c.width
    const y = Math.pow(rand(), 1.35) * c.height * 0.48
    const r = Math.pow(rand(), 4) * 1.6 + 0.3
    const fade = 1 - y / (c.height * 0.52)
    const a = (0.08 + rand() * 0.5) * Math.max(fade, 0.15)
    const warm = rand()
    ctx.fillStyle = warm > 0.85 ? `rgba(255,236,210,${a})` : warm > 0.7 ? `rgba(205,220,255,${a})` : `rgba(235,240,252,${a})`
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  // a handful of brighter stars with a soft halo
  for (let i = 0; i < 12; i++) {
    const x = rand() * c.width
    const y = Math.pow(rand(), 1.5) * c.height * 0.4
    const halo = ctx.createRadialGradient(x, y, 0, x, y, 7)
    halo.addColorStop(0, 'rgba(240,245,255,0.9)')
    halo.addColorStop(0.25, 'rgba(220,230,255,0.25)')
    halo.addColorStop(1, 'rgba(220,230,255,0)')
    ctx.fillStyle = halo
    ctx.beginPath()
    ctx.arc(x, y, 7, 0, Math.PI * 2)
    ctx.fill()
  }

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function Backdrop() {
  const texture = useMemo(() => makeSkyTexture(), [])
  return (
    <mesh scale={60}>
      <sphereGeometry args={[1, 48, 48]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} depthWrite={false} fog={false} />
    </mesh>
  )
}

// jagged silhouette against the horizon glow — gives the show somewhere to be flying over
function Ridge() {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(-60, -3)
    let seed = 7
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647
    for (let x = -60; x <= 60; x += 5) shape.lineTo(x, 0.4 + rand() * 2.4)
    shape.lineTo(60, -3)
    shape.closePath()
    return new THREE.ShapeGeometry(shape)
  }, [])
  return (
    <mesh geometry={geometry} position={[0, -1.2, -14]}>
      <meshBasicMaterial color="#060818" fog={false} />
    </mesh>
  )
}

function Ground() {
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={-1.2}>
      <circleGeometry args={[60, 48]} />
      <meshBasicMaterial color="#030408" />
    </mesh>
  )
}

// projects the cursor onto a plane through the swarm so every nearby light (not just one under the pointer) flares
function PointerTracker() {
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), [])
  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  const moved = useRef(false)

  useEffect(() => {
    const onMove = () => {
      moved.current = true
    }
    window.addEventListener('pointermove', onMove, { once: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  useFrame((state) => {
    if (!moved.current) return
    raycaster.setFromCamera(state.pointer, state.camera)
    raycaster.ray.intersectPlane(plane, pointerWorld)
  })
  return null
}

function CameraRig() {
  useFrame((state) => {
    const targetX = state.pointer.x * 1.6
    const targetY = 3 - state.pointer.y * 1
    state.camera.position.x += (targetX - state.camera.position.x) * 0.03
    state.camera.position.y += (targetY - state.camera.position.y) * 0.03
    state.camera.lookAt(0, 3.2, 0)
  })
  return null
}

export default function Scene() {
  return (
    <Canvas camera={{ position: [0, 3, 16], fov: 50 }} style={{ position: 'absolute', inset: 0 }}>
      <fog attach="fog" args={['#05050f', 16, 34]} />
      <Backdrop />
      <Ridge />
      <Ground />
      <ambientLight intensity={0.15} />
      <directionalLight position={[4, 6, 4]} intensity={0.5} />
      <directionalLight position={[-4, 2, -3]} intensity={0.25} color="#4f6bff" />

      <DroneSwarm />

      <PointerTracker />
      {!REDUCED_MOTION && <CameraRig />}

      <EffectComposer>
        <Bloom intensity={1.2} luminanceThreshold={0.3} luminanceSmoothing={0.7} mipmapBlur />
        <Vignette eskil={false} offset={0.15} darkness={0.9} />
        <Noise opacity={0.025} />
      </EffectComposer>
    </Canvas>
  )
}
