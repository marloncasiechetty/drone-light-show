import * as THREE from 'three'

const GOLDEN_ANGLE = 2.399963

export const REDUCED_MOTION = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

// the looping show program — names are surfaced live in the DOM HUD
export const STAGES = [
  { name: 'CONSTELLATION', duration: 7 },
  { name: 'EMBLEM', duration: 11 },
  { name: 'STARBURST', duration: 9 },
] as const

const TOTAL = STAGES.reduce((sum, s) => sum + s.duration, 0)

// when the user prefers reduced motion the show holds this frame: mid-EMBLEM, logo fully drawn
export const EMBLEM_T = STAGES[0].duration + STAGES[1].duration * 0.5

export function stageAt(t: number): number {
  let m = t % TOTAL
  for (let i = 0; i < STAGES.length; i++) {
    if (m < STAGES[i].duration) return i
    m -= STAGES[i].duration
  }
  return 0
}

// live show state shared with the DOM overlay (same module-singleton pattern as pointerWorld)
export const showState = { stage: 0 }

// no formation dips below this — the ground plane sits at -1.2 and real shows keep floor clearance
const FLOOR = -0.9

// wide, slowly drifting star-field
export function constellation(i: number, count: number, t: number, out: THREE.Vector3) {
  const a = i * GOLDEN_ANGLE + t * 0.02
  const r = Math.sqrt(i / count)
  out.set(Math.cos(a) * r * 11, Math.max(Math.sin(a) * r * 5 + 3.4, FLOOR), ((i * 37) % 13) - 6.5)
}

// rotating fibonacci sphere that slowly breathes
export function starburst(i: number, count: number, t: number, out: THREE.Vector3) {
  const y = 1 - (i / Math.max(count - 1, 1)) * 2
  const r = Math.sqrt(Math.max(1 - y * y, 0))
  const theta = GOLDEN_ANGLE * i + t * 0.18
  const radius = 4.6 + Math.sin(t * 0.7) * 0.5
  out.set(Math.cos(theta) * r * radius, Math.max(y * radius + 3.6, FLOOR), Math.sin(theta) * r * radius)
}

// samples the bright pixels of an image (the white logo) and returns `count` world-space points —
// even stride keeps the mark legible at low drone counts, then a deterministic shuffle of the
// assignment so the scatter->logo morph looks organic instead of scanning row by row
export async function sampleImagePoints(url: string, count: number, worldWidth: number, centerY: number): Promise<THREE.Vector3[]> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const im = new Image()
    im.onload = () => resolve(im)
    im.onerror = reject
    im.src = url
  })
  const W = img.naturalWidth
  const H = img.naturalHeight
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)
  const data = ctx.getImageData(0, 0, W, H).data

  const lit: Array<[number, number]> = []
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const o = (y * W + x) * 4
      if (data[o + 3] > 100 && data[o] + data[o + 1] + data[o + 2] > 180) lit.push([x, y])
    }
  }

  const picked = Array.from({ length: count }, (_, i) => lit[Math.floor((i * lit.length) / count) % lit.length])
  let seed = 42
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  for (let i = picked.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[picked[i], picked[j]] = [picked[j], picked[i]]
  }

  const scale = worldWidth / W
  return picked.map(([x, y]) => new THREE.Vector3((x - W / 2) * scale, (H / 2 - y) * scale + centerY, (rand() - 0.5) * 0.4))
}
