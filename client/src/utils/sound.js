// High-performance, zero-latency Web Audio API notification sounds
import { useSettingsStore } from '../store/settingsStore'

let audioCtx = null

const getAudioContext = () => {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (AudioContext) {
      audioCtx = new AudioContext()
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {})
  }
  return audioCtx
}

/**
 * Plays a custom notification sound preset
 * @param {string} specificTone - Optional tone override ('whatsapp_classic' | 'gentle_pop' | 'crystal_bell' | 'subtle_pip')
 */
export const playNotificationSound = (specificTone = null) => {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const tone = specificTone || useSettingsStore.getState().notificationTone || 'whatsapp_classic'
    const now = ctx.currentTime

    switch (tone) {
      case 'gentle_pop': {
        // Deep rounded organic pop
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(520, now)
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.08)
        gain.gain.setValueAtTime(0.35, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.09)
        break
      }

      case 'crystal_bell': {
        // Bright bell harmonic chime
        const freqs = [1046.5, 1318.5, 1567.9] // C6, E6, G6
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = 'triangle'
          osc.frequency.setValueAtTime(freq, now + idx * 0.04)
          gain.gain.setValueAtTime(0.2, now + idx * 0.04)
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.25)
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start(now + idx * 0.04)
          osc.stop(now + idx * 0.04 + 0.25)
        })
        break
      }

      case 'subtle_pip': {
        // Subtle minimal tick
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(880, now)
        gain.gain.setValueAtTime(0.18, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.04)
        break
      }

      case 'whatsapp_classic':
      default: {
        // Tone 1: 784Hz chime (G5)
        const osc1 = ctx.createOscillator()
        const gain1 = ctx.createGain()
        osc1.type = 'sine'
        osc1.frequency.setValueAtTime(784, now)
        gain1.gain.setValueAtTime(0.25, now)
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12)
        osc1.connect(gain1)
        gain1.connect(ctx.destination)
        osc1.start(now)
        osc1.stop(now + 0.12)

        // Tone 2: 1046.5Hz high chime (C6)
        const osc2 = ctx.createOscillator()
        const gain2 = ctx.createGain()
        osc2.type = 'sine'
        osc2.frequency.setValueAtTime(1046.5, now + 0.07)
        gain2.gain.setValueAtTime(0.3, now + 0.07)
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22)
        osc2.connect(gain2)
        gain2.connect(ctx.destination)
        osc2.start(now + 0.07)
        osc2.stop(now + 0.22)
        break
      }
    }
  } catch (err) {
    console.warn('[NotificationSound] AudioContext playback skipped', err)
  }
}
