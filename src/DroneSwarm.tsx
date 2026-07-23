import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { Drone } from './Drone'
import { EMBLEM_T, REDUCED_MOTION, constellation, sampleImagePoints, showState, stageAt, starburst } from './swarmFormations'

// ponytail: 120 is the draw-call budget for full GLTF drones (~7 calls each); instance the model if you want more
const COUNT = 120
const DRONE_SCALE = 0.1

const ACCENT = new THREE.Color('#a5f3fc')
const LOGO_WHITE = new THREE.Color('#f0f5ff')

const target = new THREE.Vector3()
const targetColor = new THREE.Color()

// steers every drone's formation target + LED color through the show program; Drone adds its own wander on top
function ShowDirector({ positions, colors }: { positions: THREE.Vector3[]; colors: THREE.Color[] }) {
  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1)
    const t = REDUCED_MOTION ? EMBLEM_T : state.clock.elapsedTime
    const stage = stageAt(t)
    showState.stage = stage
    const textPoints = textPointsRef.points

    for (let i = 0; i < positions.length; i++) {
      if (stage === 0) {
        starburst(i, positions.length, t, target)
      } else if (stage === 1 && textPoints) {
        target.copy(textPoints[i])
      } else {
        constellation(i, positions.length, t, target)
      }

      const p = positions[i]
      p.x = THREE.MathUtils.damp(p.x, target.x, 1.4, delta)
      p.y = THREE.MathUtils.damp(p.y, target.y, 1.4, delta)
      p.z = THREE.MathUtils.damp(p.z, target.z, 1.4, delta)

      if (stage === 0) {
        // cyan at the base sweeping to violet at the crown for Globe
        targetColor.setHSL(0.52 + ((target.y - 3.6) / 9.2 + 0.5) * 0.26, 0.9, 0.62)
      } else if (stage === 1) {
        targetColor.copy(LOGO_WHITE)
      } else {
        targetColor.setHSL(0.5 + ((i * 13) % 7) * 0.008, 0.85, 0.68)
      }
      colors[i].lerp(targetColor, 1 - Math.exp(-3 * delta))
    }
  })
  return null
}

// module-level so ShowDirector (inside Canvas) sees the latest resize-fitted points without prop plumbing
const textPointsRef: { points: THREE.Vector3[] | null } = { points: null }

export function DroneSwarm() {
  const aspect = useThree((s) => s.size.width / s.size.height)

  // fit the sky-drawn logo to the viewport: horizontal frustum width at z=0 with fov 50, camera z 16
  useEffect(() => {
    let alive = true
    const visibleWidth = 2 * 16 * Math.tan((50 * Math.PI) / 360) * aspect
    sampleImagePoints('/mirs-logo.png', COUNT, Math.min(11, visibleWidth * 0.72), 3.9).then((pts) => {
      if (alive) textPointsRef.points = pts
    })
    return () => {
      alive = false
    }
  }, [aspect])

  const positions = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, i) => {
        const v = new THREE.Vector3()
        starburst(i, COUNT, 0, v)
        return v
      }),
    [],
  )
  const colors = useMemo(() => Array.from({ length: COUNT }, () => ACCENT.clone()), [])

  return (
    <>
      {positions.map((p, i) => (
        <Drone
          key={i}
          scale={DRONE_SCALE}
          formationPosition={p}
          showColor={colors[i]}
          glow={2.4}
          wander={[0.14, 0.09]}
          speed={REDUCED_MOTION ? 0 : 0.35}
          spinSpeed={REDUCED_MOTION ? 0 : 10}
          phase={i * 1.7}
        />
      ))}
      <ShowDirector positions={positions} colors={colors} />
    </>
  )
}
