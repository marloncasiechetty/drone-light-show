# How this site was built — MIRS Innovate drone light show landing page

A complete, reproducible log of every step (and every prompt) used to build this site
with Claude Code, across two working sessions. Follow it top to bottom and you end up
with this exact website.

**Stack:** Vite · React 19 · TypeScript · @react-three/fiber · @react-three/drei ·
@react-three/postprocessing · three.js · plain CSS (no UI framework, no animation library)

---

## 0. Prerequisites

- Node 20+, npm
- A drone GLTF model (`drone.glb`). Ours is ["Drone" by Cafitz3D on Sketchfab](https://sketchfab.com/3d-models/drone-2588b8a0917d474e97886763c98a65af), CC-BY-4.0 — credit required, kept in the header comment of `src/Drone.tsx`.
- Claude Code (every step below was one conversational prompt)

---

## 1. Session one — project setup and the drone component

### 1.1 Scaffold

> **Prompt:** "setup react vite with fiber for a 3d landing page"

Standard Vite + React + TS template (`npm create vite`), plus:

```
npm i three @react-three/fiber @react-three/drei @react-three/postprocessing
npm i -D @types/three
```

### 1.2 Bring in the 3D model — study it first

> **Prompt:** "/Users/…/Downloads/drone.glb — use this drone model and see how we can
> animate the model, the drone should light up and also fly around as this is for a
> drone light show website, first study the model"

The model went into `public/models/drone.glb`. The component skeleton was generated
gltfjsx-style (typed `GLTFResult` with every `Object_N` node and the three materials),
then hand-edited. Loading is `useGLTF('/models/drone.glb')` + `useGLTF.preload(...)`.

### 1.3 Debugging the model — finding the propellers

The first animation attempt spun the wrong nodes:

> **Prompt:** "i still dont see the blade spinning though"

**How we debugged it:** we built a throwaway harness, `src/DronePartsDebug.tsx`,
that renders every mesh of the GLTF separately with labels, so you can visually
identify which `Object_N` is which part. That was exposed behind a "Debug drone
parts" button in the app (removed in session two once it had done its job — the
file is still in `src/` if you ever need it again).

Looking at the exploded view, the user identified the propellers:

> **Prompt:** "spin Object_32 Object_34 Object_38 Object_36 these are the blades"

Those four nodes became the `BLADES` table in `Drone.tsx`, rotated on their local Y
every frame. Lesson: **never guess GLTF node names — build a viewer and look.**

### 1.4 Making the drone a high-performance component

> **Prompt:** "perfect now make this drone a proper react component high performance,
> as we will need to spawn many as we need to do a drone show"

This produced `src/Drone.tsx` as it exists now. The key performance decisions:

- **Static parts merged into 3 draw calls.** All non-moving meshes are baked with
  their local transforms (`bakedGeometry` applies the part matrix into the geometry)
  and merged with `mergeBufferGeometries` into three geometries grouped by material
  (`body`, `nose`, `caps`). Computed **once** and cached in a module-level variable
  (`staticGeoCache`) so 120 drones share the same geometry.
- **Only the 4 blades stay separate meshes** (they need to spin). Each gets its own
  `MeshStandardMaterial` with `emissive` + `toneMapped: false` so the LEDs punch
  through bloom.
- **Position is driven externally.** The component takes `formationPosition: THREE.Vector3`
  which a director mutates in place every frame — no React re-renders in the hot path.
  On top of that the drone adds its own sine-based `wander`, banks with `lookAt`
  toward its next position, and rolls slightly (`rotation.z`).
- Optional `lit` prop adds 4 real point lights (light spill on the body) — used only
  for the big close-up drones, never the swarm (4 lights × 120 drones would die).
- Cursor interaction: `pointerWorld` (a module-singleton `Vector3`, see 1.6) is
  compared against the drone position each frame; drones within `HOVER_RADIUS`
  get a smoothstepped `boost` that speeds the blades and brightens the LEDs.

### 1.5 First hero + swarm

> **Prompt:** "make them tiny and create a very cool interactive hero section full
> height, first craft an idea awwwards for a drone light show company"

> **Prompt:** "build empty second section and implement, also i dont like the mouse
> hover action, basically on the drones, increase light and glow, and also when i
> hover make the glow and light increase or change colors, make the drones roam
> smoothly and or make them do an actual drone show behind"

