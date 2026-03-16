import { create } from 'zustand'
import type { Document, Conversation, Message } from '../types'

interface AppState {
  // Documents
  documents: Document[]
  setDocuments: (docs: Document[]) => void
  addDocument: (doc: Document) => void
  updateDocument: (doc: Document) => void
  removeDocument: (id: number) => void

  // Conversations
  conversations: Conversation[]
  setConversations: (convs: Conversation[]) => void
  addConversation: (conv: Conversation) => void
  removeConversation: (id: number) => void

  // Active state
  activeDocumentId: number | null
  setActiveDocumentId: (id: number | null) => void
  activeConversationId: number | null
  setActiveConversationId: (id: number | null) => void

  // Messages (for active conversation)
  messages: Message[]
  setMessages: (msgs: Message[]) => void
  addMessage: (msg: Message) => void

  // UI
  darkMode: boolean
  toggleDarkMode: () => void
  isSending: boolean
  setIsSending: (v: boolean) => void
  isUploading: boolean
  setIsUploading: (v: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  documents: [],
  setDocuments: (documents) => set({ documents }),
  addDocument: (doc) => set((s) => ({ documents: [doc, ...s.documents] })),
  updateDocument: (doc) =>
    set((s) => ({ documents: s.documents.map((d) => (d.id === doc.id ? doc : d)) })),
  removeDocument: (id) =>
    set((s) => ({ documents: s.documents.filter((d) => d.id !== id) })),

  conversations: [],
  setConversations: (conversations) => set({ conversations }),
  addConversation: (conv) => set((s) => ({ conversations: [conv, ...s.conversations] })),
  removeConversation: (id) =>
    set((s) => ({ conversations: s.conversations.filter((c) => c.id !== id) })),

  activeDocumentId: null,
  setActiveDocumentId: (id) => set({ activeDocumentId: id }),
  activeConversationId: null,
  setActiveConversationId: (id) => set({ activeConversationId: id }),

  messages: [],
  setMessages: (messages) => set({ messages }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),

  darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
  toggleDarkMode: () =>
    set((s) => {
      const next = !s.darkMode
      document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
      return { darkMode: next }
    }),

  isSending: false,
  setIsSending: (v) => set({ isSending: v }),
  isUploading: false,
  setIsUploading: (v) => set({ isUploading: v }),
}))
