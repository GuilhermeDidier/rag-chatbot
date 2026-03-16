import apiClient from './client'
import type { Conversation, ChatResponse } from '../types'

export const conversationsApi = {
  list: () => apiClient.get<Conversation[]>('/conversations/'),

  create: (documentId: number) =>
    apiClient.post<Conversation>('/conversations/', { document: documentId }),

  get: (id: number) => apiClient.get<Conversation>(`/conversations/${id}/`),

  delete: (id: number) => apiClient.delete(`/conversations/${id}/`),

  sendMessage: (conversationId: number, question: string) =>
    apiClient.post<ChatResponse>(`/conversations/${conversationId}/messages/`, { question }),
}
