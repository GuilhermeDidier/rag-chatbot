import { useState, useRef, KeyboardEvent } from 'react'
import { useAppStore } from '../store/useAppStore'

interface Props {
  onSend: (message: string) => void
}

export function ChatInput({ onSend }: Props) {
  const [value, setValue] = useState('')
  const isSending = useAppStore((s) => s.isSending)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || isSending) return
    onSend(trimmed)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    // Auto-resize
    const ta = e.target
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`
  }

  return (
    <div className="chat-input">
      <textarea
        ref={textareaRef}
        className="chat-input__textarea"
        placeholder="Ask a question about the document… (Enter to send, Shift+Enter for new line)"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={isSending}
        rows={1}
      />
      <button
        className="btn btn--primary chat-input__send"
        onClick={handleSend}
        disabled={!value.trim() || isSending}
      >
        {isSending ? '...' : '➤'}
      </button>
    </div>
  )
}
