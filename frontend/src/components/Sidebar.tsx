import { useState } from 'react'
import { DocumentUpload } from './DocumentUpload'
import { DocumentList } from './DocumentList'
import { ConversationList } from './ConversationList'
import { useAppStore } from '../store/useAppStore'

interface Props {
  onStartChat: () => void
}

export function Sidebar({ onStartChat }: Props) {
  const { darkMode, toggleDarkMode } = useAppStore()
  const [tab, setTab] = useState<'documents' | 'chats'>('documents')

  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <h1 className="sidebar__title">RAG Chatbot</h1>
        <button className="btn-icon" onClick={toggleDarkMode} title="Toggle dark mode">
          {darkMode ? '☀️' : '🌙'}
        </button>
      </div>

      <div className="tab-bar">
        <button
          className={`tab ${tab === 'documents' ? 'tab--active' : ''}`}
          onClick={() => setTab('documents')}
        >
          Documents
        </button>
        <button
          className={`tab ${tab === 'chats' ? 'tab--active' : ''}`}
          onClick={() => setTab('chats')}
        >
          Chats
        </button>
      </div>

      <div className="sidebar__content">
        {tab === 'documents' ? (
          <>
            <DocumentUpload />
            <DocumentList onStartChat={onStartChat} />
          </>
        ) : (
          <ConversationList />
        )}
      </div>
    </aside>
  )
}
