import { Suspense, useEffect, useRef, useState } from 'react'
import Scene from './Scene'
import { ScrollEscorts } from './ScrollEscorts'
import { Timeline } from './Timeline'
import { ShowModal, type ShowItem } from './ShowModal'
import { REDUCED_MOTION, STAGES, showState } from './swarmFormations'
import './App.css'

const SHOWS: ShowItem[] = [
  {
    id: 'show-42',
    title: '2026 New Year’s Eve',
    meta: 'Bahrain · 2,500 drones',
    img: '/shows/show-42.webp',
    category: 'National Celebration',
    drones: '2,500',
    location: 'Manama, Bahrain',
    duration: '18 Minutes',
    description: 'A record-breaking aerial choreography celebrating the arrival of 2026 over the Manama coastline. 2,500 illuminated drones generated 3D dynamic sculptures including an intricate falcon, traditional dhow ship, and a synchronized millisecond countdown synced with live pyrotechnics.',
    highlights: ['RTK Centimeter Precision Flight', '3D Kinetic Sculptures & Typography', 'Live Broadcast Synchronization']
  },
  {
    id: 'show-43',
    title: 'Digital Africa ETEX',
    meta: 'Ethiopia · 1,500 drones',
    img: '/shows/show-43.webp',
    category: 'Tech Summit',
    drones: '1,500',
    location: 'Addis Ababa, Ethiopia',
    duration: '12 Minutes',
    description: 'Opening night spectacle for Africa’s premier technology exposition. The swarm morphed into glowing AI neural networks, digital circuit patterns, and regional emblem logos illuminated across the African night sky.',
    highlights: ['Neural Network Dynamic Animation', 'High Altitude Flight Formation', 'Real-Time Telemetry & Safety Geofencing']
  },
  {
    id: 'show-45',
    title: 'Horse & Cattle Show',
    meta: 'Pakistan · 1,500 drones',
    img: '/shows/show-45.webp',
    category: 'Cultural Festival',
    drones: '1,500',
    location: 'Lahore, Pakistan',
    duration: '15 Minutes',
    description: 'Honoring centuries of agricultural heritage with state-of-the-art light shows. Featuring 3D galloping horses, intricate floral patterns, and national heraldry with vibrant multicolor light transitions.',
    highlights: ['Custom RGB Luminance Palette', 'Complex 3D Animal Formations', 'Crowd Safety Geofencing System']
  },
  {
    id: 'show-46',
    title: 'Coca-Cola Christmas',
    meta: 'Philippines · 1,300 drones',
    img: '/shows/show-46.webp',
    category: 'Brand Activation',
    drones: '1,300',
    location: 'Manila, Philippines',
    duration: '14 Minutes',
    description: 'Bringing festive magic to life over Manila Bay. The drone swarm assembled the iconic Coca-Cola Christmas truck in full 3D, Santa Claus waving to the crowd, and glowing holiday wishes visible across 10 kilometers.',
    highlights: ['Viral Social Media Impact', 'Full 3D Kinetic Truck Model', 'Precision Audio-Visual Synchronization']
  },
  {
    id: 'show-56',
    title: 'Lunar New Year',
    meta: 'Malaysia · 1,200 drones',
    img: '/shows/show-56.webp',
    category: 'Cultural Celebration',
    drones: '1,200',
    location: 'Kuala Lumpur, Malaysia',
    duration: '16 Minutes',
    description: 'A breathtaking 3D soaring dragon spanning 400 meters across the Kuala Lumpur skyline. The display combined traditional auspicious symbols with smooth fluid drone flocking mechanics for an unforgettable celebration.',
    highlights: ['400-Meter Dragon Wingspan', 'Fluid Swarm Flocking Dynamics', 'Urban Aviation Clearance Granted']
  },
  {
    id: 'show-61',
    title: 'McDonald’s Malaysia',
    meta: 'Brand launch · 500 drones',
    img: '/shows/show-61.webp',
    category: 'Product Launch',
    drones: '500',
    location: 'Kuala Lumpur, Malaysia',
    duration: '10 Minutes',
    description: 'An impactful guerilla marketing sky reveal for McDonald’s flagship campaign. The drones formed golden arches, iconic products, and interactive QR codes suspended in the sky that spectators scanned directly from the ground.',
    highlights: ['Sky QR Code Formation', 'Ultra High Luminance Output', 'Rapid Rapid-Deploy Launch Pad']
  }
]

