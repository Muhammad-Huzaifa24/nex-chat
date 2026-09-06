import React, { useState, useRef, useEffect } from 'react'
import { Smile, Paperclip, SendHorizonal, Camera, X, Mic, Globe } from 'lucide-react'
import { EmojiPicker } from './EmojiPicker'
import { AttachmentMenu } from './AttachmentMenu'
import { ReplyPreview } from './ReplyPreview'
import { CameraModal } from './CameraModal'
import { useDraftStore } from '../../store/draftStore'
import { useToastStore } from '../../store/toastStore'
import { fetchLinkPreview, previewCache } from '../../services/linkPreviewService'

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
  const [showCameraModal, setShowCameraModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileType, setFileType] = useState('text')
  const [inputLinkPreview, setInputLinkPreview] = useState(null)
  const [isLoadingLinkPreview, setIsLoadingLinkPreview] = useState(false)
  const [dismissedUrl, setDismissedUrl] = useState(null)

  const textareaRef = useRef(null)
  const cameraInputRef = useRef(null)
  const typingTimerRef = useRef(null)
  const isTypingRef = useRef(false)
  const lastTypingEmitRef = useRef(0)
  const addToast = useToastStore((state) => state.addToast)

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

  // Extract URL helper
  const extractUrl = (str) => {
    if (!str || typeof str !== 'string') return null
    const match = str.match(/(https?:\/\/[^\s]+|www\.[^\s]+)/i)
    if (!match) return null
    return match[0].startsWith('http') ? match[0] : `https://${match[0]}`
  }

  // Load link preview
  const loadInputPreview = async (url) => {
    if (!url) return
    if (previewCache.has(url)) {
      setInputLinkPreview(previewCache.get(url))
      setIsLoadingLinkPreview(false)
      return
    }

    setIsLoadingLinkPreview(true)
    const data = await fetchLinkPreview(url)
    setIsLoadingLinkPreview(false)
    if (data && (data.title || data.image)) {
      setInputLinkPreview(data)
    }
  }

  // Instant trigger as soon as user pastes a link
  const handlePaste = (e) => {
    const pastedText = e.clipboardData?.getData('text')
    if (pastedText) {
      const url = extractUrl(pastedText)
      if (url && url !== dismissedUrl) {
        loadInputPreview(url)
      }
    }
  }

  // Auto-detect link as text is typed or pasted
  useEffect(() => {
    const url = extractUrl(text)
    if (!url) {
      setInputLinkPreview(null)
      setIsLoadingLinkPreview(false)
      return
    }

    if (url === dismissedUrl) return

    if (!inputLinkPreview || inputLinkPreview.url !== url) {
      loadInputPreview(url)
    }
  }, [text, dismissedUrl])

  const handleTextChange = (e) => {
    const val = e.target.value
    setText(val)
    if (activeConversationId) {
      useDraftStore.getState().setDraft(activeConversationId, val)
    }

    // Throttled typing heartbeat: emit typing:start every 2 seconds while typing continues
    const now = Date.now()
    if (!isTypingRef.current || now - lastTypingEmitRef.current > 2000) {
      isTypingRef.current = true
      lastTypingEmitRef.current = now
      if (onTypingStart) onTypingStart()
    }

    // Debounce typing:stop after 2.5 seconds of inactivity
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false
      lastTypingEmitRef.current = 0
      if (onTypingStop) onTypingStop()
    }, 2500)
  }

  const handleKeyDown = (e) => {
    // Enter key creates a new line (default behavior). Ctrl+Enter or Cmd+Enter sends message.
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
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
    setInputLinkPreview(null)
    setIsLoadingLinkPreview(false)
    setDismissedUrl(null)
    if (onCancelReply) onCancelReply()

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.focus()
    }

    // Immediately stop typing indicator
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    isTypingRef.current = false
    lastTypingEmitRef.current = 0
    if (onTypingStop) onTypingStop()

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

      {/* Instant Paste / Typing Link Preview Card */}
      {(inputLinkPreview || isLoadingLinkPreview) && dismissedUrl !== (inputLinkPreview?.url || extractUrl(text)) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            backgroundColor: 'var(--bg-header, #202c33)',
            borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
            gap: 12,
            position: 'relative',
          }}
        >
          {/* Thumbnail image if available */}
          {inputLinkPreview?.image && (
            <img
              src={inputLinkPreview.image}
              alt={inputLinkPreview.title || 'Link preview'}
              style={{
                width: 52,
                height: 52,
                borderRadius: '6px',
                objectFit: 'cover',
                flexShrink: 0,
                backgroundColor: 'rgba(0,0,0,0.2)',
              }}
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          )}

          {/* Middle Text Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {isLoadingLinkPreview ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px', color: 'var(--text-muted)' }}>
                <Globe size={14} className="animate-spin" />
                <span>Fetching link preview...</span>
              </div>
            ) : (
              <>
                <div
                  style={{
                    fontSize: '11px',
                    color: '#53bdeb',
                    fontWeight: 600,
                    textTransform: 'lowercase',
                    marginBottom: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Globe size={11} />
                  <span>{inputLinkPreview?.siteName || extractUrl(text)}</span>
                </div>
                <a
                  href={inputLinkPreview?.url || extractUrl(text)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--text-primary, #e9edef)',
                    textDecoration: 'none',
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {inputLinkPreview?.title || extractUrl(text)}
                </a>
                {inputLinkPreview?.description && (
                  <div
                    style={{
                      fontSize: '11.5px',
                      color: 'var(--text-secondary, #8696a0)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginTop: 1,
                    }}
                  >
                    {inputLinkPreview.description}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Close Button to dismiss preview */}
          <button
            type="button"
            onClick={() => {
              setDismissedUrl(inputLinkPreview?.url || extractUrl(text))
              setInputLinkPreview(null)
              setIsLoadingLinkPreview(false)
            }}
            className="btn-icon"
            title="Dismiss link preview"
            style={{ width: 28, height: 28, color: 'var(--text-muted)', flexShrink: 0 }}
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
            onPaste={handlePaste}
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
            onClick={() => setShowCameraModal(true)}
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

        {/* Action Button: Voice Notes Mic when empty, Send Arrow when text/file present (WhatsApp Style) */}
        {text.trim() || selectedFile ? (
          <button
            type="button"
            onClick={handleSend}
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
              cursor: 'pointer',
              opacity: 1,
              boxShadow: '0 3px 10px rgba(0, 168, 132, 0.4)',
              transition: 'transform 0.15s ease, opacity 0.15s ease',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.06)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
            title="Send message"
          >
            <SendHorizonal size={20} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => addToast('Voice notes are coming soon in feature branch 4!', 'info', 3000)}
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
              cursor: 'pointer',
              opacity: 1,
              boxShadow: '0 3px 10px rgba(0, 168, 132, 0.4)',
              transition: 'transform 0.15s ease',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.06)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
            title="Voice note"
          >
            <Mic size={20} />
          </button>
        )}
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
          onOpenCamera={() => setShowCameraModal(true)}
        />
      )}

      {/* Live Webcam / Desktop Camera Viewfinder Modal */}
      <CameraModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onCapture={(file) => {
          setShowCameraModal(false)
          handleFileSelect(file, 'image')
        }}
        onFallbackToFile={() => {
          setShowCameraModal(false)
          cameraInputRef.current?.click()
        }}
      />
    </div>
  )
}
