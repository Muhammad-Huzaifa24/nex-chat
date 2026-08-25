import React, { useState, useRef, useEffect } from 'react'
import { Smile, Paperclip, Send, X, Loader2 } from 'lucide-react'
import { EmojiPicker } from './EmojiPicker'
import { AttachmentMenu } from './AttachmentMenu'
import { ReplyPreview } from './ReplyPreview'

export const MessageInput = ({
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
  const [isSending, setIsSending] = useState(false)

  const textareaRef = useRef(null)
  const typingTimerRef = useRef(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [text])

  const handleTextChange = (e) => {
    setText(e.target.value)

    // Trigger typing event
    if (onTypingStart) onTypingStart()
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => {
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
  }

  const handleSend = async () => {
    if ((!text.trim() && !selectedFile) || isSending) return

    setIsSending(true)
    if (onTypingStop) onTypingStop()

    await onSendMessage({
      content: text,
      file: selectedFile,
      type: selectedFile ? fileType : 'text',
      replyTo: replyingTo?._id,
    })

    setText('')
    setSelectedFile(null)
    setFileType('text')
    setIsSending(false)
    if (onCancelReply) onCancelReply()

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
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
      }}
    >
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

      {/* Input row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          padding: '8px 12px',
          gap: 8,
          minHeight: 'var(--input-area-height)',
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
        >
          <Smile size={22} />
        </button>

        {/* Attachment Button */}
        <button
          type="button"
          onClick={() => {
            setShowAttachment(!showAttachment)
            setShowEmoji(false)
          }}
          className="btn-icon"
          title="Attach"
        >
          <Paperclip size={22} />
        </button>

        {/* Text Area */}
        <div
          style={{
            flex: 1,
            backgroundColor: 'var(--bg-app)',
            borderRadius: 'var(--radius-lg)',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            border: '1px solid var(--border-color)',
          }}
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            style={{
              width: '100%',
              resize: 'none',
              maxHeight: 120,
              fontSize: 'var(--font-size-base)',
              color: 'var(--text-primary)',
              lineHeight: 1.4,
            }}
          />
        </div>

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={(!text.trim() && !selectedFile) || isSending}
          className="btn-primary"
          style={{
            width: 42,
            height: 42,
            borderRadius: 'var(--radius-full)',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Send"
        >
          {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>

      {/* Emoji Picker Popup */}
      {showEmoji && (
        <EmojiPicker
          onEmojiSelect={(emoji) => {
            setText((prev) => prev + emoji)
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
