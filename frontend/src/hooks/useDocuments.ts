import { useEffect, useRef, useCallback } from 'react'
import { documentsApi } from '../api/documents'
import { useAppStore } from '../store/useAppStore'

export function useDocuments() {
  const { documents, setDocuments, addDocument, updateDocument, removeDocument, setIsUploading } =
    useAppStore()
  const pollingRefs = useRef<Map<number, ReturnType<typeof setInterval>>>(new Map())

  const loadDocuments = useCallback(async () => {
    const { data } = await documentsApi.list()
    setDocuments(data)
  }, [setDocuments])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  // Poll document status until completed/failed
  const startPolling = useCallback(
    (docId: number) => {
      if (pollingRefs.current.has(docId)) return
      const interval = setInterval(async () => {
        try {
          const { data } = await documentsApi.get(docId)
          updateDocument(data)
          if (data.status === 'completed' || data.status === 'failed') {
            clearInterval(interval)
            pollingRefs.current.delete(docId)
          }
        } catch {
          clearInterval(interval)
          pollingRefs.current.delete(docId)
        }
      }, 2000)
      pollingRefs.current.set(docId, interval)
    },
    [updateDocument]
  )

  useEffect(() => {
    // Start polling for any pending/processing docs on mount
    documents
      .filter((d) => d.status === 'pending' || d.status === 'processing')
      .forEach((d) => startPolling(d.id))
  }, [documents, startPolling])

  useEffect(() => {
    return () => {
      pollingRefs.current.forEach((interval) => clearInterval(interval))
    }
  }, [])

  const uploadDocument = useCallback(
    async (file: File) => {
      setIsUploading(true)
      try {
        const { data } = await documentsApi.upload(file)
        addDocument(data)
        startPolling(data.id)
        return data
      } finally {
        setIsUploading(false)
      }
    },
    [addDocument, startPolling, setIsUploading]
  )

  const deleteDocument = useCallback(
    async (id: number) => {
      await documentsApi.delete(id)
      removeDocument(id)
      // Stop polling if active
      const interval = pollingRefs.current.get(id)
      if (interval) {
        clearInterval(interval)
        pollingRefs.current.delete(id)
      }
    },
    [removeDocument]
  )

  return { documents, uploadDocument, deleteDocument, loadDocuments }
}
