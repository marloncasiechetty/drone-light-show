import { useEffect, useRef } from 'react'
import { REDUCED_MOTION } from './swarmFormations'

// MIRS's production process, staged along the flight curve (x/y are % of the canvas)
const STEPS = [
  { title: 'Event Scope', week: 'Week 1', body: 'Location, date, target audience, show scale and creative direction.', x: 8, y: 16 },
  { title: 'Choreography & Audio Sync', week: 'Week 2', body: 'Storyboard, drone count, music timing and a full 3D animation preview.', x: 52, y: 38 },
  { title: 'Airspace & Permitting', week: 'Week 3', body: 'Site survey, safety perimeter, authority submissions and rehearsal plan.', x: 10, y: 60 },
  { title: 'Show Delivery', week: 'Show Week', body: 'Onsite deployment, test flights, final checks and the live performance.', x: 54, y: 80 },
]

// one big sweeping S-curve through the whole section, in a 1000 x 1300 canvas that stretches to fit
const PATH = 'M 640 -10 C 420 190, 70 260, 80 470 C 90 680, 730 640, 850 880 C 930 1040, 560 1170, 300 1310'

// a lead drone draws its flight line through the process as you scroll —
// the drawn length eases toward the scroll target, so the drone visibly flies the route
export function Timeline() {
  const canvasBox = useRef<HTMLDivElement>(null)
  const draw = useRef<SVGPathElement>(null)
  const drone = useRef<HTMLDivElement>(null)
  const steps = useRef<HTMLDivElement[]>([])

  useEffect(() => {
    const path = draw.current!
    const len = path.getTotalLength()
    path.style.strokeDasharray = String(len)
    path.style.strokeDashoffset = String(len)

    let cur = -1 // force first paint
    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const box = canvasBox.current!.getBoundingClientRect()
      const vh = window.innerHeight
      // idle when the curve is far offscreen
      if (box.top > vh * 1.3 || box.bottom < -vh * 0.3) return

      // tip tracks the 65%-viewport line: the drone draws exactly as much curve as has scrolled past it
      const target = REDUCED_MOTION ? 1 : Math.min(Math.max((vh * 0.65 - box.top) / Math.max(box.height, 1), 0), 1)
      cur = cur < 0 ? target : cur + (target - cur) * 0.055
      if (Math.abs(target - cur) < 0.0005) cur = target

      const d = len * cur
      path.style.strokeDashoffset = String(len - d)
      const pt = path.getPointAtLength(d)
      const prev = path.getPointAtLength(Math.max(d - 3, 0))
      // tangent angle in screen space — the viewBox stretches, so scale each axis before atan2
      const angle = Math.atan2(((pt.y - prev.y) * box.height) / 1300, ((pt.x - prev.x) * box.width) / 1000) * (180 / Math.PI)
      const el = drone.current!
      el.style.left = `${(pt.x / 1000) * 100}%`
      el.style.top = `${(pt.y / 1300) * 100}%`
      el.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`
      steps.current.forEach((s, i) => s?.classList.toggle('lit', cur * 100 > STEPS[i].y + 4))
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <section id="process" className="panel process-panel">
      <p className="panel-label">03 / Process</p>
      <h2 className="statement reveal">From concept to sky story.</h2>
      <div className="timeline" ref={canvasBox}>
        <svg viewBox="0 0 1000 1300" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id="tl-grad" gradientUnits="userSpaceOnUse" x1="640" y1="0" x2="300" y2="1300">
              <stop offset="0" stopColor="#e9f3ff" />
              <stop offset="0.3" stopColor="#7fd4e8" />
              <stop offset="0.65" stopColor="#ffffff" />
              <stop offset="1" stopColor="#dfe9ff" />
            </linearGradient>
          </defs>
          <path className="tl-route" d={PATH} />
          <path className="tl-draw" ref={draw} d={PATH} />
        </svg>
        <div className="tl-drone" ref={drone} aria-hidden>
          <svg width="34" height="12" viewBox="0 0 34 12">
            <line x1="4" y1="6" x2="30" y2="6" stroke="#aab4d8" strokeWidth="1.4" />
            <rect x="13" y="3.4" width="8" height="5.2" rx="2.6" fill="#e8ecff" />
            <circle cx="4" cy="6" r="2.6" fill="#a5f3fc" />
            <circle cx="30" cy="6" r="2.6" fill="#a5f3fc" />
          </svg>
        </div>
        {STEPS.map((s, i) => (
          <div
            key={s.title}
            className="tl-step"
            style={{ left: `${s.x}%`, top: `${s.y}%` }}
            ref={(el) => {
              if (el) steps.current[i] = el
            }}
          >
            <h3>
              <span className="tl-square" />
              {s.title} <em>({s.week})</em>
            </h3>
            <p>{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
