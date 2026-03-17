import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useDocuments } from '../hooks/useDocuments'
import { useAppStore } from '../store/useAppStore'

export function DocumentUpload() {
  const { uploadDocument } = useDocuments()
  const isUploading = useAppStore((s) => s.isUploading)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!acceptedFiles.length) return
      const file = acceptedFiles[0]
      setError(null)
      try {
        await uploadDocument(file)
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { file?: string[] } } })?.response?.data?.file?.[0] ||
          'Upload failed. Please try again.'
        setError(msg)
      }
    },
    [uploadDocument]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    disabled: isUploading,
  })

  return (
    <div className="upload-section">
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'dropzone--active' : ''} ${isUploading ? 'dropzone--disabled' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="dropzone__icon"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg></div>
        {isUploading ? (
          <p>Uploading...</p>
        ) : isDragActive ? (
          <p>Drop the PDF here</p>
        ) : (
          <>
            <p>Drag & drop a PDF here</p>
            <p className="dropzone__hint">or click to browse (max 50MB)</p>
          </>
        )}
      </div>
      {error && <p className="error-text">{error}</p>}
    </div>
  )
}