const QUOTES = [
  {
    text: 'Incredible precision — the countdown hit the music to the frame, and the crowd’s videos went globally viral within hours.',
    name: 'New Year’s Eve 2026',
    role: 'National celebration, Bahrain',
  },
  {
    text: 'They translated our brand identity into aerial art. Pure wonder for people seeing a drone show for the first time.',
    name: 'Brand launch',
    role: 'Coca-Cola Christmas, Philippines',
  },
  {
    text: 'Permits, logistics, rehearsals — all handled. The synchronization between the drones and our live stage was seamless.',
    name: 'Festival production',
    role: 'Mediacorp event, Singapore',
  },
]

const CLIENTS = [
  'Coca-Cola',
  'McDonald’s',
  'Cartier',
  'Porsche',
  'Deloitte',
  'Hennessy',
  'PwC',
  'Pop Mart',
  'GrabPay',
  'Sun Life',
  'CapitaLand',
  'Sentosa',
  'Token2049',
  'Gardens by the Bay',
]

// live readout of what the 3D swarm is actually flying right now
function NowFlying() {
  const [stage, setStage] = useState(showState.stage)
  useEffect(() => {
    const id = setInterval(() => setStage(showState.stage), 250)
    return () => clearInterval(id)
  }, [])
  return (
    <p className="now-flying">
      <span className="now-flying-dot" />
      Now flying&ensp;{String(stage + 1).padStart(2, '0')} · {STAGES[stage].name}
    </p>
  )
}

interface PortfolioProps {
  onSelectShow: (show: ShowItem) => void
}

