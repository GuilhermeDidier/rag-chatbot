export type DocumentStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface Document {
  id: number
  name: string
  file_size: number
  file_size_mb: number
  page_count: number
  chunk_count: number
  status: DocumentStatus
  error_message: string
  collection_name: string
  created_at: string
  updated_at: string
}

export interface SourceChunk {
  text: string
  page_number: number
  similarity: number
}

export interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
  source_chunks: SourceChunk[]
  tokens_used: number
  created_at: string
}

export interface Conversation {
  id: number
  document: number
  document_name: string
  title: string
  message_count: number
  messages: Message[]
  created_at: string
  updated_at: string
}

export interface ChatResponse {
  user_message: Message
  assistant_message: Message
}
