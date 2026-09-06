import React, { useState, useRef, useEffect } from 'react'
import { X, Camera, RotateCcw, AlertCircle } from 'lucide-react'

export const CameraModal = ({ isOpen, onClose, onCapture, onFallbackToFile }) => {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [error, setError] = useState(null)
  const [facingMode, setFacingMode] = useState('user') // 'user' | 'environment'

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }

  const startCamera = async (mode = facingMode) => {
    stopStream()
    setError(null)
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera API not supported in this browser')
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      console.warn('Webcam access error:', err)
      setError(err.message || 'Camera permission denied or camera not found')
    }
  }

  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode)
    } else {
      stopStream()
    }
    return () => stopStream()
  }, [isOpen, facingMode])

  const handleTakePhoto = () => {
    if (!videoRef.current) return
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' })
        stopStream()
        onCapture(file)
        onClose()
      },
      'image/jpeg',
      0.92
    )
  }

  const handleFlipCamera = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(nextMode)
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(6px)',
        padding: 16,
      }}
    >
      <div
        className="animate-scale-up"
        style={{
          position: 'relative',
          backgroundColor: '#111b21',
          borderRadius: 16,
          overflow: 'hidden',
          width: '100%',
          maxWidth: 640,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            backgroundColor: '#202c33',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#e9edef', fontWeight: 600, fontSize: 15 }}>
            <Camera size={20} color="var(--primary-color)" />
            <span>Take photo</span>
          </div>
          <button
            onClick={() => {
              stopStream()
              onClose()
            }}
            className="btn-icon"
            style={{ width: 32, height: 32, color: '#aebac1' }}
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Viewfinder Viewport */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 400,
            backgroundColor: '#000000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {error ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                padding: 24,
                textAlign: 'center',
                color: '#e9edef',
              }}
            >
              <AlertCircle size={44} color="#f15c6d" />
              <p style={{ fontSize: 14, margin: 0, color: '#8696a0', maxWidth: 360 }}>
                {error}. You can still upload a photo from your files.
              </p>
              <button
                type="button"
                onClick={() => {
                  stopStream()
                  onClose()
                  if (onFallbackToFile) onFallbackToFile()
                }}
                className="btn-primary"
                style={{ padding: '8px 18px', fontSize: 14, marginTop: 6 }}
              >
                Choose from Files
              </button>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: facingMode === 'user' ? 'scaleX(-1)' : 'none', // Mirror selfie camera
              }}
            />
          )}

          {/* Flip Camera Button (if multiple cameras available) */}
          {!error && (
            <button
              type="button"
              onClick={handleFlipCamera}
              title="Flip camera"
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                width: 38,
                height: 38,
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                color: '#ffffff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                backdropFilter: 'blur(4px)',
              }}
            >
              <RotateCcw size={18} />
            </button>
          )}
        </div>

        {/* Capture Controls Footer */}
        {!error && (
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: '#202c33',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 20,
            }}
          >
            {/* Shutter Button (WhatsApp Web Style) */}
            <button
              type="button"
              onClick={handleTakePhoto}
              title="Capture Photo"
              style={{
                width: 58,
                height: 58,
                borderRadius: '50%',
                backgroundColor: 'var(--primary-color)',
                border: '3px solid #ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(0, 168, 132, 0.4)',
                transition: 'transform 0.1s ease',
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <Camera size={26} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
