import apiClient from './client'
import type { Document } from '../types'

export const documentsApi = {
  list: () => apiClient.get<Document[]>('/documents/'),

  upload: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post<Document>('/documents/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  get: (id: number) => apiClient.get<Document>(`/documents/${id}/`),

  delete: (id: number) => apiClient.delete(`/documents/${id}/`),
}
