import React, { useEffect, useState } from 'react'

export interface ShowItem {
  id: string
  title: string
  meta: string
  img: string
  category: string
  drones: string
  location: string
  duration: string
  description: string
  highlights: string[]
}

interface ShowModalProps {
  show: ShowItem | null
  onClose: () => void
  onBookClick: () => void
}

export const ShowModal: React.FC<ShowModalProps> = ({ show, onClose, onBookClick }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [activeShow, setActiveShow] = useState<ShowItem | null>(null)

  useEffect(() => {
    if (show) {
      setActiveShow(show)
      // Double rAF for smooth DOM paint before applying transition classes
      const frame1 = requestAnimationFrame(() => {
        const frame2 = requestAnimationFrame(() => setIsVisible(true))
        return () => cancelAnimationFrame(frame2)
      })
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
      return () => cancelAnimationFrame(frame1)
    } else {
      setIsVisible(false)
      const timer = setTimeout(() => {
        setActiveShow(null)
        document.body.style.overflow = ''
        document.documentElement.style.overflow = ''
      }, 450)
      return () => clearTimeout(timer)
    }
  }, [show])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && show) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [show, onClose])

  if (!activeShow) return null

  return (
    <div
      className={`modal-backdrop ${isVisible ? 'open' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal-glow-ambient" aria-hidden />

      <div className={`modal-card ${isVisible ? 'open' : ''}`}>
        {/* Animated close button */}
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          <span className="close-icon-wrapper">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </span>
        </button>

        {/* Hero image header with zoom reveal effect */}
        <div className="modal-hero-img">
          <img src={activeShow.img} alt={activeShow.title} className="modal-img-zoom" />
          <div className="modal-img-gradient" />
          <div className="modal-badge-wrapper">
            <span className="modal-badge">{activeShow.category}</span>
            <span className="modal-drones-badge">✦ {activeShow.drones} DRONES</span>
          </div>
        </div>

        {/* Modal content body - non-scrollable compact layout */}
        <div className="modal-content">
          <div className="modal-header">
            <h2 id="modal-title" className="modal-title">{activeShow.title}</h2>
            <p className="modal-location">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 21s-8-4.5-8-11.5a8 8 0 1 1 16 0C20 16.5 12 21 12 21z" />
                <circle cx="12" cy="9.5" r="3" />
              </svg>
              <span>{activeShow.location}</span>
            </p>
          </div>

          <div className="modal-stats-grid">
            <div className="modal-stat-item">
              <span className="stat-label">Fleet Size</span>
              <span className="stat-val">{activeShow.drones}</span>
            </div>
            <div className="modal-stat-item">
              <span className="stat-label">Duration</span>
              <span className="stat-val">{activeShow.duration}</span>
            </div>
            <div className="modal-stat-item">
              <span className="stat-label">Category</span>
              <span className="stat-val">{activeShow.category}</span>
            </div>
          </div>

          <div className="modal-body-text">
            <p className="modal-desc">{activeShow.description}</p>
          </div>

          <div className="modal-highlights-pills">
            {activeShow.highlights.map((h, i) => (
              <span key={i} className="highlight-tag">
                <span className="tag-dot" /> {h}
              </span>
            ))}
          </div>

          <div className="modal-actions">
            <button
              className="cta modal-primary-cta"
              onClick={() => {
                onClose()
                onBookClick()
              }}
            >
              Book Similar Show
            </button>
            <button className="modal-secondary-cta" onClick={onClose}>
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
