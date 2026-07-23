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

interface ShowModalProps {
  show: ShowItem | null
  onClose: () => void
}

export const ShowModal: React.FC<ShowModalProps> = ({ show, onClose }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [activeShow, setActiveShow] = useState<ShowItem | null>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (show) {
      setActiveShow(show)
      setIsPlaying(true)
      setIsMuted(false)

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
      }, 400)
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

  return (
    <div
      className={`pure-video-backdrop ${isVisible ? 'open' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-title"
    >
      <div className="pure-video-glow" aria-hidden />

      <div className={`pure-video-card ${isVisible ? 'open' : ''}`}>
        {/* Awwwards Floating Close Button */}
        <button className="video-modal-close" onClick={onClose} aria-label="Close video">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Pure Video Surface */}
        <div className="pure-video-viewport" onClick={togglePlay}>
          {activeShow.videoUrl ? (
            <video
              ref={videoRef}
              src={activeShow.videoUrl}
              poster={activeShow.img}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              className="pure-video-player"
            />
          ) : (
            <img src={activeShow.img} alt={activeShow.title} className="pure-video-fallback" />
          )}

          {/* Minimalist Overlay Gradient */}
          <div className="pure-video-overlay-gradient" />

          {/* Minimalist Info & Control Bar */}
          <div className="pure-video-bottom-bar" onClick={(e) => e.stopPropagation()}>
            <div className="video-show-info">
              <span className="video-badge">{activeShow.category}</span>
              <h3 id="video-title" className="video-show-title">{activeShow.title}</h3>
              <p className="video-show-meta">
                📍 {activeShow.location} &ensp;·&ensp; <span className="cyan-text">{activeShow.drones} DRONES</span>
              </p>
            </div>

            <div className="video-action-buttons">
              <button className="video-control-pill" onClick={togglePlay}>
                {isPlaying ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16" rx="1" />
                      <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5,3 19,12 5,21" />
                    </svg>
                    <span>Play</span>
                  </>
                )}
              </button>

              <button className="video-control-pill" onClick={toggleMute}>
                {isMuted ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="1" y1="1" x2="23" y2="23" />
                      <path d="M9 9L5 13H1v-2h4l4 4V9z" />
                    </svg>
                    <span>Sound On</span>
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    </svg>
                    <span>Mute</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
