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
        <div className="dropzone__icon">📄</div>
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
