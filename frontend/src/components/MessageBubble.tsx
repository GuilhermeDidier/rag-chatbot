import ReactMarkdown from 'react-markdown'
import { SourceCitations } from './SourceCitations'
import type { Message } from '../types'

interface Props {
  message: Message
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user'

  return (
    <div className={`message ${isUser ? 'message--user' : 'message--assistant'}`}>
      <div className="message__avatar">{isUser ? '👤' : '🤖'}</div>
      <div className="message__body">
        <div className="message__content">
          {isUser ? (
            <p>{message.content}</p>
          ) : (
            <ReactMarkdown>{message.content}</ReactMarkdown>
          )}
        </div>
        {!isUser && message.source_chunks.length > 0 && (
          <SourceCitations chunks={message.source_chunks} />
        )}
        {!isUser && message.tokens_used > 0 && (
          <span className="message__tokens">{message.tokens_used} tokens</span>
        )}
      </div>
    </div>
  )
}
