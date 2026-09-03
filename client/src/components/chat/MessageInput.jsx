import React, { useState, useRef, useEffect } from 'react'
import { Smile, Paperclip, SendHorizonal, Camera, X } from 'lucide-react'
import { EmojiPicker } from './EmojiPicker'
import { AttachmentMenu } from './AttachmentMenu'
import { ReplyPreview } from './ReplyPreview'
import { useDraftStore } from '../../store/draftStore'

export const MessageInput = ({
  activeConversationId,
  onSendMessage,
  onTypingStart,
  onTypingStop,
  replyingTo,
  onCancelReply,
}) => {
  const [text, setText] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [showAttachment, setShowAttachment] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileType, setFileType] = useState('text')

  const textareaRef = useRef(null)
  const cameraInputRef = useRef(null)
  const typingTimerRef = useRef(null)
  const isTypingRef = useRef(false)

  // Load persistent draft when switching conversation
  useEffect(() => {
    if (activeConversationId) {
      const savedDraft = useDraftStore.getState().getDraft(activeConversationId)
      setText(savedDraft || '')
    } else {
      setText('')
    }
  }, [activeConversationId])

  // Auto-focus textarea on conversation change and tab switch / window focus
  useEffect(() => {
    const focusInput = () => {
      if (document.visibilityState === 'visible' && textareaRef.current) {
        textareaRef.current.focus()
      }
    }

    focusInput()
    window.addEventListener('focus', focusInput)
    document.addEventListener('visibilitychange', focusInput)

    return () => {
      window.removeEventListener('focus', focusInput)
      document.removeEventListener('visibilitychange', focusInput)
    }
  }, [activeConversationId])

  // Focus on reply change
  useEffect(() => {
    if (replyingTo && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [replyingTo])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [text])

  const handleTextChange = (e) => {
    const val = e.target.value
    setText(val)
    if (activeConversationId) {
      useDraftStore.getState().setDraft(activeConversationId, val)
    }

    // Trigger typing:start only ONCE when typing begins
    if (!isTypingRef.current) {
      isTypingRef.current = true
      if (onTypingStart) onTypingStart()
    }

    // Debounce typing:stop after 1.5 seconds of inactivity
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false
      if (onTypingStop) onTypingStop()
    }, 1500)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = (file, type) => {
    setSelectedFile(file)
    setFileType(type)
    setTimeout(() => {
      textareaRef.current?.focus()
    }, 50)
  }

  const handleSend = () => {
    const trimmedText = text.trim()
    if (!trimmedText && !selectedFile) return

    const payload = {
      content: trimmedText,
      file: selectedFile,
      type: selectedFile ? fileType : 'text',
      replyTo: replyingTo?._id,
    }

    // Clear draft in store
    if (activeConversationId) {
      useDraftStore.getState().clearDraft(activeConversationId)
    }

    // Immediately clear input fields so user can type the next message instantly
    setText('')
    setSelectedFile(null)
    setFileType('text')
    if (onCancelReply) onCancelReply()

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.focus()
    }

    // Immediately stop typing indicator
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    if (isTypingRef.current) {
      isTypingRef.current = false
      if (onTypingStop) onTypingStop()
    }

    // Fire non-blocking asynchronous send
    onSendMessage(payload)
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-input)',
        borderTop: '1px solid var(--border-color)',
        position: 'relative',
        zIndex: 20,
        flexShrink: 0,
      }}
    >
      {/* Hidden Camera Input with native environment capture */}
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files[0]
          if (file) handleFileSelect(file, 'image')
          e.target.value = ''
        }}
      />

      {/* Reply Preview */}
      {replyingTo && <ReplyPreview replyMessage={replyingTo} onCancel={onCancelReply} />}

      {/* Selected File Preview */}
      {selectedFile && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 16px',
            backgroundColor: 'var(--bg-header)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)', fontWeight: 500 }} className="truncate">
            📎 {selectedFile.name} (
            {selectedFile.size >= 1024 * 1024
              ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`
              : `${(selectedFile.size / 1024).toFixed(0)} KB`}
            )
          </div>
          <button
            onClick={() => setSelectedFile(null)}
            className="btn-icon"
            style={{ width: 28, height: 28 }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Input row — WhatsApp style */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          padding: '6px 8px',
          gap: 6,
          minHeight: 'var(--input-area-height, 52px)',
        }}
      >
        {/* Rounded input container with icons inside */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'flex-end',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 24,
            padding: '4px 6px',
            border: '1px solid var(--border-color)',
            minHeight: 44,
          }}
        >
          {/* Emoji Button */}
          <button
            type="button"
            onClick={() => {
              setShowEmoji(!showEmoji)
              setShowAttachment(false)
            }}
            className="btn-icon"
            title="Emoji"
            style={{
              width: 36,
              height: 36,
              flexShrink: 0,
              color: 'var(--text-muted)',
            }}
          >
            <Smile size={22} />
          </button>

          {/* Text Area */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            style={{
              flex: 1,
              resize: 'none',
              maxHeight: 120,
              fontSize: '15px',
              color: 'var(--text-primary)',
              lineHeight: 1.45,
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              padding: '7px 2px',
              margin: 0,
              fontFamily: 'inherit',
            }}
          />

          {/* Attachment Button */}
          <button
            type="button"
            onClick={() => {
              setShowAttachment(!showAttachment)
              setShowEmoji(false)
            }}
            className="btn-icon"
            title="Attach files"
            style={{
              width: 36,
              height: 36,
              flexShrink: 0,
              color: 'var(--text-muted)',
              transform: 'rotate(-45deg)',
            }}
          >
            <Paperclip size={21} />
          </button>

          {/* Direct Camera Button */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="btn-icon"
            title="Camera"
            style={{
              width: 36,
              height: 36,
              flexShrink: 0,
              color: 'var(--text-muted)',
            }}
          >
            <Camera size={21} />
          </button>
        </div>

        {/* Send Button (WhatsApp circular teal — outside the input field) */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim() && !selectedFile}
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            backgroundColor: 'var(--primary-color)',
            color: '#ffffff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: (!text.trim() && !selectedFile) ? 'default' : 'pointer',
            opacity: (!text.trim() && !selectedFile) ? 0.45 : 1,
            boxShadow: (!text.trim() && !selectedFile) ? 'none' : '0 3px 10px rgba(0, 168, 132, 0.4)',
            transition: 'transform 0.15s ease, opacity 0.15s ease',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            if (text.trim() || selectedFile) e.currentTarget.style.transform = 'scale(1.06)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
          }}
          title="Send message"
        >
          <SendHorizonal size={20} />
        </button>
      </div>

      {/* Emoji Picker Popup */}
      {showEmoji && (
        <EmojiPicker
          onEmojiSelect={(emoji) => {
            const newText = text + emoji
            setText(newText)
            if (activeConversationId) {
              useDraftStore.getState().setDraft(activeConversationId, newText)
            }
            textareaRef.current?.focus()
          }}
          onClose={() => setShowEmoji(false)}
        />
      )}

      {/* Attachment Menu Popup */}
      {showAttachment && (
        <AttachmentMenu
          onSelectFile={handleFileSelect}
          onClose={() => setShowAttachment(false)}
        />
      )}
    </div>
  )
}
