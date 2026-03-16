import { useCallback } from 'react'
import { conversationsApi } from '../api/conversations'
import { useAppStore } from '../store/useAppStore'
import type { Message } from '../types'

export function useChat() {
  const {
    messages,
    setMessages,
    addMessage,
    conversations,
    setConversations,
    addConversation,
    removeConversation,
    activeConversationId,
    setActiveConversationId,
    isSending,
    setIsSending,
  } = useAppStore()

  const loadConversations = useCallback(async () => {
    const { data } = await conversationsApi.list()
    setConversations(data)
  }, [setConversations])

  const startConversation = useCallback(
    async (documentId: number) => {
      const { data } = await conversationsApi.create(documentId)
      addConversation(data)
      setActiveConversationId(data.id)
      setMessages([])
      return data
    },
    [addConversation, setActiveConversationId, setMessages]
  )

  const openConversation = useCallback(
    async (conversationId: number) => {
      setActiveConversationId(conversationId)
      const { data } = await conversationsApi.get(conversationId)
      setMessages(data.messages)
    },
    [setActiveConversationId, setMessages]
  )

  const deleteConversation = useCallback(
    async (id: number) => {
      await conversationsApi.delete(id)
      removeConversation(id)
      const store = useAppStore.getState()
      if (store.activeConversationId === id) {
        store.setActiveConversationId(null)
        store.setMessages([])
      }
    },
    [removeConversation]
  )

  const sendMessage = useCallback(
    async (question: string) => {
      if (!activeConversationId || isSending) return

      // Optimistic UI — add user message immediately
      const optimisticUser: Message = {
        id: Date.now(),
        role: 'user',
        content: question,
        source_chunks: [],
        tokens_used: 0,
        created_at: new Date().toISOString(),
      }
      addMessage(optimisticUser)
      setIsSending(true)

      try {
        const { data } = await conversationsApi.sendMessage(activeConversationId, question)

        // Replace optimistic message with real one + add assistant message
        setMessages([
          ...useAppStore.getState().messages.filter((m) => m.id !== optimisticUser.id),
          data.user_message,
          data.assistant_message,
        ])
      } catch (err) {
        // Remove optimistic message on error
        setMessages(useAppStore.getState().messages.filter((m) => m.id !== optimisticUser.id))
        throw err
      } finally {
        setIsSending(false)
      }
    },
    [activeConversationId, isSending, addMessage, setMessages, setIsSending]
  )

  return {
    messages,
    conversations,
    activeConversationId,
    isSending,
    loadConversations,
    startConversation,
    openConversation,
    deleteConversation,
    sendMessage,
  }
}
