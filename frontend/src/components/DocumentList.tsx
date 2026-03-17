import React from 'react'
import { useDocuments } from '../hooks/useDocuments'
import { useChat } from '../hooks/useChat'
import { useAppStore } from '../store/useAppStore'
import type { Document } from '../types'

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  processing: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  completed: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  failed: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
}

interface Props {
  onStartChat: () => void
}

export function DocumentList({ onStartChat }: Props) {
  const { documents, deleteDocument } = useDocuments()
  const { startConversation } = useChat()
  const { activeDocumentId, setActiveDocumentId } = useAppStore()

  const handleStartChat = async (doc: Document) => {
    setActiveDocumentId(doc.id)
    await startConversation(doc.id)
    onStartChat()
  }

  const handleDelete = async (e: React.MouseEvent, doc: Document) => {
    e.stopPropagation()
    if (!confirm(`Delete "${doc.name}"?`)) return
    await deleteDocument(doc.id)
    if (activeDocumentId === doc.id) setActiveDocumentId(null)
  }

  if (!documents.length) {
    return <p className="empty-state">No documents yet. Upload a PDF to get started.</p>
  }

  return (
    <ul className="document-list">
      {documents.map((doc) => (
        <li
          key={doc.id}
          className={`document-item ${activeDocumentId === doc.id ? 'document-item--active' : ''}`}
        >
          <div className="document-item__header">
            <span className="document-item__icon">{STATUS_ICONS[doc.status] || <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}</span>
            <span className="document-item__name" title={doc.name}>
              {doc.name}
            </span>
            <button
              className="btn-icon btn-icon--danger"
              onClick={(e) => handleDelete(e, doc)}
              title="Delete document"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </button>
          </div>
          <div className="document-item__meta">
            <span>{doc.file_size_mb} MB</span>
            {doc.status === 'completed' && (
              <>
                <span>·</span>
                <span>{doc.page_count} pages</span>
                <span>·</span>
                <span>{doc.chunk_count} chunks</span>
              </>
            )}
          </div>
          {doc.status === 'failed' && (
            <p className="document-item__error">{doc.error_message || 'Processing failed'}</p>
          )}
          {doc.status === 'completed' && (
            <button
              className="btn btn--primary btn--sm"
              onClick={() => handleStartChat(doc)}
            >
              New Chat
            </button>
          )}
          {(doc.status === 'pending' || doc.status === 'processing') && (
            <div className="processing-bar">
              <div className="processing-bar__fill" />
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}
