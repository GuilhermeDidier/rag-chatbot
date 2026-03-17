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
          {darkMode ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          )}
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
