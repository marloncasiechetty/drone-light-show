import React, { useEffect, useRef, useState } from 'react'

export interface ShowItem {
  id: string
  title: string
  meta: string
  img: string
  videoUrl?: string
  category: string
  drones: string
  location: string
  duration: string
  description: string
  highlights: string[]
}

export interface OriginRect {
  top: number
  left: number
  width: number
  height: number
}

interface ShowModalProps {
  show: ShowItem | null
  shows: ShowItem[]
  originRect: OriginRect | null
  onClose: () => void
}

export const ShowModal: React.FC<ShowModalProps> = ({ show, shows, originRect, onClose }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [progress, setProgress] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (show && shows.length > 0) {
      const idx = shows.findIndex((s) => s.id === show.id)
      setCurrentIndex(idx >= 0 ? idx : 0)
      setIsPlaying(true)
      setIsMuted(false)
      setProgress(0)
      setShowInfo(false)

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
        setCurrentIndex(0)
        document.body.style.overflow = ''
        document.documentElement.style.overflow = ''
      }, 550)
      return () => clearTimeout(timer)
    }
  }, [show, shows])

  const activeShow = shows[currentIndex] || show

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!show) return
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goToPrev()
      if (e.key === 'ArrowRight') goToNext()
      if (e.key === ' ') {
        e.preventDefault()
        togglePlay()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [show, currentIndex, shows])

  const goToPrev = () => {
    if (shows.length === 0) return
    setCurrentIndex((prev) => (prev - 1 + shows.length) % shows.length)
    setIsPlaying(true)
    setProgress(0)
  }

  const goToNext = () => {
    if (shows.length === 0) return
    setCurrentIndex((prev) => (prev + 1) % shows.length)
    setIsPlaying(true)
    setProgress(0)
  }

  const handleTimeUpdate = () => {
    const v = videoRef.current
    if (v && v.duration) {
      setProgress((v.currentTime / v.duration) * 100)
    }
  }

  const togglePlay = () => {
    const v = videoRef.current
    if (v) {
      if (v.paused) {
        v.play().catch(() => {})
        setIsPlaying(true)
      } else {
        v.pause()
        setIsPlaying(false)
      }
    }
  }

  const toggleMute = () => {
    const v = videoRef.current
    if (v) {
      v.muted = !v.muted
      setIsMuted(v.muted)
    }
  }

  const handleShare = () => {
    if (navigator.share && activeShow) {
      navigator.share({
        title: activeShow.title,
        text: activeShow.description,
        url: window.location.href,
      }).catch(() => {})
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  if (!activeShow) return null

  // Extension animation from mini preview card rect to 100vw x 100vh
  const styleObj: React.CSSProperties = isVisible
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        borderRadius: 0,
      }
    : originRect
    ? {
        position: 'fixed',
        top: `${originRect.top}px`,
        left: `${originRect.left}px`,
        width: `${originRect.width}px`,
        height: `${originRect.height}px`,
        borderRadius: '20px',
      }
    : {}

  return (
    <div
      className={`aww-player-backdrop ${isVisible ? 'open' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="aww-video-title"
    >
      <div
        className={`aww-player-container ${isVisible ? 'open' : ''}`}
        style={styleObj}
      >


        {/* Center Edge-to-Edge Video Surface */}
        <div className="aww-video-viewport" onClick={togglePlay}>
          {activeShow.videoUrl ? (
            <video
              ref={videoRef}
              key={activeShow.id}
              src={activeShow.videoUrl}
              poster={activeShow.img}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              className="aww-video-element"
              onTimeUpdate={handleTimeUpdate}
            />
          ) : (
            <img src={activeShow.img} alt={activeShow.title} className="aww-video-fallback" />
          )}

          {/* Centered Play/Pause Button */}
          <button
            className={`aww-center-play-btn ${isPlaying ? 'playing' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              togglePlay()
            }}
            aria-label={isPlaying ? 'Pause video' : 'Play video'}
          >
            {isPlaying ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            )}
          </button>

          {/* Left Arrow Floating Button */}
          <button
            className="aww-nav-arrow left"
            onClick={(e) => {
              e.stopPropagation()
              goToPrev()
            }}
            aria-label="Previous show"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>

          {/* Right Arrow Floating Button */}
          <button
            className="aww-nav-arrow right"
            onClick={(e) => {
              e.stopPropagation()
              goToNext()
            }}
            aria-label="Next show"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 5" />
            </svg>
          </button>
        </div>

        {/* Project Info Side Drawer Panel */}
        {showInfo && (
          <div className="aww-info-drawer">
            <div className="drawer-header">
              <span className="drawer-badge">{activeShow.category}</span>
              <h3 id="aww-video-title">{activeShow.title}</h3>
              <p className="drawer-location">📍 {activeShow.location} &ensp;·&ensp; {activeShow.duration}</p>
            </div>
            <div className="drawer-body">
              <p>{activeShow.description}</p>
              <div className="drawer-stats">
                <div>
                  <span>Fleet</span>
                  <strong>{activeShow.drones} DRONES</strong>
                </div>
                <div>
                  <span>Category</span>
                  <strong>{activeShow.category}</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Control HUD & Interactive Filmstrip Carousel */}
        <footer className="aww-bottom-bar" onClick={(e) => e.stopPropagation()}>
          {/* Bottom Left: Back to Shows */}
          <button className="aww-back-pill" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Back to work</span>
          </button>

          {/* Bottom Center: Interactive Filmstrip Carousel */}
          <div className="aww-filmstrip">
            {shows.map((s, idx) => (
              <button
                key={s.id}
                className={`aww-filmstrip-thumb ${idx === currentIndex ? 'active' : ''}`}
                onClick={() => {
                  setCurrentIndex(idx)
                  setIsPlaying(true)
                  setProgress(0)
                }}
                aria-label={`Switch to ${s.title}`}
              >
                <img src={s.img} alt={s.title} />
                {idx === currentIndex && (
                  <>
                    <span className="tick top" />
                    <span className="tick bottom" />
                  </>
                )}
              </button>
            ))}
          </div>

          {/* Bottom Right: Sound, Share & Project Info */}
          <div className="aww-bottom-right-actions">
            <button className="aww-icon-circle" onClick={toggleMute} aria-label={isMuted ? 'Sound on' : 'Mute'}>
              {isMuted ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              )}
            </button>

            <button className="aww-icon-circle" onClick={handleShare} aria-label="Share show">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </button>

            <button className={`aww-info-pill ${showInfo ? 'active' : ''}`} onClick={() => setShowInfo(!showInfo)}>
              <span>Project info</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
                <circle cx="8" cy="6" r="1.8" fill="currentColor" />
                <circle cx="16" cy="12" r="1.8" fill="currentColor" />
                <circle cx="12" cy="18" r="1.8" fill="currentColor" />
              </svg>
            </button>
          </div>
        </footer>

        {/* Bottom Full-Width Progress Scrubber Line */}
        <div className="aww-progress-track">
          <div className="aww-progress-bar" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  )
}
