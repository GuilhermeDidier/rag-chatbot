import { useState } from 'react'
import type { SourceChunk } from '../types'

interface Props {
  chunks: SourceChunk[]
}

export function SourceCitations({ chunks }: Props) {
  const [expanded, setExpanded] = useState(false)

  if (!chunks.length) return null

  return (
    <div className="citations">
      <button
        className="citations__toggle"
        onClick={() => setExpanded((p) => !p)}
      >
        📎 {chunks.length} source{chunks.length > 1 ? 's' : ''} {expanded ? '▲' : '▼'}
      </button>
      {expanded && (
        <ul className="citations__list">
          {chunks.map((chunk, i) => (
            <li key={i} className="citation">
              <div className="citation__meta">
                Page {chunk.page_number} &mdash; similarity {(chunk.similarity * 100).toFixed(0)}%
              </div>
              <p className="citation__text">{chunk.text}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