End state of session one: 80 tiny drones flying formation cycles
(ambient → sphere → rings) in `swarmFormations.ts`, a `SwarmDirector` damping every
drone toward its formation target, 3D extruded headline text lit by color-cycling
spotlight "drones", bloom/vignette/noise post-processing, and the pointer-proximity
glow (every drone near the cursor flares, not just the one under it — done by
raycasting the pointer onto a z=0 plane, stored in the shared `pointerWorld` vector).

---

## 2. Session two — the real site

### 2.1 Hero concept rework

> **Prompt:** "can you check this hero section and make it much better, our concept is
> drone light show company, current hero is not that great, can you come up with a
> better concept, focus on drones and lights"

Concept shift: **the hero should BE a drone show, not decorate one.** The extruded
3D headline + spotlight rig were deleted. Instead the swarm flies a looping show
program (`STAGES` in `swarmFormations.ts`): CONSTELLATION (drifting star-field) →
sky-writing (text at first, later the logo) → STARBURST (breathing fibonacci sphere).
The DOM became a quiet "flight console": wordmark top-left, pitch + CTA bottom-left,
and the signature detail — a live **"Now flying · 02 EMBLEM"** HUD readout
(`NowFlying` in `App.tsx`) that polls `showState.stage`, a module singleton the 3D
director writes into. Fonts: Unbounded (display) + Space Grotesk (body) from Google
Fonts, loaded in `index.html`.

Sky-writing works by rasterizing to an offscreen canvas and sampling pixels into
world-space points (`sampleImagePoints`, originally `sampleTextPoints`):
- collect all lit pixels
- **even stride** through them (keeps the mark legible with only 120 drones)
- deterministic LCG shuffle of the assignment (so the morph looks organic instead
  of scanning row by row)
- map to world units, fitted to the camera frustum width (recomputed on resize)

### 2.2 Real models as the lights

> **Prompt:** "can the lights actually be our drone component, but make the model to
> size you actually have and then increase glow and lighting of the model maybe"

(The first pass used 500 instanced glow-spheres; the user wanted the real model.)
`DroneSwarm.tsx` renders **120 real `Drone` components at scale 0.1**. 120 is the
draw-call budget: each drone costs ~7 calls, and the old scene proved ~80–120 is
fine. Two small props were added to `Drone` instead of rewriting it:
- `showColor?: THREE.Color` — the show director drives LED color per-stage
  (mutating shared `Color` objects) instead of the built-in rainbow hue cycle
- `glow?: number` — emissive multiplier (2.4 in the swarm) so a tiny far-away
  drone still reads as a point of light through bloom

### 2.3 Background / setting

> **Prompt:** "okay now for the hero section we will need some kind of background as
> its empty"

Added: stars, horizon glow, a jagged `Ridge` silhouette (ShapeGeometry with a
seeded-random top edge), and a dark `Ground` circle fading into fog. Formations got
a `FLOOR = -0.9` clamp so no drone dips under the ground (real shows keep floor
clearance too).

Later refined (see 2.6) because the drei `<Stars>` looked artificial.

### 2.4 Scroll-following drones + full page

> **Prompt:** "and when i scroll down to sections, one or 2 drones should follow me
> and be big, but always stay in the content background, i need a awwwards kind of
> website, i want sections about, portfolio, client testimonials"

- `ScrollEscorts.tsx`: a **second, fixed, transparent Canvas** at `z-index: 1`,
  behind all content (`main` and `#hero` are `z-index: 2`). Two big `Drone`s
  (`lit`, one accent-colored, one cyan, different depths for parallax) park above
  the viewport during the hero, then fly in. A scroll listener writes into a
  module singleton (`{ y, progress }`); each escort's `useFrame` damps toward a
  target derived from scroll progress, and a **smoothed scroll velocity** makes
  them dip/lag when you scroll fast and catch up when you stop.
- Sections in `App.tsx`: About (statement + stats `<dl>`), Portfolio (typographic
  rows), Testimonials (three staggered quotes), closing CTA, footer.
- Scroll reveals: one `IntersectionObserver` adds `.visible`; CSS transitions do
  the animation. No animation library.

### 2.5 Real content + first timeline

> **Prompt:** "perfect now get content and fill our website with this
> https://www.mirs-innov.com/drone-light-show, also if we can have a timeline
> component where drones draw a glowing line effect as well"

