import { useEffect, useRef, useState } from 'react'
import { useChat } from '../hooks/useChat'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import { useAppStore } from '../store/useAppStore'

export function ChatWindow() {
  const { messages, sendMessage, activeConversationId } = useChat()
  const isSending = useAppStore((s) => s.isSending)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isSending])

  const handleSend = async (question: string) => {
    setError(null)
    try {
      await sendMessage(question)
    } catch {
      setError('Failed to send message. Please try again.')
    }
  }

  if (!activeConversationId) {
    return (
      <div className="chat-empty">
        <div className="chat-empty__icon">💬</div>
        <p>Select a document and start a new chat</p>
      </div>
    )
  }

  return (
    <div className="chat-window">
      <div className="message-list">
        {messages.length === 0 && (
          <div className="chat-empty">
            <p>Ask your first question about this document.</p>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isSending && (
          <div className="message message--assistant">
            <div className="message__avatar">🤖</div>
            <div className="message__body">
              <div className="typing-indicator">
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}
        {error && <p className="error-text error-text--centered">{error}</p>}
        <div ref={messagesEndRef} />
      </div>
      <ChatInput onSend={handleSend} />
    </div>
  )
}
