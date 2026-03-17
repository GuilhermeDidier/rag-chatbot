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
        <div className="chat-empty__icon"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>
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
            <div className="message__avatar"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="5" r="1"/></svg></div>
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
