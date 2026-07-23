import { Suspense, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { Drone } from './Drone'

// module singleton like pointerWorld — the scroll listener writes, escort useFrames read
const scroll = { y: 0, progress: 0 }

const ACCENT = new THREE.Color('#a5f3fc')
const CYAN = new THREE.Color('#7de8ff')

function Escort({ seed, side, depth, scale, color }: { seed: number; side: 1 | -1; depth: number; scale: number; color: THREE.Color }) {
  const pos = useMemo(() => new THREE.Vector3(side * 6, 10, depth), [side, depth])
  const vel = useRef(0)
  const lastY = useRef(0)

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1)
    // smoothed scroll velocity — the drones dip and lag when you scroll fast, then catch up
    const dy = scroll.y - lastY.current
    lastY.current = scroll.y
    vel.current = THREE.MathUtils.damp(vel.current, dy / Math.max(delta, 1e-3), 4, delta)

    const p = scroll.progress
    // hug the viewport margins (outer ~65-90% of the half-width at this drone's depth)
    // so the escorts never drift behind the centered content column
    const halfW = (state.viewport.width / 2) * ((9 - depth) / 9)
    const tx = side * halfW * (0.78 + Math.sin(p * Math.PI * 2.2 + seed) * 0.12)
    // parked above the viewport during the hero; drift up and down as sections pass
    const ty = p > 0.03 ? THREE.MathUtils.clamp(Math.cos(p * Math.PI * 1.7 + seed) * 1.6 - vel.current * 0.0012, -2.6, 2.6) : 10

    pos.x = THREE.MathUtils.damp(pos.x, tx, 1.6, delta)
    pos.y = THREE.MathUtils.damp(pos.y, ty, 1.6, delta)
  })

  return <Drone formationPosition={pos} showColor={color} glow={1.6} scale={scale} wander={[0.45, 0.3]} speed={0.35} phase={seed} lit />
}

export function ScrollEscorts() {
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      scroll.y = window.scrollY
      scroll.progress = max > 0 ? window.scrollY / max : 0
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="escorts" aria-hidden>
      <Canvas camera={{ position: [0, 0, 9], fov: 50 }} gl={{ alpha: true }}>
        <ambientLight intensity={0.35} />
        <directionalLight position={[3, 5, 4]} intensity={0.8} />
        <directionalLight position={[-4, -2, 3]} intensity={0.3} color="#4f6bff" />
        <Suspense fallback={null}>
          <Escort seed={0} side={1} depth={1.2} scale={1.05} color={ACCENT} />
          <Escort seed={2.6} side={-1} depth={-0.8} scale={0.72} color={CYAN} />
        </Suspense>
      </Canvas>
    </div>
  )
}
