import { useEffect } from 'react'
import { useChat } from '../hooks/useChat'

export function ConversationList() {
  const { conversations, activeConversationId, openConversation, deleteConversation, loadConversations } =
    useChat()

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  if (!conversations.length) return null

  return (
    <div className="conversation-list">
      <h3 className="sidebar__section-title">Recent Chats</h3>
      <ul>
        {conversations.map((conv) => (
          <li
            key={conv.id}
            className={`conv-item ${activeConversationId === conv.id ? 'conv-item--active' : ''}`}
            onClick={() => openConversation(conv.id)}
          >
            <span className="conv-item__title" title={conv.title}>
              {conv.title}
            </span>
            <div className="conv-item__meta">
              <span className="conv-item__doc">{conv.document_name}</span>
              <button
                className="btn-icon btn-icon--danger"
                onClick={(e) => {
                  e.stopPropagation()
                  if (confirm('Delete this conversation?')) deleteConversation(conv.id)
                }}
                title="Delete conversation"
              >
                🗑
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