// show rows with a photo + play-button preview that trails the cursor
function Portfolio({ onSelectShow }: PortfolioProps) {
  const [active, setActive] = useState<number | null>(null)
  const preview = useRef<HTMLDivElement>(null)

  const onMove = (e: React.MouseEvent) => {
    const el = preview.current
    if (el) el.style.transform = `translate(${e.clientX + 28}px, ${e.clientY - 130}px)`
  }

  return (
    <section id="portfolio" className="panel" onMouseMove={onMove}>
      <p className="panel-label">02 / Selected shows</p>
      <ul className="show-list">
        {SHOWS.map((s, i) => (
          <li
            key={s.title}
            className="show-row reveal"
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            onClick={() => onSelectShow(s)}
            role="button"
            tabIndex={0}
            aria-label={`View details for ${s.title}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelectShow(s)
              }
            }}
          >
            <img className="show-thumb" src={s.img} alt="" loading="lazy" />
            <h3>{s.title}</h3>
            <span className="show-meta">{s.meta}</span>
          </li>
        ))}
      </ul>
      <div ref={preview} className="show-preview" aria-hidden>
        <div className={`show-preview-card${active !== null ? ' on' : ''}`}>
          {SHOWS.map((s, i) => (
            <img key={s.img} src={s.img} alt="" className={active === i ? 'on' : ''} loading="lazy" />
          ))}
          <span className="play-btn">
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path d="M5 3.5v11l9-5.5z" fill="currentColor" />
            </svg>
          </span>
        </div>
      </div>
    </section>
  )
}

function App() {
  const [selectedShow, setSelectedShow] = useState<ShowItem | null>(null)

  const handleBookClick = () => {
    const bookEl = document.getElementById('book')
    if (bookEl) {
      bookEl.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // scroll-reveal: one observer, CSS does the rest
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('visible')),
      { threshold: 0.15 },
    )
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <>
      <section id="hero">
        <Suspense fallback={null}>
          <Scene />
        </Suspense>

        <div className="hero-frame">
          <header className="hero-top">
            <img className="logo" src="/mirs-logo.png" alt="MIRS Innovate" />
          </header>

          {/* the logo is drawn in the sky by the swarm — this is the accessible copy of it */}
          <h1 className="sr-only">MIRS Innovate — drone light shows</h1>

          <div className="hero-layout-grid">
            <div className="hero-title-wrapper">
              <h1 className="hero-title-giant">
                <span className="title-row">MIRS</span>
                <span className="title-row">INNOVATE<sup className="title-asterisk">*</sup></span>
              </h1>
            </div>

            <div className="hero-copy-right">
              <p className="hero-lede-text">
                MIRS Innovate is a worldwide network of visual artists, filmmakers and storytellers bound not by place, status or labels but by passion and hunger to unlock potential through our unique perspectives.
              </p>
              <button className="hero-pill-btn" onClick={handleBookClick}>
                <span>Join the lab</span>
                <span className="pill-arrow">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </span>
              </button>
            </div>
          </div>

          <NowFlying />

          <a className="scroll-cue" href="#about">
            Scroll
          </a>
        </div>
      </section>

      {!REDUCED_MOTION && <ScrollEscorts />}

      <main>
        <section id="about" className="panel">
          <p className="panel-label">01 / About</p>
          <h2 className="statement reveal">
            Turn your event into a show people remember. <em>Your story, written in the sky.</em>
          </h2>
          <p className="panel-body reveal">
            MIRS Innovate choreographs synchronized drone performances for launches, festivals, tourism campaigns and
            private celebrations worldwide. Logos, mascots, text and cinematic animation become one clear narrative —
            flight-planned with geofencing, RTK positioning and full rehearsals, delivered in any country with local
            aviation coordination. No smoke, no fire debris, one reusable fleet.
          </p>
          <dl className="stats reveal">
            <div>
              <dd>250+</dd>
              <dt>Show projects</dt>
            </div>
            <div>
              <dd>12+</dd>
              <dt>Countries</dt>
            </div>
            <div>
              <dd>20,000+</dd>
              <dt>Drones coordinated</dt>
            </div>
            <div>
              <dd>12,000</dd>
              <dt>Largest single fleet</dt>
            </div>
          </dl>
        </section>

        <div className="clients" aria-label="Selected clients">
          <div className="clients-track">
            {[...CLIENTS, ...CLIENTS].map((c, i) => (
              <span key={i} aria-hidden={i >= CLIENTS.length || undefined} className={i >= CLIENTS.length ? 'dup' : undefined}>
                {c}
              </span>
            ))}
          </div>
        </div>

        <Portfolio onSelectShow={setSelectedShow} />

        <Timeline />

        <section id="testimonials" className="panel">
          <p className="panel-label">04 / What clients say</p>
          <div className="quotes">
            {QUOTES.map((q) => (
              <figure key={q.name} className="quote reveal">
                <blockquote>{q.text}</blockquote>
                <figcaption>
                  <strong>{q.name}</strong>
                  <span>{q.role}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section id="book" className="panel closing">
          <h2 className="statement reveal">Ready to light your sky?</h2>
          <button className="cta reveal" onClick={handleBookClick}>Book a show</button>
        </section>

        <footer className="site-footer">
          <img className="logo" src="/mirs-logo.png" alt="MIRS Innovate" />
          <span>Singapore · +65 6718 2230</span>
          <span>Dubai · International City</span>
          <span>© 2018–2026 Mirs Innovate Pte Ltd</span>
        </footer>
      </main>

      <ShowModal
        show={selectedShow}
        onClose={() => setSelectedShow(null)}
        onBookClick={handleBookClick}
      />
    </>
  )
}
export default App
