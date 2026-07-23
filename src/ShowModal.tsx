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
  originRect: OriginRect | null
  onClose: () => void
}

export const ShowModal: React.FC<ShowModalProps> = ({ show, originRect, onClose }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [activeShow, setActiveShow] = useState<ShowItem | null>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (show) {
      setActiveShow(show)
      setIsPlaying(true)
      setIsMuted(false)
      setProgress(0)

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
      }, 550)
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
      className={`fullscreen-video-backdrop ${isVisible ? 'open' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-title"
    >
      <div
        className={`fullscreen-video-container ${isVisible ? 'open' : ''}`}
        style={styleObj}
      >
        {/* Minimalist Top Controls */}
        <div className="minimal-top-bar">
          <div className="minimal-top-badge">
            <span className="live-dot" />
            <span>{activeShow.category}</span>
            <span className="badge-sep">·</span>
            <span>{activeShow.drones} DRONES</span>
          </div>

          <button className="minimal-close-pill" onClick={onClose} aria-label="Close fullscreen video">
            <span>CLOSE</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Edge-to-Edge Fullscreen HTML5 Video Viewport */}
        <div className="fullscreen-video-viewport" onClick={togglePlay}>
          {activeShow.videoUrl ? (
            <video
              ref={videoRef}
              src={activeShow.videoUrl}
              poster={activeShow.img}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              className="fullscreen-video-element"
              onTimeUpdate={handleTimeUpdate}
            />
          ) : (
            <img src={activeShow.img} alt={activeShow.title} className="fullscreen-video-fallback" />
          )}

          {/* Minimalist Bottom Vignette Gradient */}
          <div className="fullscreen-vignette" />

          {/* Minimalist HUD Controls Overlay */}
          <div className="fullscreen-bottom-hud" onClick={(e) => e.stopPropagation()}>
            <div className="hud-show-meta">
              <h2 id="video-title" className="hud-title">{activeShow.title}</h2>
              <p className="hud-subtitle">📍 {activeShow.location} &ensp;·&ensp; {activeShow.duration}</p>
            </div>

            <div className="hud-actions">
              <button className="hud-control-btn" onClick={togglePlay}>
                {isPlaying ? 'PAUSE' : 'PLAY'}
              </button>

              <button className="hud-control-btn" onClick={toggleMute}>
                {isMuted ? 'SOUND ON' : 'MUTE'}
              </button>
            </div>
          </div>

          {/* Bottom Live Playback Progress Line */}
          <div className="fullscreen-progress-track">
            <div className="fullscreen-progress-bar" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}
