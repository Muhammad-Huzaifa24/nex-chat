import React, { useEffect, useRef } from 'react'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { useThemeStore } from '../../store/themeStore'

export const EmojiPicker = ({ onEmojiSelect, onClose }) => {
  const { theme } = useThemeStore()
  const pickerRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <div
      ref={pickerRef}
      className="animate-slide-up"
      style={{
        position: 'absolute',
        bottom: 'var(--input-area-height)',
        left: 16,
        zIndex: 50,
        boxShadow: 'var(--shadow-popup)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}
    >
      <Picker
        data={data}
        onEmojiSelect={(emoji) => {
          onEmojiSelect(emoji.native)
        }}
        theme={theme === 'dark' ? 'dark' : 'light'}
        previewPosition="none"
        skinTonePosition="none"
      />
    </div>
  )
}