- Fetched the MIRS page (WebFetch) and extracted: stats (250+ projects, 12+
  countries, 20,000+ drones coordinated, 12,000 largest single fleet), the six
  featured shows, client names, the 4-step production process, offices/phones.
- Testimonials were composed from the site's own review fragments and attributed
  to **events, not invented people**.
- Client marquee: duplicated list + CSS `translateX(-50%)` keyframe loop.
- First `Timeline.tsx`: vertical SVG path drawn via the stroke-dasharray trick,
  scroll-driven, steps lighting up as the line passes.

### 2.6 Portfolio previews, logo formation, natural sky, timeline v2

> **Prompt:** "can you make the portfolio much better, like when you hover to show a
> photo and a play button, awwwards style and use this logo
> https://www.mirs-innov.com/_next/image?url=%2Fimages%2Fmirs-logo%2Flogo-white.png…
> and can the drones form this logo pattern, and the hero background we need
> something different than that seems artificial even the stars and remove upto
> 12000 drones and debug button and remove signature pattern as its not nice and
> 03 / How a show gets made can you make the line like the attached [reference image]"

Five things at once:

1. **Portfolio hover previews.** Scraped the six real project photos from the MIRS
   page HTML (`curl | grep` for `/images/drone-light-show/project-photos/…`),
   downloaded them to `public/shows/`. On hover a fixed-position card
   (`.show-preview`) crossfades the right photo, scales in, and **trails the
   cursor** — the trailing feel is just a CSS `transform` transition
   (`cubic-bezier(0.16,1,0.3,1)`) on top of `mousemove` updates, no JS lerp loop.
   A frosted play button sits centered. Touch devices get inline thumbnails
   instead (`@media (hover: none)`).
2. **Logo in the sky.** Downloaded `logo-white.png` to `public/`. `sampleTextPoints`
   became `sampleImagePoints`: loads the PNG into a canvas, samples bright pixels
   (`alpha > 100 && r+g+b > 180`), same even-stride + shuffle. The text SIGNATURE
   stage was removed; the stage is now EMBLEM. Serving the logo from `public/`
   (same origin) avoids canvas CORS taint — don't sample it straight from their CDN.
3. **Natural sky.** Removed drei `<Stars>` (uniform twinkle = artificial). The
   backdrop sphere now gets **one canvas-baked texture**: 7-stop gradient with a
   soft horizon haze band, ~900 static stars with heavy size bias toward tiny,
   varied brightness, warm/cool tints, density thinning toward the horizon, plus
   ~12 brighter stars with radial-gradient halos. Reads like a long exposure.
4. **Removals:** "Up to 12,000 drones" tag, the debug button (and its state).
5. **Timeline v2 to match the reference:** one full-width sweeping S-curve
   (`viewBox 0 0 1000 1300`, `preserveAspectRatio="none"` so it stretches),
   heading "From concept to sky story.", steps art-directed along the curve with
   `x/y` percentages, square cyan bullet + "(Week N)" tags + thin vertical
   drop-marker lines (`::after`). Mobile falls back to a stacked list.

### 2.7 Accent color

> **Prompt:** "also the yellow color of titles and everything make it #a5f3fc and
> accents of this color"

One CSS variable rename (`--gold` → `--accent: #a5f3fc`) covers all UI accents.
In 3D, the constellation-stage LED hue moved to the same icy cyan family
(`setHSL(0.5 + jitter, …)`), the lead escort matches, logo stage stays white.

### 2.8 Timeline drone + escort margins

> **Prompt:** "From concept to sky story. make the line animated with a drone but
> keep same shape, drawing animation, also the following drones keep it to more
> left and right as it wont always cover content"

- The dot at the curve tip became a small **drone glyph** (SVG: arms, body, two
  cyan rotor lights, cyan drop-shadow) that rotates to the path tangent. Because
  the viewBox is stretched non-uniformly, the tangent must be computed in screen
  space: scale `dx` by `rect.width/1000` and `dy` by `rect.height/1300` before
  `atan2`.
- Escorts: instead of weaving across the middle, each computes the visible
  half-width **at its own depth** every frame (`state.viewport.width` scaled by
  `(cameraZ - depth)/cameraZ`) and holds to the outer 65–90% of it — always in
  the margins beside the 1150px content column, on any screen.

