import { useDocuments } from '../hooks/useDocuments'
import { useChat } from '../hooks/useChat'
import { useAppStore } from '../store/useAppStore'
import type { Document } from '../types'

const STATUS_ICONS: Record<string, string> = {
  pending: '⏳',
  processing: '⚙️',
  completed: '✅',
  failed: '❌',
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
            <span className="document-item__icon">{STATUS_ICONS[doc.status] || '📄'}</span>
            <span className="document-item__name" title={doc.name}>
              {doc.name}
            </span>
            <button
              className="btn-icon btn-icon--danger"
              onClick={(e) => handleDelete(e, doc)}
              title="Delete document"
            >
              🗑
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