### 2.9 Debugging the draw animation (two rounds)

> **Prompt:** "still line is not drawing in From concept to sky story, previously you
> made it like that"

Root cause: progress was mapped across the whole tall section, so a scroll flick
barely moved the dash offset — it *was* animating, imperceptibly. Fix: replaced
scroll-event handling with a **continuous rAF loop that eases** the drawn length
toward the scroll target (`cur += (target - cur) * 0.055`), idling when the
section is far offscreen. Any scroll now produces a visible second of the drone
flying and drawing.

> **Prompt:** "line draws a bit too fast, so when i scroll its already drawn"

Second fix: the target mapping. Final version ties drawing 1:1 to scroll — the
tip rides the 65%-of-viewport line: `target = (vh * 0.65 - box.top) / box.height`.
Exactly as much curve is drawn as has scrolled past that line, so it can never
run ahead of the reader.

---

## 3. Architecture summary (what talks to what)

```
index.html            fonts (Unbounded + Space Grotesk), title
src/
  main.tsx            React root
  App.tsx             page: hero frame, HUD, sections, portfolio previews, reveals
  App.css             the entire design system (CSS vars in :root)
  Scene.tsx           hero Canvas: sky texture, ridge, ground, fog, lights,
                      DroneSwarm, PointerTracker, CameraRig, bloom/vignette/noise
  DroneSwarm.tsx      120 Drones + ShowDirector (formation targets + LED colors)
  swarmFormations.ts  STAGES/timing, showState, formations (constellation/starburst),
                      FLOOR clamp, sampleImagePoints (logo → points), REDUCED_MOTION
  Drone.tsx           the reusable model: merged static geo, spinning LED blades,
                      wander/banking, hover flare, showColor/glow/lit props
  pointerWorld.ts     shared Vector3: cursor projected to the z=0 plane
  ScrollEscorts.tsx   second fixed Canvas, 2 big scroll-following drones
  Timeline.tsx        S-curve + drone-drawn line (rAF eased, dasharray trick)
  DronePartsDebug.tsx GLTF part-inspector harness (kept, unused)
public/
  models/drone.glb    the Sketchfab model (CC-BY-4.0, credit in Drone.tsx)
  mirs-logo.png       swarm formation source + header/footer logo
  shows/*.webp        six real project photos
```

**Shared-state pattern used throughout:** module-level singletons mutated in
`useFrame`/listeners and read elsewhere (`pointerWorld`, `showState`, scroll state,
`textPointsRef`) — zero React re-renders in any per-frame path. The only interval
is the 250ms HUD poll.

**Layering:** escorts Canvas is `position: fixed; z-index: 1`; `#hero` and `main`
are `z-index: 2` — big drones always behind content, never over it.

**Accessibility floor:** `prefers-reduced-motion` freezes the show on the drawn
logo, disables escorts/camera parallax/marquee/reveals; the sky-drawn brand name
has an `sr-only` h1; CTA has a visible focus ring.

---

## 4. Verification at every step

- `npx tsc -b && npm run lint` (oxlint) after every change set — kept at zero errors.
- `npm run dev` stayed running; every visual change was eyeballed via HMR at
  localhost (the user preferred manual checking over Playwright screenshots).
- The one real 3D-model unknown (which nodes are the propellers) was solved with
  a purpose-built visual debug harness, not guesswork.

## 5. Tuning knobs (where to tweak)

| What | Where |
|---|---|
| Drone count / scale | `DroneSwarm.tsx` `COUNT`, `DRONE_SCALE` (budget ≈7 draw calls/drone; instance the model to go past ~150) |
| Show timing / order | `swarmFormations.ts` `STAGES` |
| Logo size in sky | `DroneSwarm.tsx` `Math.min(11, visibleWidth * 0.72)` |
| Accent color | `App.css` `--accent` (+ LED hues in `DroneSwarm.tsx`, escort colors) |
| Escort margins | `ScrollEscorts.tsx` `0.78 ± 0.12` of half-width |
| Timeline draw feel | `Timeline.tsx` easing `0.055`, tip line `vh * 0.65` |
| Step positions on curve | `Timeline.tsx` `STEPS[].x/y` percentages |
| Curve shape | `Timeline.tsx` `PATH` |
